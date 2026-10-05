import { describe, expect, test } from "bun:test";
import { extractFlipkartProduct, flipkartExtractor } from "../src/extract/flipkart/flipkart-extractor.ts";
import { extractFlipkartSpecGroups } from "../src/extract/flipkart/flipkart-specs.ts";
import { parseFlipkartProductUrl } from "../src/extract/flipkart/flipkart-url.ts";
import { ProductPageError } from "../src/extract/product-page-error.ts";
import { parseHtmlPage } from "../src/page/cheerio-page.ts";

const section = (title: string, rows: [string, string][]) =>
  `<div class="grid-formation grid-column-1"><div><div font="default-fk-font-l">${title}</div>${rows
    .map(
      ([label, value]) =>
        `<div class="grid-formation-dynamic"><div font="default-fk-font-m">${label}</div><div font="s">${value}</div></div>`,
    )
    .join("")}</div></div>`;
const productLd = `<script type="application/ld+json">[{"@type":"Product","name":"Phone X","sku":"MOB1","brand":{"name":"ACME"},"image":["https://i/1.jpg"],"offers":{"price":999,"priceCurrency":"INR"}}]</script>`;

describe("parseFlipkartProductUrl", () => {
  test("keeps slug, item id and pid; drops tracking", () => {
    expect(parseFlipkartProductUrl("https://www.flipkart.com/phone-x/p/itm68ad?pid=MOB1&lid=L&srno=s_1")).toEqual({
      productId: "MOB1",
      canonicalUrl: "https://www.flipkart.com/phone-x/p/itm68ad?pid=MOB1",
    });
  });

  test("falls back to the item id without pid, and rejects non-product pages", () => {
    expect(parseFlipkartProductUrl("https://flipkart.com/phone-x/p/itm68ad")?.productId).toBe("itm68ad");
    expect(parseFlipkartProductUrl("https://www.flipkart.com/search?q=phone")).toBeNull();
    expect(parseFlipkartProductUrl("https://www.amazon.in/phone-x/p/itm68ad")).toBeNull();
  });
});

describe("extractFlipkartSpecGroups", () => {
  test("reads titled sections and puts General first", () => {
    const page = parseHtmlPage(
      section("Display Features", [["Display Size", "6.3 inch"]]) + section("General", [["Brand", "Acme"]]),
    );
    expect(extractFlipkartSpecGroups(page).map((group) => group.title)).toEqual(["General", "Display Features"]);
  });
});

describe("extractFlipkartProduct", () => {
  const ref = { productId: "MOB1", canonicalUrl: "https://www.flipkart.com/phone-x/p/itm1?pid=MOB1" };

  test("combines JSON-LD identity with spec sections, preferring the spec Brand", () => {
    const snapshot = extractFlipkartProduct(
      parseHtmlPage(productLd + section("General", [["Brand", "Acme"]])),
      ref,
      new Date(0),
    );
    expect(snapshot).toMatchObject({
      source: "flipkart.com",
      externalId: "MOB1",
      title: "Phone X",
      brand: "Acme",
      price: { amount: 999, currency: "INR" },
      listPrice: null,
    });
  });

  test("throws when the page has no JSON-LD product", () => {
    expect(() => extractFlipkartProduct(parseHtmlPage("<p>captcha</p>"), ref, new Date(0))).toThrow(
      new ProductPageError(
        "Flipkart page for MOB1 has no schema.org Product with a name in its JSON-LD; expected a product detail page",
      ),
    );
  });
});

describe("flipkartExtractor", () => {
  test("owns Flipkart product URLs only", () => {
    expect(flipkartExtractor.productIdFromUrl(flipkartExtractor.exampleUrl)).toBe("MOBHQV9YAZYYWY8A");
    expect(() => flipkartExtractor.extract(parseHtmlPage(""), "https://example.com", new Date(0))).toThrow(
      "is not a Flipkart product URL",
    );
  });
});
