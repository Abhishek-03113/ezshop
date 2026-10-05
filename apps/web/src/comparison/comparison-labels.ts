import type { CatalogProduct } from "@ezshop/catalog";
import { pluralize } from "../format/format-count.ts";
import { sourceLabel } from "../format/source-label.ts";

const LIST_FORMAT = new Intl.ListFormat("en", { type: "conjunction" });

/**
 * Subtitle of the compare page: "4 products · prices from Amazon.in and Flipkart".
 *
 * @example comparisonSubtitle(products) // "2 products · prices from Amazon.in"
 */
export function comparisonSubtitle(products: readonly CatalogProduct[]): string {
  const count = pluralize(products.length, "product");
  const stores = [...new Set(products.map((product) => sourceLabel(product.snapshot.source)))];
  return stores.length === 0 ? count : `${count} · prices from ${LIST_FORMAT.format(stores)}`;
}

/**
 * Short name of a product for matrix headers and aria labels: the title, trimmed of the brand prefix.
 *
 * @example shortProductName("Dell S2722QC 27\" 4K", "Dell") // "S2722QC 27\" 4K"
 */
export function shortProductName(title: string, brand: string | null): string {
  if (brand === null || !title.toLowerCase().startsWith(`${brand.toLowerCase()} `)) return title;
  return title.slice(brand.length).trim();
}

/**
 * "4.3 ★ · 2,140 ratings", or "No ratings" when the product has none.
 *
 * @example ratingLine({ average: 4.3, count: 2140 }) // "4.3 ★ · 2,140 ratings"
 */
export function ratingLine(rating: { average: number; count: number } | null): string {
  if (rating === null) return "No ratings";
  const count = new Intl.NumberFormat("en-IN").format(rating.count);
  return `${rating.average.toFixed(1)} ★ · ${count} ${rating.count === 1 ? "rating" : "ratings"}`;
}

/**
 * A name no other comparison uses: "Monitors", then "Monitors 2", "Monitors 3"… Comparisons are often
 * named after a category, and two identical names can't be told apart in the sidebar or a checklist.
 *
 * @example uniqueComparisonName("Monitors", ["Monitors"]) // "Monitors 2"
 */
export function uniqueComparisonName(name: string, existingNames: readonly string[]): string {
  const taken = new Set(existingNames.map((existing) => existing.trim().toLowerCase()));
  let candidate = name;
  for (let suffix = 2; taken.has(candidate.trim().toLowerCase()); suffix += 1) candidate = `${name} ${suffix}`;
  return candidate;
}
