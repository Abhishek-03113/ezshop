import type { CatalogProduct, CatalogProductSummary, ProductSnapshot } from "@ezshop/catalog";

/** Storage for product snapshots. One row per (source, externalId); a newer capture replaces the older. */
export interface ProductRepository {
  saveSnapshot(snapshot: ProductSnapshot): Promise<CatalogProduct>;
  findProductById(id: string): Promise<CatalogProduct | null>;
  listProductSummaries(): Promise<CatalogProductSummary[]>;
}

/**
 * Projects a stored product down to what the product list needs.
 *
 * @example summarizeProduct(product).imageUrl
 */
export function summarizeProduct(product: CatalogProduct): CatalogProductSummary {
  const { snapshot } = product;
  return {
    id: product.id,
    source: snapshot.source,
    title: snapshot.title,
    brand: snapshot.brand,
    price: snapshot.price,
    imageUrl: snapshot.images[0] ?? null,
    updatedAt: product.updatedAt,
  };
}
