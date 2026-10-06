import type { ProductSnapshot } from "@picky/catalog";

/** Name for a comparison created from the first product added to it. */
export const DEFAULT_COMPARISON_NAME = "My comparison";

/**
 * The comparison name a new snapshot suggests: its category when known, else a generic name.
 *
 * @example comparisonNameFor(snapshot) // "Monitors" (or "My comparison" when category is null)
 */
export function comparisonNameFor(
  snapshot: Pick<ProductSnapshot, "category">,
  fallback = DEFAULT_COMPARISON_NAME,
): string {
  const category = snapshot.category?.trim();
  return category !== undefined && category !== "" ? category : fallback;
}
