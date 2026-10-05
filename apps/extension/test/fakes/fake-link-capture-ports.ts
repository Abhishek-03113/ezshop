import type { ProductSnapshot } from "@ezshop/catalog";
import type { BadgeText } from "../../src/link-capture/badge-counter.ts";
import type { ContextMenuPort } from "../../src/link-capture/chrome-context-menu.ts";
import type { MenuEntry } from "../../src/link-capture/context-menu-model.ts";
import type { HtmlFetcher } from "../../src/link-capture/html-fetcher.ts";
import type { SnapshotReader } from "../../src/link-capture/snapshot-reader.ts";
import type { ToastMessage } from "../../src/toast/toast-message.ts";
import type { ToastPort } from "../../src/toast/toast-port.ts";

/** Serves canned HTML per URL and records what was fetched; throws for unknown URLs like a 404. */
export class FakeHtmlFetcher implements HtmlFetcher {
  readonly fetched: string[] = [];

  constructor(private readonly pages: Readonly<Record<string, string>>) {}

  async fetchHtml(url: string): Promise<string> {
    this.fetched.push(url);
    const html = this.pages[url];
    if (html === undefined) throw new Error(`Fetching ${url} returned HTTP 404; expected 200 with HTML`);
    return html;
  }
}

/** Returns a canned snapshot, or throws when `failure` is set. */
export class FakeSnapshotReader implements SnapshotReader {
  constructor(
    private readonly snapshot: ProductSnapshot,
    private readonly failure: Error | null = null,
  ) {}

  async read(): Promise<ProductSnapshot> {
    if (this.failure !== null) throw this.failure;
    return this.snapshot;
  }
}

export class FakeToastPort implements ToastPort {
  readonly shown: { tabId: number | null; message: ToastMessage }[] = [];

  async show(tabId: number | null, message: ToastMessage): Promise<void> {
    this.shown.push({ tabId, message });
  }

  get kinds(): string[] {
    return this.shown.map(({ message }) => message.kind);
  }
}

export class FakeBadgeText implements BadgeText {
  readonly texts: string[] = [];

  async set(text: string): Promise<void> {
    this.texts.push(text);
  }
}

export class FakeContextMenu implements ContextMenuPort {
  readonly menus: (readonly MenuEntry[])[] = [];

  async replaceAll(entries: readonly MenuEntry[]): Promise<void> {
    this.menus.push(entries);
  }
}
