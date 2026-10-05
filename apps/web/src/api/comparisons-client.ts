import type { CatalogComparisonDetail, CatalogComparisonSummary } from "@ezshop/catalog";
import { createJsonRequester, jsonRequest, type FetchFunction } from "./json-requester.ts";

export interface ComparisonsClient {
  /** Most recently updated first. */
  listComparisons(): Promise<CatalogComparisonSummary[]>;
  getComparison(id: string): Promise<CatalogComparisonDetail>;
  createComparison(name: string, productIds?: readonly string[]): Promise<CatalogComparisonSummary>;
  renameComparison(id: string, name: string): Promise<CatalogComparisonSummary>;
  deleteComparison(id: string): Promise<void>;
  /** Idempotent. */
  addProduct(comparisonId: string, productId: string): Promise<CatalogComparisonSummary>;
  removeProduct(comparisonId: string, productId: string): Promise<CatalogComparisonSummary>;
  listComparisonsForProduct(productId: string): Promise<CatalogComparisonSummary[]>;
}

type SummaryEnvelope = { comparison: CatalogComparisonSummary };

/**
 * Typed client for the comparison endpoints of the ezshop API.
 *
 * @example await createComparisonsClient(fetch, "").createComparison("Monitors", [productId])
 */
export function createComparisonsClient(fetchFunction: FetchFunction, baseUrl: string): ComparisonsClient {
  const requestJson = createJsonRequester(fetchFunction, baseUrl);
  const path = (id: string) => `/api/comparisons/${encodeURIComponent(id)}`;
  const memberPath = (id: string, productId: string) => `${path(id)}/products/${encodeURIComponent(productId)}`;
  const summary = async (route: string, init?: RequestInit) =>
    (await requestJson<SummaryEnvelope>(route, init)).comparison;
  return {
    listComparisons: async () =>
      (await requestJson<{ comparisons: CatalogComparisonSummary[] }>("/api/comparisons")).comparisons,
    getComparison: async (id) => (await requestJson<{ comparison: CatalogComparisonDetail }>(path(id))).comparison,
    createComparison: (name, productIds = []) => summary("/api/comparisons", jsonRequest("POST", { name, productIds })),
    renameComparison: (id, name) => summary(path(id), jsonRequest("PATCH", { name })),
    deleteComparison: (id) => requestJson<void>(path(id), { method: "DELETE" }),
    addProduct: (id, productId) => summary(memberPath(id, productId), { method: "PUT" }),
    removeProduct: (id, productId) => summary(memberPath(id, productId), { method: "DELETE" }),
    listComparisonsForProduct: async (productId) =>
      (
        await requestJson<{ comparisons: CatalogComparisonSummary[] }>(
          `/api/products/${encodeURIComponent(productId)}/comparisons`,
        )
      ).comparisons,
  };
}
