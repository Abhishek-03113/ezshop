import {
  availabilityTone,
  discountPercent,
  formatCaptureTime,
  formatMoney,
  savingsAmount,
  type Money,
  type ProductSnapshot,
} from "@ezshop/catalog";
import type { Dom } from "../dom.ts";

type PriceSnapshot = Pick<ProductSnapshot, "price" | "listPrice" | "availability" | "capturedAt">;

/**
 * Price, stock state and the capture-time caveat; every part tolerates missing data.
 * Mirrors the web app's PriceCard.
 *
 * @example container.append(renderSpecPriceView(dom, snapshot))
 */
export function renderSpecPriceView(dom: Dom, snapshot: PriceSnapshot): HTMLElement {
  const card = dom.el("div", { className: "spec-card price-card" }, [
    renderPriceBlock(dom, snapshot.price, snapshot.listPrice),
  ]);
  if (snapshot.availability !== null) card.append(renderAvailability(dom, snapshot.availability));
  const note = `Captured ${formatCaptureTime(snapshot.capturedAt)} · Prices change often — capture again to refresh.`;
  card.append(dom.el("span", { className: "price-card-note", text: note }));
  return card;
}

/** Selling price, with the struck M.R.P. and "N% off · save ₹X" chip only when there is a real discount. */
function renderPriceBlock(dom: Dom, price: Money | null, listPrice: Money | null): HTMLElement {
  if (price === null) return dom.el("p", { className: "price-missing", text: "Price not shown on the page" });
  const block = dom.el("span", { className: "price-block" }, [
    dom.el("span", { className: "price", text: formatMoney(price) }),
  ]);
  const discount = discountPercent(price, listPrice);
  const savings = savingsAmount(price, listPrice);
  if (listPrice === null || discount === null || savings === null) return block;
  block.append(
    dom.el("span", { className: "list-price" }, ["M.R.P. ", dom.el("s", { text: formatMoney(listPrice) })]),
    dom.el("span", { className: "discount-chip", text: `${discount}% off · save ${formatMoney(savings)}` }),
  );
  return block;
}

function renderAvailability(dom: Dom, availability: string): HTMLElement {
  const dot = dom.el("span", {
    className: `availability-dot ${availabilityTone(availability)}`,
    attrs: { "aria-hidden": "true" },
  });
  return dom.el("span", { className: "availability" }, [dot, dom.el("strong", { text: availability })]);
}
