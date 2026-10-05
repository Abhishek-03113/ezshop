export * from "./product-snapshot.ts";
export type { CatalogComparisonDetail, CatalogComparisonSummary } from "./comparison-types.ts";
export {
  describeSupportedProductUrls,
  extractProductSnapshot,
  findSiteExtractor,
  isSupportedProductUrl,
} from "./extract/extract-product.ts";
export type { SiteExtractor } from "./extract/site-extractor.ts";
export { SITE_EXTRACTORS } from "./extract/site-extractors.ts";
export { ProductPageError } from "./extract/product-page-error.ts";
export type { PageNode } from "./page/page-node.ts";
export { parseMoney } from "./money/parse-money.ts";
export { buildComparisonMatrix } from "./compare/build-matrix.ts";
export { flipkartSearchUrl } from "./compare/flipkart-search-url.ts";
export type {
  ComparisonCell,
  ComparisonGroup,
  ComparisonMatrix,
  ComparisonOptions,
  ComparisonRow,
} from "./compare/types.ts";
