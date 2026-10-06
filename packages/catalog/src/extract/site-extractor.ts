import type { PageNode } from "../page/page-node.ts";
import type { ProductSnapshot, ProductSource } from "../product-snapshot.ts";

/**
 * Everything Picky knows about reading one marketplace. Add a site by implementing this and
 * listing it in SITE_EXTRACTORS; nothing else in the API, web app or extension changes.
 *
 * @example flipkartExtractor.productIdFromUrl("https://www.flipkart.com/x/p/itm1?pid=MOB1") // "MOB1"
 */
export interface SiteExtractor {
  readonly source: ProductSource;
  /** A real product URL on this site, shown in error messages and UI hints. */
  readonly exampleUrl: string;
  /** The site's product id when the URL is one of its product pages, else null. */
  productIdFromUrl(pageUrl: string): string | null;
  /** Reads a product page. Throws ProductPageError when the page is not a readable product page. */
  extract(page: PageNode, pageUrl: string, capturedAt: Date): ProductSnapshot;
}
