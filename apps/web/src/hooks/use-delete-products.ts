import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { comparisonQueryKeys } from "../api/comparison-queries.ts";
import { productQueryKeys } from "../api/product-queries.ts";

const rootRouteApi = getRouteApi("__root__");

/**
 * Deletes products from the library, then refreshes the lists and the comparisons that held them.
 *
 * @example useDeleteProducts().mutate(["p1", "p2"])
 */
export function useDeleteProducts(): UseMutationResult<void, Error, readonly string[]> {
  const { productsClient } = rootRouteApi.useRouteContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productIds: readonly string[]) => {
      await Promise.all(productIds.map((productId) => productsClient.deleteProduct(productId)));
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: productQueryKeys.list }),
        queryClient.invalidateQueries({ queryKey: comparisonQueryKeys.all }),
      ]);
    },
  });
}
