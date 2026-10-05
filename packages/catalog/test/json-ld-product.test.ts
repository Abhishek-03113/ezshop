import { describe, expect, test } from "bun:test";
import { parseJsonLdNodes, readJsonLdProduct } from "../src/extract/shared/json-ld-product.ts";
import { parseHtmlPage } from "../src/page/cheerio-page.ts";

const ldScript = (json: unknown) => `<script type="application/ld+json">${JSON.stringify(json)}</script>`;

describe("readJsonLdProduct", () => {
  test("normalises a Flipkart-style product (array, brand object, single offer)", () => {
    const page = parseHtmlPage(
      ldScript([
        {
          "@type": "Product",
          name: "Phone",
          sku: "MOB1",
          image: ["https://i/1.jpg"],
          brand: { name: "APPLE" },
          aggregateRating: { ratingValue: 4.6, ratingCount: 28430 },
          offers: { price: 84999, priceCurrency: "INR", availability: "https://schema.org/InStock" },
        },
      ]),
    );
    expect(readJsonLdProduct(page)).toEqual({
      name: "Phone",
      sku: "MOB1",
      brand: "APPLE",
      images: ["https://i/1.jpg"],
      price: { amount: 84999, currency: "INR" },
      availability: "In stock",
      rating: { average: 4.6, count: 28430 },
    });
  });

  test("finds the Product inside @graph, skipping other types and coercing strings", () => {
    const page = parseHtmlPage(
      ldScript({
        "@graph": [
          { "@type": "BreadcrumbList" },
          {
            "@type": ["Product"],
            name: "Kettle",
            image: "https://i/k.jpg",
            brand: "Acme",
            offers: [{ price: "999", priceCurrency: "INR" }],
          },
        ],
      }),
    );
    expect(readJsonLdProduct(page)).toMatchObject({
      name: "Kettle",
      brand: "Acme",
      images: ["https://i/k.jpg"],
      price: { amount: 999, currency: "INR" },
      rating: null,
    });
  });

  test("returns null without a Product block", () => {
    expect(readJsonLdProduct(parseHtmlPage(ldScript({ "@type": "Organization" })))).toBeNull();
    expect(readJsonLdProduct(parseHtmlPage("<p></p>"))).toBeNull();
  });
});

describe("parseJsonLdNodes", () => {
  test("yields no nodes for malformed JSON", () => {
    expect(parseJsonLdNodes("{nope")).toEqual([]);
  });
});
