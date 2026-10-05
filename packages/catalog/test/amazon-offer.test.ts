import { describe, expect, test } from "bun:test";
import { extractAmazonListPrice, extractAmazonPrice, extractAmazonRating } from "../src/extract/amazon/amazon-offer.ts";
import { parseHtmlPage } from "../src/page/cheerio-page.ts";

describe("extractAmazonPrice", () => {
  test("falls back to the visible price when .a-offscreen is blank", () => {
    const page = parseHtmlPage(
      `<span class="priceToPay"><span class="a-offscreen"></span><span aria-hidden="true">₹1,24,900</span></span>`,
    );
    expect(extractAmazonPrice(page)).toEqual({ amount: 124900, currency: "INR" });
  });

  test("returns null without a price", () => {
    expect(extractAmazonPrice(parseHtmlPage("<p></p>"))).toBeNull();
  });
});

describe("extractAmazonListPrice", () => {
  test("reads the M.R.P.", () => {
    const page = parseHtmlPage(`<span class="basisPrice"><span class="a-offscreen">₹1,33,399</span></span>`);
    expect(extractAmazonListPrice(page)).toEqual({ amount: 133399, currency: "INR" });
    expect(extractAmazonListPrice(parseHtmlPage("<p></p>"))).toBeNull();
  });
});

describe("extractAmazonRating", () => {
  test("reads average from the popover title and the count", () => {
    const page = parseHtmlPage(
      `<span id="acrPopover" title="4.7 out of 5 stars"></span><span id="acrCustomerReviewText">(1,753)</span>`,
    );
    expect(extractAmazonRating(page)).toEqual({ average: 4.7, count: 1753 });
  });

  test("falls back to the star icon text and a zero count", () => {
    const page = parseHtmlPage(
      `<div id="averageCustomerReviews"><span class="a-icon-alt">4.5 out of 5 stars</span></div>`,
    );
    expect(extractAmazonRating(page)).toEqual({ average: 4.5, count: 0 });
  });

  test("returns null when the product has no rating", () => {
    expect(extractAmazonRating(parseHtmlPage("<p></p>"))).toBeNull();
  });
});
