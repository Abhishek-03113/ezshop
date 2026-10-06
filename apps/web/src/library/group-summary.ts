import {
  type CatalogComparisonSummary,
  type CatalogProductSummary,
  formatMoney,
  type Money,
  pluralize,
} from "@picky/catalog";
import type { ProductGroup } from "./group-products.ts";

/**
 * Cheapest and dearest price in a group; null when no product has a price. Mixed currencies are not
 * ranked against each other: the first product's currency wins, as everything on the shelf is INR today.
 *
 * @example priceRange(products) // { min: { amount: 19990, currency: "INR" }, max: { amount: 34499, currency: "INR" } }
 */
export function priceRange(products: readonly CatalogProductSummary[]): { min: Money; max: Money } | null {
  const prices = products.flatMap((product) => (product.price === null ? [] : [product.price]));
  const first = prices[0];
  if (first === undefined) return null;
  const amounts = prices.filter((price) => price.currency === first.currency).map((price) => price.amount);
  return {
    min: { amount: Math.min(...amounts), currency: first.currency },
    max: { amount: Math.max(...amounts), currency: first.currency },
  };
}

/**
 * The grey line under a section title: "7 products · ₹19,990 – ₹34,499".
 *
 * @example groupMeta(group) // "1 product · ₹29,999"
 */
export function groupMeta(group: ProductGroup): string {
  const count = pluralize(group.products.length, "product");
  const range = priceRange(group.products);
  if (range === null) return count;
  if (range.min.amount === range.max.amount) return `${count} · ${formatMoney(range.min)}`;
  return `${count} · ${formatMoney(range.min)} – ${formatMoney(range.max)}`;
}

export type GroupAction =
  | { kind: "compare-all"; label: string }
  | { kind: "open"; label: "Open comparison"; comparison: CatalogComparisonSummary };

/**
 * The section's header action: open the comparison that already holds exactly this group's products,
 * otherwise offer to create one.
 *
 * @example groupAction(group, comparisons).kind // "open" | "compare-all"
 */
export function groupAction(group: ProductGroup, comparisons: readonly CatalogComparisonSummary[]): GroupAction {
  const wanted = new Set(group.products.map((product) => product.id));
  const existing = comparisons.find(
    (comparison) => comparison.productIds.length === wanted.size && comparison.productIds.every((id) => wanted.has(id)),
  );
  if (existing !== undefined) return { kind: "open", label: "Open comparison", comparison: existing };
  return { kind: "compare-all", label: `Compare all ${group.products.length}` };
}
