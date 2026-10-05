import { describe, expect, test } from "bun:test";
import { buildImportUrl, submitProductLink, validateProductLink } from "../src/lib/product-link.ts";
import { FakeNavigator } from "./fakes/fake-navigator.ts";

const AMAZON = "https://www.amazon.in/dp/B09XS7JWHH";
const WEB = "http://localhost:5173";

describe("validateProductLink", () => {
  test("accepts amazon.in, subdomains and flipkart.com", () => {
    expect(validateProductLink(AMAZON).ok).toBe(true);
    expect(validateProductLink("https://amazon.in/dp/X").ok).toBe(true);
    expect(validateProductLink("http://www.flipkart.com/p/itm1").ok).toBe(true);
  });

  test("rejects other hosts and names the host", () => {
    const check = validateProductLink("https://evil.com/amazon.in");
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.message).toContain("evil.com");
  });

  test("rejects lookalike hosts such as notamazon.in", () => {
    expect(validateProductLink("https://notamazon.in/dp/X").ok).toBe(false);
  });

  test("rejects non-urls and non-http protocols, quoting the value", () => {
    const text = validateProductLink("not a link");
    expect(text.ok === false && text.message).toContain('"not a link"');
    expect(validateProductLink("ftp://amazon.in/x").ok).toBe(false);
    expect(validateProductLink("javascript:alert(1)").ok).toBe(false);
  });
});

describe("buildImportUrl", () => {
  test("encodes the product url into the import param", () => {
    expect(buildImportUrl(WEB, AMAZON)).toBe(`${WEB}/?import=${encodeURIComponent(AMAZON)}`);
  });
});

describe("submitProductLink", () => {
  test("navigates to the import url on success and returns no error", () => {
    const navigator = new FakeNavigator();
    expect(submitProductLink(AMAZON, WEB, navigator)).toBeNull();
    expect(navigator.visited).toEqual([buildImportUrl(WEB, AMAZON)]);
  });

  test("returns the message and does not navigate on failure", () => {
    const navigator = new FakeNavigator();
    expect(submitProductLink("https://example.com/x", WEB, navigator)).toContain("example.com");
    expect(navigator.visited).toEqual([]);
  });
});
