import type { CatalogProduct, CatalogProductSummary } from "@ezshop/catalog";

type FetchFunction = (input: string, init?: RequestInit) => Promise<Response>;

/** The API answered with a non-2xx status. `message` is the API's own explanation when it sent one. */
export class ApiRequestError extends Error {
  override readonly name = "ApiRequestError";
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export interface ProductsClient {
  listProducts(): Promise<CatalogProductSummary[]>;
  getProduct(id: string): Promise<CatalogProduct>;
  importProduct(url: string): Promise<CatalogProduct>;
}

/**
 * Typed client for the ezshop API. `baseUrl` is "" in the browser (Vite proxies /api).
 *
 * @example await createProductsClient(fetch, "").getProduct(id)
 */
export function createProductsClient(fetchFunction: FetchFunction, baseUrl: string): ProductsClient {
  const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetchFunction(`${baseUrl}${path}`, init);
    if (!response.ok) throw await toApiRequestError(path, response);
    return (await response.json()) as T;
  };
  return {
    listProducts: async () => (await requestJson<{ products: CatalogProductSummary[] }>("/api/products")).products,
    getProduct: async (id) =>
      (await requestJson<{ product: CatalogProduct }>(`/api/products/${encodeURIComponent(id)}`)).product,
    importProduct: async (url) =>
      (await requestJson<{ product: CatalogProduct }>("/api/imports", jsonPost({ url }))).product,
  };
}

function jsonPost(body: unknown): RequestInit {
  return { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) };
}

async function toApiRequestError(path: string, response: Response): Promise<ApiRequestError> {
  const body = (await response.json().catch(() => null)) as { message?: unknown } | null;
  const apiMessage = typeof body?.message === "string" ? body.message : null;
  return new ApiRequestError(apiMessage ?? `Request to ${path} failed with HTTP ${response.status}`, response.status);
}
