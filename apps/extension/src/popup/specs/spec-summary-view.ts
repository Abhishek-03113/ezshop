import { ratingCountLabel, sourceLabel, type ProductSnapshot, type Rating } from "@ezshop/catalog";
import type { Dom } from "../dom.ts";

/**
 * Top of the spec view: one product image, then brand, store chip, title and rating.
 * Mirrors the web app's ProductSummary, with the gallery reduced to a single image for 360px.
 *
 * @example container.append(renderSpecSummaryView(dom, snapshot))
 */
export function renderSpecSummaryView(dom: Dom, snapshot: ProductSnapshot): HTMLElement {
  return dom.el("section", { className: "summary" }, [
    renderImage(dom, snapshot),
    dom.el("div", { className: "summary-heading" }, [
      renderMeta(dom, snapshot),
      dom.el("h1", { text: snapshot.title }),
      ...renderRatingNote(dom, snapshot.rating),
    ]),
  ]);
}

function renderImage(dom: Dom, snapshot: ProductSnapshot): HTMLElement {
  const frame = dom.el("div", { className: "gallery-main" });
  const [image] = snapshot.images;
  if (image === undefined) {
    frame.append(dom.icon("box", "icon-xl gallery-empty"));
    return frame;
  }
  const attrs = { src: image, alt: snapshot.title, referrerpolicy: "no-referrer" };
  frame.append(dom.el("img", { attrs }));
  return frame;
}

function renderMeta(dom: Dom, snapshot: ProductSnapshot): HTMLElement {
  const meta = dom.el("span", { className: "summary-meta" });
  if (snapshot.brand !== null) meta.append(dom.el("span", { className: "summary-brand", text: snapshot.brand }));
  meta.append(dom.el("span", { className: "chip", text: sourceLabel(snapshot.source) }));
  return meta;
}

/** "★ 4.4 out of 5 · 17,240 ratings"; an empty list when the page showed no rating. */
function renderRatingNote(dom: Dom, rating: Rating | null): HTMLElement[] {
  if (rating === null) return [];
  return [
    dom.el("span", { className: "rating-note" }, [
      dom.icon("star", "icon-xs"),
      dom.el("strong", { text: rating.average.toFixed(1) }),
      dom.el("span", { text: `out of 5 · ${ratingCountLabel(rating.count)}` }),
    ]),
  ];
}
