import { type CatalogProductSummary, type Money, sourceLabel } from "@ezshop/catalog";
import type { GroupKey } from "./group-options.ts";

export interface ProductGroup {
  /** Stable id, e.g. "category:Monitors"; keys React lists and remembers collapsed sections. */
  id: string;
  name: string;
  products: CatalogProductSummary[];
}

/** Name of the catch-all section for products with no category (or brand) to group by. */
export const OTHER_GROUP_NAME = "Other";
export const ALL_PRODUCTS_GROUP_NAME = "All products";

// Rupee thresholds from the product brief: <₹25k, ₹25–35k, >₹35k. Products without a price get their own band.
const PRICE_BANDS = ["Under ₹25k", "₹25k – ₹35k", "Over ₹35k"] as const;
const NO_PRICE_BAND = "No price";
const LOW_BAND_LIMIT = 25_000;
const HIGH_BAND_LIMIT = 35_000;

/**
 * Splits the library into sections. Category, brand and store sections are biggest first (then A–Z) with
 * "Other" last; price bands run cheapest first. Within a section the incoming order (newest first) is kept.
 *
 * @example groupProducts(products, "category").map((group) => group.name) // ["Monitors", "Headphones", "Other"]
 */
export function groupProducts(products: readonly CatalogProductSummary[], key: GroupKey): ProductGroup[] {
  if (products.length === 0) return [];
  if (key === "none") return [{ id: "none", name: ALL_PRODUCTS_GROUP_NAME, products: [...products] }];
  const sections = new Map<string, CatalogProductSummary[]>();
  for (const product of products) {
    const name = sectionName(product, key);
    sections.set(name, [...(sections.get(name) ?? []), product]);
  }
  const groups = [...sections].map(([name, members]) => ({ id: `${key}:${name}`, name, products: members }));
  return key === "price" ? groups.sort(byPriceBand) : groups.sort(bySizeThenName);
}

function sectionName(product: CatalogProductSummary, key: Exclude<GroupKey, "none">): string {
  if (key === "store") return sourceLabel(product.source);
  if (key === "price") return priceBandName(product.price);
  return (key === "brand" ? product.brand : product.category) ?? OTHER_GROUP_NAME;
}

/**
 * Price band a price falls in.
 *
 * @example priceBandName({ amount: 29999, currency: "INR" }) // "₹25k – ₹35k"
 */
export function priceBandName(price: Money | null): string {
  if (price === null) return NO_PRICE_BAND;
  if (price.amount < LOW_BAND_LIMIT) return PRICE_BANDS[0];
  return price.amount <= HIGH_BAND_LIMIT ? PRICE_BANDS[1] : PRICE_BANDS[2];
}

function bySizeThenName(a: ProductGroup, b: ProductGroup): number {
  const aOther = a.name === OTHER_GROUP_NAME;
  const bOther = b.name === OTHER_GROUP_NAME;
  if (aOther !== bOther) return aOther ? 1 : -1;
  return b.products.length - a.products.length || a.name.localeCompare(b.name);
}

function byPriceBand(a: ProductGroup, b: ProductGroup): number {
  return bandRank(a.name) - bandRank(b.name);
}

function bandRank(name: string): number {
  const rank = PRICE_BANDS.findIndex((band) => band === name);
  return rank === -1 ? PRICE_BANDS.length : rank;
}
