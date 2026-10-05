import { ScrapeError, type HtmlFetcher } from "../../src/scraping/html-fetcher.ts";

/** HtmlFetcher serving canned HTML per URL and recording what was requested. */
export class FakeHtmlFetcher implements HtmlFetcher {
  readonly requestedUrls: string[] = [];

  constructor(private readonly htmlByUrl: ReadonlyMap<string, string>) {}

  async fetchHtml(url: string): Promise<string> {
    this.requestedUrls.push(url);
    const html = this.htmlByUrl.get(url);
    if (html === undefined) throw new ScrapeError(`FakeHtmlFetcher has no page for ${url}`);
    return html;
  }
}
