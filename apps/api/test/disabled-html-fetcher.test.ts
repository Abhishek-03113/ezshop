import { describe, expect, test } from "bun:test";
import { DisabledHtmlFetcher, UrlImportDisabledError } from "../src/scraping/disabled-html-fetcher.ts";

describe("DisabledHtmlFetcher", () => {
  test("refuses every URL, naming it and the settings that enable import", async () => {
    const fetching = new DisabledHtmlFetcher().fetchHtml("https://www.amazon.in/dp/B0FQG1YHYR");
    await expect(fetching).rejects.toBeInstanceOf(UrlImportDisabledError);
    await expect(fetching).rejects.toThrow(/amazon\.in\/dp\/B0FQG1YHYR.*FIRECRAWL_API_KEY/);
  });
});
