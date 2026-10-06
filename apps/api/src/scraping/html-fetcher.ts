/** Fetches a page's fully rendered HTML. Picky's interface over the scraping backend (Firecrawl). */
export interface HtmlFetcher {
  fetchHtml(url: string): Promise<string>;
}

/** The scraping backend failed or returned something other than a usable page. */
export class ScrapeError extends Error {
  override readonly name = "ScrapeError";
}
