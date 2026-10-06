import { PRODUCT_SOURCES, sourceLabel, type ProductSource } from "@ezshop/catalog";

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
