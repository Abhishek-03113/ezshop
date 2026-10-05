/** Downloads a product page's HTML; fetch-html-fetcher.ts implements it over fetch. */
export interface HtmlFetcher {
  fetchHtml(url: string): Promise<string>;
}

type FetchFunction = (input: string, init: RequestInit) => Promise<Response>;

/**
 * HtmlFetcher over fetch with the user's cookies, so the page looks like it does in their browser
 * (same prices and delivery location). Needs the marketplace host permissions.
 *
 * @example const html = await new FetchHtmlFetcher(fetch).fetchHtml("https://www.amazon.in/dp/B0FQG1YHYR")
 */
export class FetchHtmlFetcher implements HtmlFetcher {
  constructor(private readonly fetchFunction: FetchFunction) {}

  async fetchHtml(url: string): Promise<string> {
    // Called as a bare function: the browser's fetch throws "Illegal invocation" when `this` is
    // not the global scope, which `this.fetchFunction(...)` would make it.
    const { fetchFunction } = this;
    const response = await fetchFunction(url, { credentials: "include" });
    if (!response.ok) throw new Error(`Fetching ${url} returned HTTP ${response.status}; expected 200 with HTML`);
    return response.text();
  }
}
