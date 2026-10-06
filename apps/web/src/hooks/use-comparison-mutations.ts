import type { CatalogComparisonSummary } from "@ezshop/catalog";
import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { comparisonQueryKeys, forgetDeletedComparison } from "../api/comparison-queries.ts";
import { uniqueComparisonName } from "../comparison/comparison-labels.ts";

const rootRouteApi = getRouteApi("__root__");

/** Refreshes every comparison query (sidebar, nav count, detail, per-product membership) after a change. */
function useRefreshComparisons(): () => Promise<void> {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: comparisonQueryKeys.all });
}

/** Names of the comparisons already loaded (sidebar / nav count), read at call time. */
function useCachedComparisonNames(): () => string[] {
  const queryClient = useQueryClient();
  return () =>
    (queryClient.getQueryData<CatalogComparisonSummary[]>(comparisonQueryKeys.list) ?? []).map((c) => c.name);
}

/**
 * Creates a comparison holding `productIds` and opens it; a name already in use gets a number ("Monitors 2").
 *
 * @example useCreateComparison().mutate({ name: "Monitors", productIds: ["p1", "p2"] })
 */
export function useCreateComparison(): UseMutationResult<
  CatalogComparisonSummary,
  Error,
  { name: string; productIds: readonly string[] }
> {
  const { comparisonsClient } = rootRouteApi.useRouteContext();
  const refresh = useRefreshComparisons();
  const navigate = useNavigate();
  const existingNames = useCachedComparisonNames();
  return useMutation({
    mutationFn: ({ name, productIds }) =>
      comparisonsClient.createComparison(uniqueComparisonName(name, existingNames()), productIds),
    onSuccess: async (comparison) => {
      await refresh();
      await navigate({ to: "/comparisons/$comparisonId", params: { comparisonId: comparison.id } });
    },
  });
}

/**
 * Adds several products to an existing comparison (each add is idempotent).
 *
 * @example useAddProductsToComparison().mutate({ comparisonId, productIds })
 */
export function useAddProductsToComparison(): UseMutationResult<
  CatalogComparisonSummary,
  Error,
  { comparisonId: string; productIds: readonly string[] }
> {
  const { comparisonsClient } = rootRouteApi.useRouteContext();
  const refresh = useRefreshComparisons();
  return useMutation({
    mutationFn: async ({ comparisonId, productIds }) => {
      // Sequential on purpose: the server appends at max(position)+1, so parallel adds would race for order.
      let latest: CatalogComparisonSummary | undefined;
      for (const productId of productIds) latest = await comparisonsClient.addProduct(comparisonId, productId);
      if (latest === undefined)
        throw new Error(`No product ids to add to comparison ${comparisonId}; expected at least one`);
      return latest;
    },
    onSuccess: refresh,
  });
}

/**
 * Puts a product in, or takes it out of, one comparison.
 *
 * @example useSetMembership().mutate({ comparisonId, productId, member: true })
 */
export function useSetMembership(): UseMutationResult<
  CatalogComparisonSummary,
  Error,
  { comparisonId: string; productId: string; member: boolean }
> {
  const { comparisonsClient } = rootRouteApi.useRouteContext();
  const refresh = useRefreshComparisons();
  return useMutation({
    mutationFn: ({ comparisonId, productId, member }) =>
      member
        ? comparisonsClient.addProduct(comparisonId, productId)
        : comparisonsClient.removeProduct(comparisonId, productId),
    onSuccess: refresh,
  });
}

/**
 * Renames a comparison.
 *
 * @example useRenameComparison().mutate({ comparisonId, name: "Monitors under ₹35k" })
 */
export function useRenameComparison(): UseMutationResult<
  CatalogComparisonSummary,
  Error,
  { comparisonId: string; name: string }
> {
  const { comparisonsClient } = rootRouteApi.useRouteContext();
  const refresh = useRefreshComparisons();
  return useMutation({
    mutationFn: ({ comparisonId, name }) => comparisonsClient.renameComparison(comparisonId, name),
    onSuccess: refresh,
  });
}

/**
 * Deletes a comparison (its products stay in the library) and returns to the comparisons index.
 *
 * @example useDeleteComparison().mutate(comparisonId)
 */
export function useDeleteComparison(): UseMutationResult<void, Error, string> {
  const { comparisonsClient } = rootRouteApi.useRouteContext();
  const queryClient = useQueryClient();
  const refresh = useRefreshComparisons();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (comparisonId: string) => comparisonsClient.deleteComparison(comparisonId),
    onSuccess: async (_deleted, comparisonId) => {
      // Leave the page before touching the cache: refreshing while it is still mounted refetched the
      // deleted comparison, and its 404 replaced the page with "No comparison with id …".
      await navigate({ to: "/comparisons" });
      forgetDeletedComparison(queryClient, comparisonId);
      await refresh();
    },
  });
}
