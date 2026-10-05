import { describe, expect, test } from "bun:test";
import { canonicalAmazonUrl, parseAmazonProductUrl } from "../src/extract/amazon/amazon-url.ts";

describe("parseAmazonProductUrl", () => {
  test("reads the ASIN from /dp/ and /gp/product/ paths", () => {
    expect(parseAmazonProductUrl("https://www.amazon.in/Apple-iPhone-17/dp/B0FQG1YHYR/ref=sr_1_10?x=1")).toEqual({
      asin: "B0FQG1YHYR",
    });
    expect(parseAmazonProductUrl("https://amazon.in/gp/product/B0FQG1YHYR")).toEqual({ asin: "B0FQG1YHYR" });
  });

  test("rejects other hosts, non-product paths and junk", () => {
    expect(parseAmazonProductUrl("https://www.amazon.com/dp/B0FQG1YHYR")).toBeNull();
    expect(parseAmazonProductUrl("https://www.amazon.in/s?k=iphone+17")).toBeNull();
    expect(parseAmazonProductUrl("not a url")).toBeNull();
  });
});

describe("canonicalAmazonUrl", () => {
  test("drops slug and tracking", () => {
    expect(canonicalAmazonUrl("B0FQG1YHYR")).toBe("https://www.amazon.in/dp/B0FQG1YHYR");
  });
});
