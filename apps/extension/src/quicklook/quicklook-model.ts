import type { CatalogProduct, ProductSnapshot } from "@ezshop/catalog";
import type { QuickLookState } from "../messaging/messages.ts";

/** Everything the overlay renders from; the controller replaces it wholesale on each change. */
export interface QuickLookModel {
  status: "loading" | "ready" | "failed";
  /** Reason shown on the failed screen, or as a banner above a still-usable matrix. */
  message: string | null;
  state: QuickLookState | null;
  /** Live snapshot of the open tab, or null when it is not a product page. */
  pageSnapshot: ProductSnapshot | null;
  differencesOnly: boolean;
  busy: boolean;
}

export const INITIAL_MODEL: QuickLookModel = {
  status: "loading",
  message: null,
  state: null,
  pageSnapshot: null,
  differencesOnly: true,
  busy: false,
};

function isSameProduct(product: CatalogProduct, snapshot: ProductSnapshot): boolean {
  return product.snapshot.source === snapshot.source && product.snapshot.externalId === snapshot.externalId;
}

/**
 * The "This page" column's snapshot: the open tab's product, unless it is already saved in the comparison
 * (then it is just a normal column).
 *
 * @example thisPageColumn(model) // null on a search page or when the product is already saved
 */
export function thisPageColumn(model: QuickLookModel): ProductSnapshot | null {
  const page = model.pageSnapshot;
  if (page === null) return null;
  const saved = model.state?.products ?? [];
  return saved.some((product) => isSameProduct(product, page)) ? null : page;
}

/** The comparison's id one step left/right of the selected one, wrapping around; null with nothing to switch to. */
export function neighbourComparisonId(state: QuickLookState, step: 1 | -1): string | null {
  const ids = state.comparisons.map((comparison) => comparison.id);
  if (ids.length < 2 || state.selectedId === null) return null;
  const index = ids.indexOf(state.selectedId);
  return ids[(index + step + ids.length) % ids.length] ?? null;
}
