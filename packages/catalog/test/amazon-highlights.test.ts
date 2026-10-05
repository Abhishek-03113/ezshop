import { describe, expect, test } from "bun:test";
import { extractAmazonHighlights, splitHighlight } from "../src/extract/amazon/amazon-highlights.ts";
import { parseHtmlPage } from "../src/page/cheerio-page.ts";

describe("extractAmazonHighlights", () => {
  test("drops the add-to-cart boilerplate bullet and blanks", () => {
    const page = parseHtmlPage(`<div id="feature-bullets"><ul>
      <li>By clicking on Add to Cart/Buy Now, you authorize Amazon…</li><li> </li><li>iOS — Liquid Glass</li></ul></div>`);
    expect(extractAmazonHighlights(page)).toEqual([{ heading: "iOS", text: "Liquid Glass" }]);
  });
});

describe("splitHighlight", () => {
  test("keeps bullets without a heading separator whole", () => {
    expect(splitHighlight("Plain bullet")).toEqual({ heading: null, text: "Plain bullet" });
  });

  test("ignores a separator too far in to be a heading", () => {
    const bullet = `${"x".repeat(90)} — tail`;
    expect(splitHighlight(bullet)).toEqual({ heading: null, text: bullet });
  });

  test("ignores a separator with nothing after it", () => {
    expect(splitHighlight("HEAD — ")).toEqual({ heading: null, text: "HEAD — " });
  });
});
