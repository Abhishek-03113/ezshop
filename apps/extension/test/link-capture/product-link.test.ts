import { describe, expect, test } from "bun:test";
import {
  looksLikeProductLink,
  productLinkFromClick,
  titleFromProductUrl,
} from "../../src/link-capture/product-link.ts";
import { createTestDom } from "../popup/support.ts";

describe("titleFromProductUrl", () => {
  test("uses the slug", () => {
    expect(titleFromProductUrl("https://www.amazon.in/ASUS-ProArt-PA279CV/dp/B0FQG1YHYR")).toBe("ASUS ProArt PA279CV");
    expect(titleFromProductUrl("https://www.flipkart.com/apple-iphone-17/p/itm68ad?pid=MOBH1")).toBe("apple iphone 17");
  });
  test("falls back when there is no slug", () => {
    expect(titleFromProductUrl("https://www.amazon.in/dp/B0FQG1YHYR")).toBe("product");
    expect(titleFromProductUrl("not a url")).toBe("product");
  });
});

describe("looksLikeProductLink", () => {
  test("recognises Amazon.in and Flipkart product paths only", () => {
    expect(looksLikeProductLink("https://www.amazon.in/x/dp/B0FQG1YHYR")).toBe(true);
    expect(looksLikeProductLink("https://www.amazon.in/gp/product/B0FQG1YHYR")).toBe(true);
    expect(looksLikeProductLink("https://www.flipkart.com/x/p/itm1")).toBe(true);
    expect(looksLikeProductLink("https://www.amazon.in/s?k=monitor")).toBe(false);
    expect(looksLikeProductLink("https://evil.test/dp/B0FQG1YHYR")).toBe(false);
  });
});

describe("productLinkFromClick", () => {
  function linkIn(html: string): HTMLElement {
    const { root } = createTestDom();
    root.innerHTML = html;
    return root;
  }
  test("finds the enclosing anchor from a nested click target and uses its text", () => {
    const root = linkIn('<a href="https://www.amazon.in/x/dp/B0FQG1YHYR"><span> LG  27GR83Q </span></a>');
    const link = productLinkFromClick(root.querySelector("span"), looksLikeProductLink);
    expect(link).toEqual({ url: "https://www.amazon.in/x/dp/B0FQG1YHYR", label: "LG 27GR83Q" });
  });
  test("falls back to the URL slug for image-only links", () => {
    const root = linkIn('<a href="https://www.amazon.in/LG-Monitor/dp/B0FQG1YHYR"><img alt=""></a>');
    expect(productLinkFromClick(root.querySelector("img"), looksLikeProductLink)?.label).toBe("LG Monitor");
  });
  test("ignores non-product links, non-links and null", () => {
    const root = linkIn('<a href="https://www.amazon.in/s?k=x"><b>x</b></a><p>text</p>');
    expect(productLinkFromClick(root.querySelector("b"), looksLikeProductLink)).toBeNull();
    expect(productLinkFromClick(root.querySelector("p"), looksLikeProductLink)).toBeNull();
    expect(productLinkFromClick(null, looksLikeProductLink)).toBeNull();
  });
});
