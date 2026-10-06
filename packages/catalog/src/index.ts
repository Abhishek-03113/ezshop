export * from "./product-snapshot.ts";
export type { CatalogComparisonDetail, CatalogComparisonSummary } from "./comparison-types.ts";
export type { CatalogUser } from "./user-types.ts";
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
export { availabilityTone, type AvailabilityTone } from "./present/availability-tone.ts";
export { discountPercent, formatMoney, savingsAmount } from "./present/money-format.ts";
export { pluralize } from "./present/pluralize.ts";
export { countSpecs, filterSpecGroups, specCountLabel, specGroupAnchor } from "./present/spec-search.ts";
export { formatCaptureTime } from "./present/capture-time.ts";
export { sourceLabel } from "./present/source-label.ts";
export { ratingCountLabel } from "./present/rating-label.ts";
