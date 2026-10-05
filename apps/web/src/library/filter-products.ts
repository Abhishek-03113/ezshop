import type { CatalogProductSummary } from "@ezshop/catalog";
import type { StoreFilter } from "../format/source-label.ts";

/**
 * Products from the chosen store; "all" keeps everything.
 *
 * @example filterProductsByStore(products, "flipkart.com") // Flipkart rows only
 */
export function filterProductsByStore(
  products: readonly CatalogProductSummary[],
  store: StoreFilter,
): CatalogProductSummary[] {
  if (store === "all") return [...products];
  return products.filter((product) => product.source === store);
}
