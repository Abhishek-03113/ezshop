import { describe, expect, test } from "bun:test";
import { FirecrawlHtmlFetcher } from "../src/scraping/firecrawl-html-fetcher.ts";
import { ScrapeError } from "../src/scraping/html-fetcher.ts";
import { FakeFirecrawlServer } from "./fakes/fake-firecrawl-server.ts";

const PAGE = "https://www.amazon.in/dp/B0FQG1YHYR";

describe("FirecrawlHtmlFetcher", () => {
  test("requests rawHtml with a pinned desktop user agent", async () => {
    const server = new FakeFirecrawlServer(200, { success: true, data: { rawHtml: "<html></html>" } });
    const html = await new FirecrawlHtmlFetcher("http://fc", server.fetch).fetchHtml(PAGE);
    expect(html).toBe("<html></html>");
    expect(server.calls[0]?.url).toBe("http://fc/v2/scrape");
    expect(server.calls[0]?.body).toMatchObject({ url: PAGE, formats: ["rawHtml"] });
    expect(JSON.stringify(server.calls[0]?.body.headers)).toContain("X11; Linux x86_64");
  });

  test("sends no authorization header to a self-hosted instance", async () => {
    const server = new FakeFirecrawlServer(200, { success: true, data: { rawHtml: "<html></html>" } });
    await new FirecrawlHtmlFetcher("http://fc", server.fetch).fetchHtml(PAGE);
    expect(server.calls[0]?.headers.authorization).toBeUndefined();
  });

  test("authenticates to hosted Firecrawl with a bearer API key", async () => {
    const server = new FakeFirecrawlServer(200, { success: true, data: { rawHtml: "<html></html>" } });
    await new FirecrawlHtmlFetcher("https://api.firecrawl.dev", server.fetch, "fc-123").fetchHtml(PAGE);
    expect(server.calls[0]?.headers.authorization).toBe("Bearer fc-123");
  });

  test("surfaces Firecrawl's error with the URL", async () => {
    const server = new FakeFirecrawlServer(500, { success: false, error: "timeout" });
    const fetching = new FirecrawlHtmlFetcher("http://fc", server.fetch).fetchHtml(PAGE);
    await expect(fetching).rejects.toThrow(new ScrapeError(`Firecrawl could not scrape ${PAGE} (HTTP 500): timeout`));
  });

  test("rejects a body that is not a Firecrawl response", async () => {
    const server = new FakeFirecrawlServer(200, ["nope"]);
    await expect(new FirecrawlHtmlFetcher("http://fc", server.fetch).fetchHtml(PAGE)).rejects.toThrow(
      "unexpected body",
    );
  });
});
