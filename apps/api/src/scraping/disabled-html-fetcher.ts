import type { HtmlFetcher } from "./html-fetcher.ts";

/** URL import was requested but no scraping backend (Firecrawl) is configured on this server. */
export class UrlImportDisabledError extends Error {
  override readonly name = "UrlImportDisabledError";
}

/**
 * HtmlFetcher for deployments without Firecrawl: products then enter only through the extension's
 * in-browser DOM capture, and every URL import is refused with a pointer to the setting that enables it.
 *
 * @example await new DisabledHtmlFetcher().fetchHtml(url) // throws UrlImportDisabledError
 */
export class DisabledHtmlFetcher implements HtmlFetcher {
  async fetchHtml(url: string): Promise<string> {
    throw new UrlImportDisabledError(
      `Cannot import "${url}": URL import is off on this server. Capture the page with the Picky extension, ` +
        "or set FIRECRAWL_API_KEY (hosted) or FIRECRAWL_URL (self-hosted) to enable it.",
    );
  }
}
