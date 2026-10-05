import type { CatalogComparisonDetail, CatalogComparisonSummary } from "@ezshop/catalog";

/** What POST /api/comparisons hands back that the extension relies on. */
export interface CreatedComparison {
  id: string;
  name: string;
}

/** The ezshop comparisons API as the extension uses it; http-comparisons-client.ts implements it over fetch. */
export interface ComparisonsClient {
  list(): Promise<CatalogComparisonSummary[]>;
  get(comparisonId: string): Promise<CatalogComparisonDetail>;
  create(name: string, productIds?: readonly string[]): Promise<CreatedComparison>;
  /** Idempotent: adding a product that is already in the comparison succeeds. */
  addProduct(comparisonId: string, productId: string): Promise<void>;
  removeProduct(comparisonId: string, productId: string): Promise<void>;
}
