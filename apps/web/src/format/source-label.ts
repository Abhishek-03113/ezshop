import { PRODUCT_SOURCES, type ProductSource } from "@ezshop/catalog";

/** Display names for each marketplace; typed as a full Record so a new source cannot be forgotten. */
const SOURCE_LABELS: Record<ProductSource, string> = {
  "amazon.in": "Amazon.in",
  "flipkart.com": "Flipkart",
};

/**
 * Human-readable store name.
 *
 * @example sourceLabel("flipkart.com") // "Flipkart"
 */
export function sourceLabel(source: ProductSource): string {
  return SOURCE_LABELS[source];
}

export type StoreFilter = "all" | ProductSource;

export interface StoreFilterOption {
  value: StoreFilter;
  label: string;
}

/**
 * Segments for the library's store filter: "All" first, then one per supported source.
 *
 * @example storeFilterOptions().map((option) => option.label) // ["All", "Amazon.in", "Flipkart"]
 */
export function storeFilterOptions(): StoreFilterOption[] {
  return [
    { value: "all", label: "All" },
    ...PRODUCT_SOURCES.map((source) => ({ value: source, label: sourceLabel(source) })),
  ];
}
