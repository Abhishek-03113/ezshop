import { describeSupportedProductUrls, isSupportedProductUrl, type ProductSnapshot } from "@picky/catalog";
import type { CaptureResult } from "../capture-result.ts";
import type { ComparisonsClient } from "../comparisons/comparisons-client.ts";
import { comparisonNameFor } from "../snapshot-category.ts";
import type { ToastMessage } from "../toast/toast-message.ts";
import type { ToastPort } from "../toast/toast-port.ts";
import type { AddTarget } from "./add-target.ts";
import type { BadgeCounter } from "./badge-counter.ts";
import type { HtmlFetcher } from "./html-fetcher.ts";
import { titleFromProductUrl } from "./product-link.ts";
import type { SnapshotReader } from "./snapshot-reader.ts";

export interface LinkCaptureDependencies {
  fetcher: HtmlFetcher;
  /** Parses downloaded page HTML into a snapshot. */
  reader: SnapshotReader;
  /** Reads the product from an open tab's live DOM. */
  capturePage: (tabId: number) => Promise<CaptureResult>;
  sendSnapshot: (snapshot: ProductSnapshot) => Promise<string>;
  /** Opens Quick Look in a tab on a product that is not that tab's page. */
  showQuickLook: (tabId: number, snapshot: ProductSnapshot) => Promise<void>;
  comparisons: ComparisonsClient;
  settings: {
    lastComparisonId(): Promise<string | null>;
    setLastComparisonId(id: string): Promise<void>;
  };
  toasts: ToastPort;
  badge: BadgeCounter;
  newToastId: () => string;
  onComparisonsChanged: () => void;
  log: (event: string, fields: Record<string, string | number>) => void;
}

export interface LinkAddJob {
  url: string;
  /** Link text for the "Reading …" toast; empty falls back to the URL slug. */
  label: string;
  target: AddTarget;
  /** The tab to show toasts in; null shows none. */
  tabId: number | null;
  /** "page": `url` is open in `tabId`, so its live DOM is read; "link": the page is downloaded and parsed here. */
  source: "link" | "page";
}

interface CapturedProduct {
  productId: string;
  snapshot: ProductSnapshot;
}

interface Placement {
  comparisonId: string;
  comparisonName: string;
  count: number;
}

/**
 * "Add to Picky" from the context menu or Alt+click: read the product (the open page's DOM, or a link
 * downloaded with the user's cookies and parsed in the extension) → save → add to a comparison, with toasts
 * and a toolbar badge while it runs. Failures end in an error toast and never throw.
 *
 * @example await new LinkCaptureService(deps).add({ url, label, target: { kind: "last" }, tabId: 7 })
 */
export class LinkCaptureService {
  constructor(private readonly deps: LinkCaptureDependencies) {}

  async add(job: LinkAddJob): Promise<void> {
    const id = this.deps.newToastId();
    if (!isSupportedProductUrl(job.url)) return this.rejectLink(job.url, job.tabId, id);
    await this.deps.badge.begin();
    await this.deps.toasts.show(job.tabId, {
      kind: "reading",
      id,
      title: job.label === "" ? titleFromProductUrl(job.url) : job.label,
      destination: describeTarget(job.target),
    });
    try {
      await this.deps.toasts.show(job.tabId, await this.captureAndPlace(job, id));
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.deps.log("link_capture.failed", { url: job.url, reason });
      await this.deps.toasts.show(job.tabId, { kind: "failed", id, reason });
    } finally {
      await this.deps.badge.end();
    }
  }

  /** Refuses before any network request: the menu patterns are coarse and an Alt+click target is page-controlled. */
  private async rejectLink(url: string, tabId: number | null, id: string): Promise<void> {
    const reason = `"${url}" is not a product link; expected ${describeSupportedProductUrls()}`;
    this.deps.log("link_capture.rejected", { url });
    await this.deps.toasts.show(tabId, { kind: "failed", id, reason });
  }

  /**
   * Saves a product link to the library only, with no toasts or badge (the web app's paste-a-link), and
   * returns the stored product's id. Throws on unsupported links and failed fetches, parses or saves.
   */
  async importLink(url: string): Promise<string> {
    if (!isSupportedProductUrl(url)) {
      throw new Error(`"${url}" is not a product link; expected ${describeSupportedProductUrls()}`);
    }
    const { productId, snapshot } = await this.readLink(url);
    this.deps.log("link_capture.imported", { url, productId, externalId: snapshot.externalId });
    return productId;
  }

