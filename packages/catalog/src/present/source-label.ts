import type { ProductSource } from "../product-snapshot.ts";

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
