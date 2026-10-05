import type { PageNode } from "../page/page-node.ts";
import type { ProductSnapshot } from "../product-snapshot.ts";
import { ProductPageError } from "./product-page-error.ts";
import type { SiteExtractor } from "./site-extractor.ts";
import { SITE_EXTRACTORS } from "./site-extractors.ts";

/**
 * The extractor whose site owns this product URL, or null.
 *
 * @example findSiteExtractor("https://www.amazon.in/dp/B0FQG1YHYR")?.source // "amazon.in"
 */
export function findSiteExtractor(
  pageUrl: string,
  extractors: readonly SiteExtractor[] = SITE_EXTRACTORS,
): SiteExtractor | null {
  return extractors.find((extractor) => extractor.productIdFromUrl(pageUrl) !== null) ?? null;
}

/**
 * True when some extractor reads this URL. The extension and API use it to refuse early.
 *
 * @example isSupportedProductUrl("https://www.flipkart.com/x/p/itm1?pid=MOB1") // true
 */
export function isSupportedProductUrl(
  pageUrl: string,
  extractors: readonly SiteExtractor[] = SITE_EXTRACTORS,
): boolean {
  return findSiteExtractor(pageUrl, extractors) !== null;
}

/**
 * Human-readable list of what a supported URL looks like, for error messages.
 *
 * @example describeSupportedProductUrls() // "a product page on amazon.in (e.g. https://…) or flipkart.com (e.g. https://…)"
 */
export function describeSupportedProductUrls(extractors: readonly SiteExtractor[] = SITE_EXTRACTORS): string {
  const sites = extractors.map((extractor) => `${extractor.source} (e.g. ${extractor.exampleUrl})`);
  return `a product page on ${sites.join(" or ")}`;
}

/**
 * Picks the extractor for the page's site and reads the page into a ProductSnapshot.
 * Throws ProductPageError for unsupported URLs or non-product pages.
 *
 * @example extractProductSnapshot(wrapDomDocument(document), location.href, new Date())
 */
export function extractProductSnapshot(
  page: PageNode,
  pageUrl: string,
  capturedAt: Date,
  extractors: readonly SiteExtractor[] = SITE_EXTRACTORS,
): ProductSnapshot {
  const extractor = findSiteExtractor(pageUrl, extractors);
  if (extractor !== null) return extractor.extract(page, pageUrl, capturedAt);
  throw new ProductPageError(
    `Unsupported product URL "${pageUrl}"; expected ${describeSupportedProductUrls(extractors)}`,
  );
}
