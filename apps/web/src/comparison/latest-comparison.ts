import type { CatalogComparisonSummary } from "@ezshop/catalog";

/**
 * Id of the comparison "/comparisons" should open: the most recently updated one (the API lists newest
 * first), or null when there are none and the empty state shows instead.
 *
 * @example latestComparisonId([{ id: "c2", ... }, { id: "c1", ... }]) // "c2"
 */
export function latestComparisonId(comparisons: readonly CatalogComparisonSummary[]): string | null {
  return comparisons[0]?.id ?? null;
}
