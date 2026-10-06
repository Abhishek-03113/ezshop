import type { CatalogProduct, CatalogProductSummary, ProductSnapshot } from "@picky/catalog";

/** Storage for product snapshots. One row per (source, externalId); a newer capture replaces the older. */
export interface ProductRepository {
  saveSnapshot(snapshot: ProductSnapshot): Promise<CatalogProduct>;
  findProductById(id: string): Promise<CatalogProduct | null>;
  /** True when a product was deleted. It also leaves any comparison that held it. */
  deleteProduct(id: string): Promise<boolean>;
  /** Newest first; a non-blank query keeps products whose title, brand, category or specs contain it. */
  listProductSummaries(query?: string): Promise<CatalogProductSummary[]>;
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
    category: snapshot.category,
    price: snapshot.price,
    imageUrl: snapshot.images[0] ?? null,
    updatedAt: product.updatedAt,
  };
}

/**
 * The text a search matches against: title, brand, category and every spec label and value.
 * Kept in step with `SEARCH_TEXT_SQL` in postgres-product-repository.ts.
 *
 * @example searchableText(snapshot) // "Apple iPhone 17 Apple Smartphones Brand Apple"
 */
export function searchableText(snapshot: ProductSnapshot): string {
  const specs = snapshot.specGroups.flatMap((group) => group.specs.map((spec) => `${spec.label} ${spec.value}`));
  return [snapshot.title, snapshot.brand, snapshot.category, ...specs].filter(Boolean).join(" ");
}

/**
 * Case-insensitive substring match of a trimmed query against `searchableText`; a blank query matches all.
 *
 * @example productMatchesQuery(snapshot, "  oled ") // true when a spec mentions OLED
 */
export function productMatchesQuery(snapshot: ProductSnapshot, query: string): boolean {
  const needle = query.trim().toLowerCase();
  return needle === "" || searchableText(snapshot).toLowerCase().includes(needle);
}
