import type { ProductSnapshot } from "@ezshop/catalog";
import { capturePage } from "../capture-page.ts";
import { ChromeQuickLookApi } from "./chrome-quicklook-api.ts";
import { QuickLookController } from "./quicklook-controller.ts";
import type { QuickLookApi } from "./quicklook-api.ts";

const HOST_TAG = "ezshop-quick-look";

export interface OverlayHostDependencies {
  document: Document;
  stylesheet: string;
  api: QuickLookApi;
}

/** A closed shadow root, so Amazon/Flipkart CSS and scripts can neither style nor reach the overlay. */
function mountShadowContainer(
  document: Document,
  stylesheet: string,
): { host: HTMLElement; root: ShadowRoot; container: HTMLElement } {
  const host = document.createElement(HOST_TAG);
  const root = host.attachShadow({ mode: "closed" });
  // adoptedStyleSheets (not a <style> element) so a strict page CSP cannot block our styles.
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(stylesheet);
  root.adoptedStyleSheets = [sheet];
  const container = document.createElement("div");
  root.append(container);
  return { host, root, container };
}

/**
 * Shows or hides the Quick Look overlay on the page. Calling it while open closes it.
 *
 * @example const overlay = new QuickLookOverlay(deps); overlay.toggle()
 */
export class QuickLookOverlay {
  private open: { host: HTMLElement; close: () => void } | null = null;

  constructor(private readonly deps: OverlayHostDependencies) {}

  toggle(): void {
    if (this.open === null) this.show();
    else this.open.close();
  }

  private show(): void {
    const { document } = this.deps;
    const { host, root, container } = mountShadowContainer(document, this.deps.stylesheet);
    const previouslyFocused = document.activeElement;
    const releaseScroll = lockPageScroll(document);
    let onKey: (event: KeyboardEvent) => void = () => {};
    const close = (): void => {
      window.removeEventListener("keydown", onKey, true);
      host.remove();
      releaseScroll();
      this.open = null;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
    const controller = new QuickLookController({
      container,
      api: this.deps.api,
      readPage: () => readThisPage(document),
      onClose: close,
      activeElement: () => root.activeElement,
    });
    onKey = keyForwarder(controller);
    window.addEventListener("keydown", onKey, true);
    document.documentElement.append(host);
    this.open = { host, close };
    void controller.open();
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

/** The toggle the service worker calls through executeScript; injected once, reused on later clicks. */
export function installQuickLook(document: Document, stylesheet: string): () => void {
  const overlay = new QuickLookOverlay({ document, stylesheet, api: new ChromeQuickLookApi() });
  return () => overlay.toggle();
}
