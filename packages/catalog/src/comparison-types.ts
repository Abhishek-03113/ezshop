import type { CatalogProduct } from "./product-snapshot.ts";

/** A named set of products as lists and membership checks show it. */
export interface CatalogComparisonSummary {
  id: string;
  name: string;
  /** Product ids in position order. */
  productIds: string[];
  updatedAt: string;
}

/** A comparison with its products in full, in position order (the compare page and Quick Look). */
export interface CatalogComparisonDetail {
  id: string;
  name: string;
  products: CatalogProduct[];
  updatedAt: string;
}
