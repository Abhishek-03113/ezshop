import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { Window } from "happy-dom";
import { FetchHtmlFetcher } from "../../src/link-capture/html-fetcher.ts";
import { isParseProductRequest } from "../../src/link-capture/offscreen-protocol.ts";
import { parseProductHtml, type HtmlDocumentParser } from "../../src/link-capture/parse-product-html.ts";
import { FakePageServer } from "../fakes/fake-page-server.ts";
import { ReceiverStrictFetch } from "../fakes/receiver-strict-fetch.ts";

const FIXTURE_DIR = "../../../../packages/catalog/test/fixtures/amazon.in";
const FIXTURE_URL = "https://www.amazon.in/dp/B0FQG1YHYR";

function happyParser(): HtmlDocumentParser {
  const window = new Window({ settings: { disableJavaScriptEvaluation: true, disableCSSFileLoading: true } });
  return new window.DOMParser() as unknown as HtmlDocumentParser;
}

describe("FetchHtmlFetcher", () => {
  test("calls fetch as a bare function, not as a method (browser 'Illegal invocation')", async () => {
    const fetch = new ReceiverStrictFetch(() => new Response("<html>ok</html>"));
    expect(await new FetchHtmlFetcher(fetch.fetch).fetchHtml(FIXTURE_URL)).toBe("<html>ok</html>");
  });
  test("fetches with the user's cookies and returns the text", async () => {
    const server = new FakePageServer(200, "<html>ok</html>");
    expect(await new FetchHtmlFetcher(server.fetch).fetchHtml(FIXTURE_URL)).toBe("<html>ok</html>");
    expect(server.requests).toEqual([{ url: FIXTURE_URL, credentials: "include" }]);
  });
  test("throws with the URL and status for a non-200", async () => {
    const server = new FakePageServer(503, "captcha");
    await expect(new FetchHtmlFetcher(server.fetch).fetchHtml(FIXTURE_URL)).rejects.toThrow(
      `${FIXTURE_URL} returned HTTP 503`,
    );
  });
});

describe("parseProductHtml", () => {
  test("extracts a snapshot from fetched Amazon HTML via DOMParser", () => {
    const html = readFileSync(new URL(`${FIXTURE_DIR}/iphone-17-512gb-white.html`, import.meta.url), "utf8");
    const result = parseProductHtml(happyParser(), html, FIXTURE_URL, new Date("2026-10-05T10:00:00Z"));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.snapshot.title.length).toBeGreaterThan(0);
  });
  test("reports a non-product page as a failure, not an exception", () => {
    const result = parseProductHtml(happyParser(), "<html><body>hi</body></html>", FIXTURE_URL, new Date());
    expect(result.ok).toBe(false);
  });
});

describe("isParseProductRequest", () => {
  test("accepts only messages addressed to the offscreen parser", () => {
    expect(isParseProductRequest({ target: "offscreen", type: "parse-product", html: "", url: "" })).toBe(true);
    expect(isParseProductRequest({ type: "parse-product" })).toBe(false);
    expect(isParseProductRequest(null)).toBe(false);
  });
});
