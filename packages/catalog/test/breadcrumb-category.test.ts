import { describe, expect, test } from "bun:test";
import {
  amazonBreadcrumbLabels,
  categoryFromCrumbs,
  jsonLdBreadcrumbLabels,
} from "../src/extract/shared/breadcrumb-category.ts";
import { extractAmazonProduct } from "../src/extract/amazon/amazon-extractor.ts";
import { parseHtmlPage } from "../src/page/cheerio-page.ts";
import { ProductSnapshotSchema } from "../src/product-snapshot.ts";

const AMAZON_TRAIL = `<div id="wayfinding-breadcrumbs_feature_div"><ul>
  <li><span><a>Electronics</a></span></li><li class="a-breadcrumb-divider"><span>›</span></li>
  <li><span><a>Monitors</a></span></li></ul></div>`;

const FLIPKART_TRAIL = `<script type="application/ld+json">{"@type":"BreadcrumbList","itemListElement":[
  {"position":1,"item":{"name":"Home"}},{"position":2,"item":{"name":"Monitors"}},{"position":3,"name":"Dell S2425H"}]}</script>`;

describe("categoryFromCrumbs", () => {
  test("takes the last meaningful crumb", () => {
    expect(categoryFromCrumbs(["Electronics", "Monitors"], "Dell")).toBe("Monitors");
  });

  test("skips Home and a crumb repeating the product title", () => {
    expect(categoryFromCrumbs(["Home", "Monitors", "Dell S2425H"], "Dell S2425H")).toBe("Monitors");
    expect(categoryFromCrumbs(["Home"], "Dell")).toBeNull();
  });

  test("is null for an empty trail", () => {
    expect(categoryFromCrumbs([], "Dell")).toBeNull();
  });
});

describe("breadcrumb readers", () => {
  test("amazonBreadcrumbLabels ignores the dividers", () => {
    expect(amazonBreadcrumbLabels(parseHtmlPage(AMAZON_TRAIL))).toEqual(["Electronics", "Monitors"]);
  });

  test("jsonLdBreadcrumbLabels reads name and item.name crumbs", () => {
    expect(jsonLdBreadcrumbLabels(parseHtmlPage(FLIPKART_TRAIL))).toEqual(["Home", "Monitors", "Dell S2425H"]);
  });

  test("jsonLdBreadcrumbLabels is empty without a BreadcrumbList", () => {
    expect(jsonLdBreadcrumbLabels(parseHtmlPage("<p>x</p>"))).toEqual([]);
  });

  test("the Amazon extractor puts the category on the snapshot", () => {
    const page = parseHtmlPage(`<span id="productTitle">Dell</span>${AMAZON_TRAIL}`);
    expect(extractAmazonProduct(page, { asin: "B000000001" }, new Date()).category).toBe("Monitors");
  });
});

describe("ProductSnapshotSchema category", () => {
  test("rows stored before categories existed parse with a null category", () => {
    const legacy = {
      source: "amazon.in",
      externalId: "B1",
      url: "https://www.amazon.in/dp/B1",
      title: "Old",
      brand: null,
      price: null,
      listPrice: null,
      availability: null,
      rating: null,
      images: [],
      highlights: [],
      specGroups: [],
      capturedAt: "2026-10-05T10:00:00.000Z",
    };
    expect(ProductSnapshotSchema.parse(legacy).category).toBeNull();
  });
});
