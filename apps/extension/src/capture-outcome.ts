import type { ProductSnapshot } from "@ezshop/catalog";

/** Where the capture flow is, for the popup's progress steps. */
export type CapturePhase = "reading" | "saving";

/** What the popup's Saved card shows. Plain JSON: it crosses from the service worker to the popup. */
export interface SavedSummary {
  productId: string;
  brand: string | null;
  title: string;
  priceText: string | null;
  listPriceText: string | null;
  imageUrl: string | null;
  specCount: number;
  groupCount: number;
}

export type CaptureOutcome =
  { kind: "saved"; summary: SavedSummary } | { kind: "unsupported" } | { kind: "failed"; message: string };

function formatMoney(money: ProductSnapshot["price"]): string | null {
  if (money === null) return null;
  const format = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: money.currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
  return format.format(money.amount);
}

/**
 * Reduces a stored snapshot to the few fields the popup card needs.
 *
 * @example summarizeSnapshot("p1", snapshot).specCount // 54
 */
export function summarizeSnapshot(productId: string, snapshot: ProductSnapshot): SavedSummary {
  return {
    productId,
    brand: snapshot.brand,
    title: snapshot.title,
    priceText: formatMoney(snapshot.price),
    listPriceText: formatMoney(snapshot.listPrice),
    imageUrl: snapshot.images[0] ?? null,
    specCount: snapshot.specGroups.reduce((total, group) => total + group.specs.length, 0),
    groupCount: snapshot.specGroups.length,
  };
}
