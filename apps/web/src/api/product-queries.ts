import { queryOptions } from "@tanstack/react-query";
import type { ProductsClient } from "./products-client.ts";

export const productQueryKeys = {
  list: ["products", "list"] as const,
  detail: (id: string) => ["products", "detail", id] as const,
};

/**
 * Query for the product list, shared by the route loader and the page.
 *
 * @example useSuspenseQuery(productListQuery(productsClient))
 */
export function productListQuery(client: ProductsClient) {
  return queryOptions({ queryKey: productQueryKeys.list, queryFn: () => client.listProducts() });
}

/**
 * Query for one product's full snapshot.
 *
 * @example queryClient.ensureQueryData(productDetailQuery(productsClient, id))
 */
export function productDetailQuery(client: ProductsClient, id: string) {
  return queryOptions({ queryKey: productQueryKeys.detail(id), queryFn: () => client.getProduct(id) });
}
