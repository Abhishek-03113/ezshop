import { queryOptions } from "@tanstack/react-query";
import type { ApiCapabilities, ProductsClient } from "./products-client.ts";

export const productQueryKeys = {
  list: ["products", "list"] as const,
  search: (query: string) => ["products", "list", query] as const,
  detail: (id: string) => ["products", "detail", id] as const,
  capabilities: ["api", "capabilities"] as const,
};

const URL_IMPORT_OFF: ApiCapabilities = { urlImport: false };

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

/**
 * What the API can do, fetched once per session. A failed probe reads as "URL import off", so the
 * paste-a-link form greys out instead of accepting links the server would refuse with a 501.
 *
 * @example useSuspenseQuery(apiCapabilitiesQuery(productsClient)).data.urlImport
 */
export function apiCapabilitiesQuery(client: ProductsClient) {
  return queryOptions({
    queryKey: productQueryKeys.capabilities,
    queryFn: () => client.getCapabilities().catch(() => URL_IMPORT_OFF),
    staleTime: Infinity,
  });
}