  /**
   * "Quick Look" on a link: download and parse it, then show its specs over the current page without
   * saving anything. The badge counts while it runs; a failure ends in an error toast and never throws.
   */
  async quickLook(url: string, tabId: number): Promise<void> {
    if (!isSupportedProductUrl(url)) return this.rejectLink(url, tabId, this.deps.newToastId());
    await this.deps.badge.begin();
    try {
      const snapshot = await this.deps.reader.read(await this.deps.fetcher.fetchHtml(url), url);
      await this.deps.showQuickLook(tabId, snapshot);
      this.deps.log("link_capture.quicklook", { url, externalId: snapshot.externalId });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.deps.log("link_capture.quicklook_failed", { url, reason });
      await this.deps.toasts.show(tabId, { kind: "failed", id: this.deps.newToastId(), reason });
    } finally {
      await this.deps.badge.end();
    }
  }

  /** Removes a just-added product again (the toast's Undo). */
  async undo(comparisonId: string, productId: string): Promise<void> {
    await this.deps.comparisons.removeProduct(comparisonId, productId);
    this.deps.onComparisonsChanged();
  }

  private async captureAndPlace(job: LinkAddJob, id: string): Promise<ToastMessage> {
    const { productId, snapshot } = await this.capture(job);
    const placement = await this.place(productId, snapshot, job.target);
    this.deps.log("link_capture.added", {
      url: job.url,
      source: job.source,
      productId,
      externalId: snapshot.externalId,
    });
    return {
      kind: "added",
      id,
      title: snapshot.title,
      specCount: snapshot.specGroups.reduce((total, group) => total + group.specs.length, 0),
      placement: placement === null ? null : { comparisonName: placement.comparisonName, count: placement.count },
      undo: placement === null ? null : { comparisonId: placement.comparisonId, productId },
    };
  }

  private async capture(job: LinkAddJob): Promise<CapturedProduct> {
    if (job.source === "link") return this.readLink(job.url);
    if (job.tabId === null) throw new Error(`Cannot read ${job.url}: no tab to capture it from`);
    const result = await this.deps.capturePage(job.tabId);
    if (!result.ok) throw new Error(result.message);
    return { productId: await this.deps.sendSnapshot(result.snapshot), snapshot: result.snapshot };
  }

  private async readLink(url: string): Promise<CapturedProduct> {
    const snapshot = await this.deps.reader.read(await this.deps.fetcher.fetchHtml(url), url);
    return { productId: await this.deps.sendSnapshot(snapshot), snapshot };
  }

  private async place(productId: string, snapshot: ProductSnapshot, target: AddTarget): Promise<Placement | null> {
    if (target.kind === "library") return null;
    const comparisonId = await this.resolveComparison(productId, snapshot, target);
    await this.deps.settings.setLastComparisonId(comparisonId);
    this.deps.onComparisonsChanged();
    const detail = await this.deps.comparisons.get(comparisonId);
    return { comparisonId, comparisonName: detail.name, count: detail.products.length };
  }

  private async resolveComparison(productId: string, snapshot: ProductSnapshot, target: AddTarget): Promise<string> {
    const existingId = await this.existingComparisonId(target);
    if (existingId === null) {
      const created = await this.deps.comparisons.create(comparisonNameFor(snapshot, "New comparison"), [productId]);
      return created.id;
    }
    await this.deps.comparisons.addProduct(existingId, productId);
    return existingId;
  }

  private async existingComparisonId(target: AddTarget): Promise<string | null> {
    if (target.kind === "comparison") return target.comparisonId;
    if (target.kind === "new") return null;
    const all = await this.deps.comparisons.list();
    const lastUsed = await this.deps.settings.lastComparisonId();
    return (all.find((comparison) => comparison.id === lastUsed) ?? all[0])?.id ?? null;
  }
}

function describeTarget(target: AddTarget): string {
  if (target.kind === "library") return "your library";
  return target.kind === "new" ? "a new comparison" : "your comparison";
}
