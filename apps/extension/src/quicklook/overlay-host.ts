import type { ProductSnapshot } from "@picky/catalog";
import { capturePage } from "../capture-page.ts";
import { ChromeQuickLookApi } from "./chrome-quicklook-api.ts";
import { QuickLookController } from "./quicklook-controller.ts";
import type { QuickLookApi } from "./quicklook-api.ts";
import type { QuickLookView } from "./quicklook-model.ts";

const HOST_TAG = "picky-quick-look";

export interface OverlayHostDependencies {
  document: Document;
  stylesheet: string;
  api: QuickLookApi;
  /** Reads the live tab; defaults to the real page, injectable so tests need no product page. */
  readPage?: () => ProductSnapshot | null;
}

/** The document's own window (not the global), so the overlay works in any document, including test ones. */
function windowOf(document: Document): Window & typeof globalThis {
  return (document.defaultView ?? window) as Window & typeof globalThis;
}

/** A closed shadow root, so Amazon/Flipkart CSS and scripts can neither style nor reach the overlay. */
function mountShadowContainer(
  document: Document,
  stylesheet: string,
): { host: HTMLElement; root: ShadowRoot; container: HTMLElement } {
  const host = document.createElement(HOST_TAG);
  const root = host.attachShadow({ mode: "closed" });
  // adoptedStyleSheets (not a <style> element) so a strict page CSP cannot block our styles.
  const sheet = new (windowOf(document).CSSStyleSheet)();
  sheet.replaceSync(stylesheet);
  root.adoptedStyleSheets = [sheet];
  const container = document.createElement("div");
  root.append(container);
  return { host, root, container };
}

/**
 * Shows or hides the Quick Look overlay on the page. Calling it while open closes it.
 *
 * @example const overlay = new QuickLookOverlay(deps); overlay.toggle("specs")
 */
export class QuickLookOverlay {
  private open: { host: HTMLElement; close: () => void; controller: QuickLookController } | null = null;

  constructor(private readonly deps: OverlayHostDependencies) {}

  /**
   * Closed: opens on `view`. Open on `view`: closes. Open on the other view: switches to it and stays open,
   * so each shortcut is a toggle for its own view and a jump from the other one.
   *
   * @example overlay.toggle("compare")
   */
  toggle(view: QuickLookView): void {
    if (this.open === null) return this.show(view);
    const before = this.open.controller.currentView();
    this.open.controller.setView(view);
    // Unchanged view means "same shortcut again", including Alt+Shift+S off a product page, where specs
    // falls back to compare and setView ignores it; comparing against `view` would leave the overlay stuck open.
    if (this.open.controller.currentView() === before) this.open.close();
  }

  /**
   * Opens on the specs of a product that is not this page (Quick Look on a link), replacing any open overlay.
   *
   * @example overlay.showProduct(linkedSnapshot)
   */
  showProduct(snapshot: ProductSnapshot): void {
    this.open?.close();
    this.show("specs", () => snapshot);
  }

  private show(view: QuickLookView, readPage = this.deps.readPage ?? (() => readThisPage(this.deps.document))): void {
    const { document } = this.deps;
    const { host, root, container } = mountShadowContainer(document, this.deps.stylesheet);
    const previouslyFocused = document.activeElement;
    const releaseScroll = lockPageScroll(document);
    const pageWindow = windowOf(document);
    let onKey: (event: KeyboardEvent) => void = () => {};
    const close = (): void => {
      pageWindow.removeEventListener("keydown", onKey, true);
      host.remove();
      releaseScroll();
      this.open = null;
      if (previouslyFocused instanceof pageWindow.HTMLElement) previouslyFocused.focus();
    };
    const controller = new QuickLookController({
      container,
      api: this.deps.api,
      readPage,
      onClose: close,
      activeElement: () => root.activeElement,
    });
    onKey = keyForwarder(controller);
    pageWindow.addEventListener("keydown", onKey, true);
    document.documentElement.append(host);
    this.open = { host, close, controller };
    void controller.open(view);
  }
}

/**
 * A modal glance must not scroll the product page behind it; restores the page's own overflow on close.
 *
 * @example const release = lockPageScroll(document); release()
 */
export function lockPageScroll(document: Document): () => void {
  const style = document.documentElement.style;
  const previous = style.overflow;
  style.overflow = "hidden";
  return () => {
    style.overflow = previous;
  };
}

/** Keys the overlay handles must not reach the page (Amazon binds many shortcuts). */
function keyForwarder(controller: QuickLookController): (event: KeyboardEvent) => void {
  return (event) => {
    if (!controller.handleKey(event)) return;
    event.preventDefault();
    event.stopPropagation();
  };
}

function readThisPage(document: Document): ProductSnapshot | null {
  const result = capturePage(document, location.href, new Date());
  return result.ok ? result.snapshot : null;
}

/** What the service worker calls through executeScript; injected once, reused on later clicks. */
export interface QuickLookPageHooks {
  toggle: (view: QuickLookView) => void;
  showProduct: (snapshot: ProductSnapshot) => void;
}

/** Installs the overlay in this page and returns the hooks the service worker calls. */
export function installQuickLook(document: Document, stylesheet: string): QuickLookPageHooks {
  const overlay = new QuickLookOverlay({ document, stylesheet, api: new ChromeQuickLookApi() });
  return { toggle: (view) => overlay.toggle(view), showProduct: (snapshot) => overlay.showProduct(snapshot) };
}
