import type { CatalogComparisonSummary } from "@picky/catalog";
import { queryOptions, type QueryClient } from "@tanstack/react-query";
import type { ComparisonsClient } from "./comparisons-client.ts";

export const comparisonQueryKeys = {
  /** Prefix of every comparison query: invalidate it after any membership or name change. */
  all: ["comparisons"] as const,
  list: ["comparisons", "list"] as const,
  detail: (id: string) => ["comparisons", "detail", id] as const,
  forProduct: (productId: string) => ["comparisons", "product", productId] as const,
};

/**
 * Query for every comparison (sidebar, nav count, menus).
 *
 * @example useSuspenseQuery(comparisonListQuery(comparisonsClient))
 */
export function comparisonListQuery(client: ComparisonsClient) {
  return queryOptions({ queryKey: comparisonQueryKeys.list, queryFn: () => client.listComparisons() });
}

/**
 * Query for one comparison with its products in full.
 *
 * @example queryClient.ensureQueryData(comparisonDetailQuery(comparisonsClient, id))
 */
export function comparisonDetailQuery(client: ComparisonsClient, id: string) {
  return queryOptions({ queryKey: comparisonQueryKeys.detail(id), queryFn: () => client.getComparison(id) });
}

/**
 * Query for the comparisons one product belongs to (the "In comparisons" card).
 *
 * @example useSuspenseQuery(productComparisonsQuery(comparisonsClient, productId))
 */
export function productComparisonsQuery(client: ComparisonsClient, productId: string) {
  return queryOptions({
    queryKey: comparisonQueryKeys.forProduct(productId),
    queryFn: () => client.listComparisonsForProduct(productId),
  });
}

/**
 * Drops a deleted comparison from the cache: out of the list (so the sidebar, nav count and index update
 * before the refetch lands) and its detail query removed, so nothing ever refetches it into a 404.
 *
 * @example forgetDeletedComparison(queryClient, "c1")
 */
export function forgetDeletedComparison(queryClient: QueryClient, comparisonId: string): void {
  queryClient.setQueryData<CatalogComparisonSummary[]>(comparisonQueryKeys.list, (comparisons) =>
    comparisons?.filter((comparison) => comparison.id !== comparisonId),
  );
  queryClient.removeQueries({ queryKey: comparisonQueryKeys.detail(comparisonId), exact: true });
}
