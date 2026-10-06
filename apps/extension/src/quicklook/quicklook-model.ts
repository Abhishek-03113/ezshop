import type { CatalogProduct, ProductSnapshot } from "@ezshop/catalog";
import type { QuickLookState } from "../messaging/messages.ts";

/** Which body the overlay shows: the comparison matrix or the open page's own spec sheet. */
export type QuickLookView = "compare" | "specs";

/** Everything the overlay renders from; the controller replaces it wholesale on each change. */
export interface QuickLookModel {
  status: "loading" | "ready" | "failed";
  /** Reason shown on the failed screen, or as a banner above a still-usable matrix. */
  message: string | null;
  state: QuickLookState | null;
  /** Live snapshot of the open tab, or null when it is not a product page. */
  pageSnapshot: ProductSnapshot | null;
  view: QuickLookView;
  busy: boolean;
}

export const INITIAL_MODEL: QuickLookModel = {
  status: "loading",
  message: null,
  state: null,
  pageSnapshot: null,
  view: "specs",
  busy: false,
};

/**
 * The view the overlay really shows. Specs is primary, but a "specs" request without a page snapshot
 * (nothing to show) falls back to compare, so a stale view value can never render an empty sheet.
 *
 * @example effectiveView({ ...INITIAL_MODEL, view: "specs", pageSnapshot: null }) // "compare"
 */
export function effectiveView(model: QuickLookModel): QuickLookView {
  return model.view === "specs" && model.pageSnapshot === null ? "compare" : model.view;
}

/**
 * True when the overlay is showing the open page's spec sheet.
 *
 * @example showsSpecs({ ...INITIAL_MODEL, view: "specs", pageSnapshot: null }) // false
 */
export function showsSpecs(model: QuickLookModel): boolean {
  return effectiveView(model) === "specs";
}

/**
 * Maps a manifest command name to the Quick Look view it opens; null for commands that are not ours.
 * `_execute_action` arrives as chrome.action.onClicked instead, so it is not handled here.
 *
 * @example viewForCommand("open-comparison") // "compare"
 */
export function viewForCommand(command: string): QuickLookView | null {
  return command === "open-comparison" ? "compare" : null;
}

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
