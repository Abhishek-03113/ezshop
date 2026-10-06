import {
  describeSupportedProductUrls,
  extractProductSnapshot,
  isSupportedProductUrl,
  ProductPageError,
  ProductSnapshotSchema,
  type CatalogProduct,
} from "@picky/catalog";
import { parseHtmlPage } from "@picky/catalog/cheerio";
import type { HtmlFetcher } from "../scraping/html-fetcher.ts";
import type { ProductRepository } from "./product-repository.ts";

/** A submitted snapshot does not match ProductSnapshotSchema. `issues` lists each failing path. */
export class InvalidSnapshotError extends Error {
  override readonly name = "InvalidSnapshotError";
  constructor(
    message: string,
    readonly issues: readonly string[],
  ) {
    super(message);
  }
}

/**
 * The two ways products enter picky: a snapshot captured by the extension in the user's
 * browser, or a URL the API scrapes itself through the HtmlFetcher (Firecrawl).
 *
 * @example await new ProductIngestion(repository, fetcher, () => new Date()).importFromUrl(url)
 */
export class ProductIngestion {
  constructor(
    private readonly repository: ProductRepository,
    private readonly htmlFetcher: HtmlFetcher,
    private readonly now: () => Date,
  ) {}

  async ingestSnapshot(candidate: unknown): Promise<CatalogProduct> {
    const parsed = ProductSnapshotSchema.safeParse(candidate);
    if (parsed.success) return this.repository.saveSnapshot(parsed.data);
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`);
    throw new InvalidSnapshotError(`Snapshot rejected: ${issues.join("; ")}`, issues);
  }

  async importFromUrl(url: string): Promise<CatalogProduct> {
    if (!isSupportedProductUrl(url)) {
      throw new ProductPageError(`Cannot import "${url}"; expected ${describeSupportedProductUrls()}`);
    }
    const html = await this.htmlFetcher.fetchHtml(url);
    const snapshot = extractProductSnapshot(parseHtmlPage(html), url, this.now());
    return this.repository.saveSnapshot(snapshot);
  }
}
