export interface SupportedSite {
  readonly name: string;
  readonly host: string;
}

// Hard-coded because @picky/catalog (PRODUCT_SOURCES) is not a dependency of this app.
// Keep in sync with packages/catalog when a store is added.
export const SUPPORTED_SITES: readonly SupportedSite[] = [
  { name: "Amazon.in", host: "amazon.in" },
  { name: "Flipkart", host: "flipkart.com" },
];
