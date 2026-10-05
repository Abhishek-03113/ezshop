import { describe, expect, test } from "bun:test";
import {
  describeSupportedProductUrls,
  extractProductSnapshot,
  findSiteExtractor,
  isSupportedProductUrl,
} from "../src/extract/extract-product.ts";
import { ProductPageError } from "../src/extract/product-page-error.ts";
import { parseHtmlPage } from "../src/page/cheerio-page.ts";
import { FakeSiteExtractor } from "./fakes/fake-site-extractor.ts";

const shopA = new FakeSiteExtractor("amazon.in", "shop-a.test");
const shopB = new FakeSiteExtractor("flipkart.com", "shop-b.test");
const EXTRACTORS = [shopA, shopB];

describe("findSiteExtractor", () => {
  test("picks the extractor that owns the URL", () => {
    expect(findSiteExtractor("https://shop-b.test/item/9", EXTRACTORS)).toBe(shopB);
    expect(findSiteExtractor("https://elsewhere.test/item/9", EXTRACTORS)).toBeNull();
  });

  test("knows the real sites by default", () => {
    expect(isSupportedProductUrl("https://www.amazon.in/dp/B0FQG1YHYR")).toBe(true);
    expect(isSupportedProductUrl("https://www.flipkart.com/x/p/itm1a2b?pid=MOB1")).toBe(true);
    expect(isSupportedProductUrl("https://www.amazon.in/s?k=x")).toBe(false);
  });
});

describe("describeSupportedProductUrls", () => {
  test("lists every source with its example", () => {
    expect(describeSupportedProductUrls(EXTRACTORS)).toBe(
      "a product page on amazon.in (e.g. https://shop-a.test/item/1) or flipkart.com (e.g. https://shop-b.test/item/1)",
    );
  });
});

describe("extractProductSnapshot", () => {
  test("delegates to the owning extractor", () => {
    const snapshot = extractProductSnapshot(
      parseHtmlPage("<h1>Kettle</h1>"),
      "https://shop-a.test/item/7",
      new Date(0),
      EXTRACTORS,
    );
    expect(snapshot).toMatchObject({ source: "amazon.in", externalId: "7", title: "Kettle" });
  });

  test("rejects unsupported URLs, naming the URL and the supported sites", () => {
    const run = () => extractProductSnapshot(parseHtmlPage(""), "https://example.com/x", new Date(0), EXTRACTORS);
    expect(run).toThrow(ProductPageError);
    expect(run).toThrow('Unsupported product URL "https://example.com/x"; expected a product page on amazon.in');
  });
});
