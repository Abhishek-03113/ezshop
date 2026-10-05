import { queryOptions } from "@tanstack/react-query";
import type { ProductsClient } from "./products-client.ts";

export const productQueryKeys = {
  list: ["products", "list"] as const,
  search: (query: string) => ["products", "list", query] as const,
  detail: (id: string) => ["products", "detail", id] as const,
};

/**
 * Query for the product list, optionally narrowed by a server-side search. The blank-query key is the
 * `list` prefix's own entry; invalidating `productQueryKeys.list` refreshes every search too.
 *
 * @example useSuspenseQuery(productListQuery(productsClient, "usb-c"))
 */
export function productListQuery(client: ProductsClient, query = "") {
  const trimmed = query.trim();
  return queryOptions({
    queryKey: trimmed === "" ? productQueryKeys.list : productQueryKeys.search(trimmed),
    queryFn: () => client.listProducts(trimmed),
  });
}

/**
 * Query for one product's full snapshot.
 *
 * @example queryClient.ensureQueryData(productDetailQuery(productsClient, id))
 */
export function productDetailQuery(client: ProductsClient, id: string) {
  return queryOptions({ queryKey: productQueryKeys.detail(id), queryFn: () => client.getProduct(id) });
}
