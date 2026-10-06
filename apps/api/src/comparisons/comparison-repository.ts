import type { CatalogComparisonDetail, CatalogComparisonSummary } from "@picky/catalog";

/**
 * Storage for named product sets, each owned by one user. Many-to-many: a product can be in several of
 * its owner's comparisons. Every method is scoped to `userId`: another user's comparison resolves exactly
 * like a missing one (null), so ids never leak across accounts.
 */
export interface ComparisonRepository {
  /** Most recently updated first. */
  listComparisons(userId: string): Promise<CatalogComparisonSummary[]>;
  /** Creates a comparison holding the given products in order; the caller checks they are the user's own. */
  createComparison(userId: string, name: string, productIds: readonly string[]): Promise<CatalogComparisonSummary>;
  findComparison(userId: string, id: string): Promise<CatalogComparisonDetail | null>;
  renameComparison(userId: string, id: string, name: string): Promise<CatalogComparisonSummary | null>;
  /** True when a comparison was deleted. Its products stay in the library. */
  deleteComparison(userId: string, id: string): Promise<boolean>;
  /** Idempotent: adding a product already in the comparison changes nothing. */
  addProduct(userId: string, id: string, productId: string): Promise<CatalogComparisonSummary | null>;
  removeProduct(userId: string, id: string, productId: string): Promise<CatalogComparisonSummary | null>;
  /** The comparisons a product belongs to, most recently updated first. */
  listComparisonsForProduct(userId: string, productId: string): Promise<CatalogComparisonSummary[]>;
}
