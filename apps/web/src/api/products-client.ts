import type { CatalogProduct, CatalogProductSummary } from "@picky/catalog";
import { createJsonRequester, type FetchFunction } from "./json-requester.ts";

export { ApiRequestError } from "./json-requester.ts";

export interface ProductsClient {
  /** Newest first; a non-blank `query` is matched by the server against title, brand, category and specs. */
  listProducts(query?: string): Promise<CatalogProductSummary[]>;
  getProduct(id: string): Promise<CatalogProduct>;
  /** Removes the product from the library and from every comparison that held it. */
  deleteProduct(id: string): Promise<void>;
}

/**
 * Typed client for the Picky API. `baseUrl` is "" in the browser (Vite proxies /api).
 *
 * @example await createProductsClient(fetch, "").getProduct(id)
 */
export function createProductsClient(fetchFunction: FetchFunction, baseUrl: string): ProductsClient {
  const requestJson = createJsonRequester(fetchFunction, baseUrl);
  return {
    listProducts: async (query = "") => {
      const search = query.trim() === "" ? "" : `?q=${encodeURIComponent(query.trim())}`;
      return (await requestJson<{ products: CatalogProductSummary[] }>(`/api/products${search}`)).products;
    },
    getProduct: async (id) =>
      (await requestJson<{ product: CatalogProduct }>(`/api/products/${encodeURIComponent(id)}`)).product,
    deleteProduct: (id) => requestJson<void>(`/api/products/${encodeURIComponent(id)}`, { method: "DELETE" }),
  };
}
