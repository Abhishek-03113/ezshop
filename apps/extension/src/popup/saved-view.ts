import type { SavedSummary } from "../capture-outcome.ts";
import type { Dom } from "./dom.ts";
import { renderSwitch } from "./switch.ts";

export interface SavedModel {
  summary: SavedSummary;
  webBaseUrl: string;
  autoOpen: boolean;
}

export interface SavedHandlers {
  onAutoOpenChange: (checked: boolean) => void;
  onViewSpecs: () => void;
}

const AUTO_OPEN_LABEL_ID = "auto-open-label";

/** "54 specs in 10 groups", singular-aware. */
export function describeSpecCount(specCount: number, groupCount: number): string {
  const specs = `${specCount} ${specCount === 1 ? "spec" : "specs"}`;
  return `${specs} in ${groupCount} ${groupCount === 1 ? "group" : "groups"}`;
}

/**
 * Saved body: confirmation, product card (links to the sheet), primary "View specs"
 * button, the secondary "Open in ezshop" link and the "Open sheet automatically" switch.
 *
 * @example renderSavedView(dom, { summary, webBaseUrl: "http://localhost:5173", autoOpen: true }, handlers)
 */
export function renderSavedView(dom: Dom, model: SavedModel, handlers: SavedHandlers): HTMLElement {
  const sheetUrl = `${model.webBaseUrl}/products/${model.summary.productId}`;
  return dom.el("main", { className: "body body-tight" }, [
    renderConfirmation(dom, model.summary),
    renderProductCard(dom, model.summary, sheetUrl),
    renderViewSpecsButton(dom, handlers),
    renderOpenLink(dom, sheetUrl),
    renderAutoOpenRow(dom, model.autoOpen, handlers),
  ]);
}

function renderConfirmation(dom: Dom, summary: SavedSummary): HTMLElement {
  const badge = dom.el("span", { className: "success-badge" }, [dom.icon("check", "icon-sm")]);
  return dom.el("div", { className: "status", attrs: { role: "status" } }, [
    badge,
    dom.el("span", { className: "status-copy" }, [
      dom.el("span", { className: "title-md", text: "Saved to your library" }),
      dom.el("span", { className: "muted-sm", text: describeSpecCount(summary.specCount, summary.groupCount) }),
    ]),
  ]);
}

function renderProductCard(dom: Dom, summary: SavedSummary, sheetUrl: string): HTMLElement {
  const details = dom.el("span", { className: "product-copy" });
  if (summary.brand !== null) details.append(dom.el("span", { className: "product-brand", text: summary.brand }));
  details.append(dom.el("span", { className: "product-title", text: summary.title }), renderPrices(dom, summary));
  const attrs = { href: sheetUrl, target: "_blank", rel: "noopener" };
  return dom.el("a", { className: "card card-product", attrs }, [renderThumb(dom, summary.imageUrl), details]);
}

function renderThumb(dom: Dom, imageUrl: string | null): HTMLElement {
  const thumb = dom.el("span", { className: "thumb" });
  if (imageUrl === null) return append(thumb, dom.icon("headphones", "icon-xl icon-placeholder"));
  const attrs = { src: imageUrl, alt: "", referrerpolicy: "no-referrer" };
  return append(thumb, dom.el("img", { className: "thumb-image", attrs }));
}

function append(parent: HTMLElement, child: Node): HTMLElement {
  parent.append(child);
  return parent;
}

function renderPrices(dom: Dom, summary: SavedSummary): HTMLElement {
  const prices = dom.el("span", { className: "prices" });
  if (summary.priceText !== null) prices.append(dom.el("span", { className: "price", text: summary.priceText }));
  if (summary.listPriceText !== null && summary.listPriceText !== summary.priceText) {
    prices.append(dom.el("s", { className: "list-price", text: summary.listPriceText }));
  }
  return prices;
}

function renderViewSpecsButton(dom: Dom, handlers: SavedHandlers): HTMLElement {
  const button = dom.el("button", {
    className: "button button-primary button-tall",
    attrs: { type: "button" },
    text: "View specs",
  });
  button.addEventListener("click", handlers.onViewSpecs);
  return button;
}

function renderOpenLink(dom: Dom, sheetUrl: string): HTMLElement {
  const attrs = { href: sheetUrl, target: "_blank", rel: "noopener" };
  return dom.el("a", { className: "button button-secondary", attrs }, ["Open in ezshop ↗"]);
}

function renderAutoOpenRow(dom: Dom, autoOpen: boolean, handlers: SavedHandlers): HTMLElement {
  const toggle = renderSwitch(dom, {
    labelId: AUTO_OPEN_LABEL_ID,
    checked: autoOpen,
    onChange: handlers.onAutoOpenChange,
  });
  return dom.el("div", { className: "setting-row" }, [
    dom.el("span", { className: "status-copy" }, [
      dom.el("span", {
        className: "setting-label",
        attrs: { id: AUTO_OPEN_LABEL_ID },
        text: "Open sheet automatically",
      }),
      dom.el("span", { className: "muted-sm", text: "Skip this popup next time" }),
    ]),
    toggle,
  ]);
}
