import { describe, expect, test } from "bun:test";
import { extractAmazonSpecGroups } from "../src/extract/amazon/amazon-specs.ts";
import { parseHtmlPage } from "../src/page/cheerio-page.ts";

describe("extractAmazonSpecGroups", () => {
  test("reads overview and product-detail tables in display order", () => {
    const page = parseHtmlPage(`
      <table id="productDetails_techSpec_section_1"><tr><th>ASIN</th><td>B0X</td></tr></table>
      <div id="productOverview_feature_div"><table><tr><td>Brand</td><td>Apple</td></tr></table></div>`);
    expect(extractAmazonSpecGroups(page)).toEqual([
      { title: "At a glance", specs: [{ label: "Brand", value: "Apple" }] },
      { title: "Product details", specs: [{ label: "ASIN", value: "B0X" }] },
    ]);
  });

  test("reads the detail-bullet layout and trims the label colon", () => {
    const page = parseHtmlPage(`<div id="detailBullets_feature_div"><ul>
      <li><span><span class="a-text-bold">Brand ‏ : ‎</span><span>Apple</span></span></li></ul></div>`);
    expect(extractAmazonSpecGroups(page)).toEqual([
      { title: "Item details", specs: [{ label: "Brand", value: "Apple" }] },
    ]);
  });

  test("skips rows with a blank label or value, and empty groups", () => {
    const page = parseHtmlPage(`<div id="tech"><table><tr><td></td><td>x</td></tr></table></div>`);
    expect(extractAmazonSpecGroups(page)).toEqual([]);
  });
});
