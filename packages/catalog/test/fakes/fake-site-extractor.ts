import type { SiteExtractor } from "../../src/extract/site-extractor.ts";
import type { PageNode } from "../../src/page/page-node.ts";
import type { ProductSnapshot, ProductSource } from "../../src/product-snapshot.ts";

/** SiteExtractor owning URLs on one host; returns a minimal snapshot titled with the page's <h1>. */
export class FakeSiteExtractor implements SiteExtractor {
  readonly exampleUrl: string;

  constructor(
    readonly source: ProductSource,
    private readonly host: string,
  ) {
    this.exampleUrl = `https://${host}/item/1`;
  }

  productIdFromUrl(pageUrl: string): string | null {
    const url = URL.parse(pageUrl);
    return url?.hostname === this.host ? url.pathname.split("/").at(-1) || null : null;
  }

  extract(page: PageNode, pageUrl: string, capturedAt: Date): ProductSnapshot {
    return {
      source: this.source,
      externalId: this.productIdFromUrl(pageUrl) ?? "unknown",
      url: pageUrl,
      title: page.findAll("h1")[0]?.text() ?? "untitled",
      brand: null,
      category: null,
      price: null,
      listPrice: null,
      availability: null,
      rating: null,
      images: [],
      highlights: [],
      specGroups: [],
      capturedAt: capturedAt.toISOString(),
    };
  }
}
