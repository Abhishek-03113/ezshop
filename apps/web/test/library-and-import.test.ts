import { describe, expect, test } from "bun:test";
import { DEFAULT_EXTENSION_URL, readAppConfig } from "../src/config/app-config.ts";
import { parseImportSearch } from "../src/import/import-search.ts";
import { RunOnce } from "../src/import/run-once.ts";
import { filterProductsByStore } from "../src/library/filter-products.ts";
import { makeSummary } from "./fakes/product-fixtures.ts";

describe("filterProductsByStore", () => {
  const products = [makeSummary({ id: "a" }), makeSummary({ id: "f", source: "flipkart.com" })];

  test("keeps everything for 'all'", () => {
    expect(filterProductsByStore(products, "all")).toHaveLength(2);
  });

  test("keeps only the chosen store, possibly none", () => {
    expect(filterProductsByStore(products, "flipkart.com").map((product) => product.id)).toEqual(["f"]);
    expect(filterProductsByStore([products[0]!], "flipkart.com")).toEqual([]);
  });
});

describe("parseImportSearch", () => {
  test("keeps an http(s) product URL, trimmed", () => {
    expect(parseImportSearch({ import: " https://www.amazon.in/dp/B0FQG1YHYR " })).toEqual({
      import: "https://www.amazon.in/dp/B0FQG1YHYR",
    });
  });

  test("drops missing, non-string, non-URL and non-http values", () => {
    for (const value of [undefined, 42, "not a url", "javascript:alert(1)", "ftp://x/y"]) {
      expect(parseImportSearch({ import: value }).import).toBeUndefined();
    }
  });
});

describe("RunOnce", () => {
  test("runs the action only the first time", () => {
    const calls: string[] = [];
    const once = new RunOnce();
    once.run(() => calls.push("first"));
    once.run(() => calls.push("second"));
    expect(calls).toEqual(["first"]);
  });
});

describe("readAppConfig", () => {
  test("uses VITE_EZSHOP_EXTENSION_URL when set", () => {
    expect(readAppConfig({ VITE_EZSHOP_EXTENSION_URL: " https://store/x " }).extensionUrl).toBe("https://store/x");
  });

  test("falls back when missing, blank or not a string", () => {
    for (const env of [{}, { VITE_EZSHOP_EXTENSION_URL: "  " }, { VITE_EZSHOP_EXTENSION_URL: 3 }]) {
      expect(readAppConfig(env).extensionUrl).toBe(DEFAULT_EXTENSION_URL);
    }
  });
});
