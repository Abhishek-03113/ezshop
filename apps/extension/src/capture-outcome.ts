import { countSpecs, formatMoney, type Money, type ProductSnapshot } from "@picky/catalog";

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
  /** The full capture, so the popup can render the spec sheet without another round trip. */
  snapshot: ProductSnapshot;
}

function formatOptionalMoney(money: Money | null): string | null {
  return money === null ? null : formatMoney(money);
}

export type CaptureOutcome =
  { kind: "saved"; summary: SavedSummary } | { kind: "unsupported" } | { kind: "failed"; message: string };

/**
 * Reduces a stored snapshot to the few fields the popup card needs, keeping the snapshot itself for the spec view.
 *
 * @example summarizeSnapshot("p1", snapshot).specCount // 54
 */
export function summarizeSnapshot(productId: string, snapshot: ProductSnapshot): SavedSummary {
  return {
    productId,
    brand: snapshot.brand,
    title: snapshot.title,
    priceText: formatOptionalMoney(snapshot.price),
    listPriceText: formatOptionalMoney(snapshot.listPrice),
    imageUrl: snapshot.images[0] ?? null,
    specCount: countSpecs(snapshot.specGroups),
    groupCount: snapshot.specGroups.length,
    snapshot,
  };
}
