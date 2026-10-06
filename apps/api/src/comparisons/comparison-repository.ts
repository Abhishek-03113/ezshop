import type { CatalogComparisonDetail, CatalogComparisonSummary } from "@picky/catalog";

/**
 * Storage for named product sets. Many-to-many: a product can be in several comparisons.
 * Methods taking a comparison id resolve to null when it does not exist (including malformed ids).
 */
export interface ComparisonRepository {
  /** Most recently updated first. */
  listComparisons(): Promise<CatalogComparisonSummary[]>;
  /** Creates a comparison holding the given products in order; unknown product ids are the caller's to check. */
  createComparison(name: string, productIds: readonly string[]): Promise<CatalogComparisonSummary>;
  findComparison(id: string): Promise<CatalogComparisonDetail | null>;
  renameComparison(id: string, name: string): Promise<CatalogComparisonSummary | null>;
  /** True when a comparison was deleted. Its products stay in the library. */
  deleteComparison(id: string): Promise<boolean>;
  /** Idempotent: adding a product already in the comparison changes nothing. */
  addProduct(id: string, productId: string): Promise<CatalogComparisonSummary | null>;
  removeProduct(id: string, productId: string): Promise<CatalogComparisonSummary | null>;
  /** The comparisons a product belongs to, most recently updated first. */
  listComparisonsForProduct(productId: string): Promise<CatalogComparisonSummary[]>;
}
