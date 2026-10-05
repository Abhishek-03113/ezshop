import { describe, expect, test } from "bun:test";
import { extractAmazonProduct } from "../src/extract/amazon/amazon-extractor.ts";
import { ProductPageError } from "../src/extract/product-page-error.ts";
import { parseHtmlPage } from "../src/page/cheerio-page.ts";
import { amazonExtractor } from "../src/extract/amazon/amazon-extractor.ts";

const CAPTURED_AT = new Date("2026-10-05T10:00:00Z");

describe("extractAmazonProduct on a non-product page", () => {
  test("names the ASIN and the expected page in the error", () => {
    const challenge = parseHtmlPage("<html><body>bm-verify</body></html>");
    expect(() => extractAmazonProduct(challenge, { asin: "B0FQG1YHYR" }, CAPTURED_AT)).toThrow(
      new ProductPageError(
        "Amazon page for ASIN B0FQG1YHYR has no #productTitle; expected a product detail page, got a challenge, mobile or error page",
      ),
    );
  });

  test("falls back to the URL ASIN and the byline brand", () => {
    const page = parseHtmlPage(`<span id="productTitle">Widget</span><a id="bylineInfo">Brand: Acme</a>`);
    const snapshot = extractAmazonProduct(page, { asin: "B000000001" }, CAPTURED_AT);
    expect(snapshot.externalId).toBe("B000000001");
    expect(snapshot.brand).toBe("Acme");
  });
});

describe("amazonExtractor", () => {
  test("reads the ASIN from product URLs only", () => {
    expect(amazonExtractor.productIdFromUrl(amazonExtractor.exampleUrl)).toBe("B0FQG1YHYR");
    expect(amazonExtractor.productIdFromUrl("https://www.amazon.in/s?k=x")).toBeNull();
  });

  test("refuses to extract a URL it does not own", () => {
    expect(() => amazonExtractor.extract(parseHtmlPage(""), "https://example.com", CAPTURED_AT)).toThrow(
      '"https://example.com" is not an Amazon.in product URL',
    );
  });
});
