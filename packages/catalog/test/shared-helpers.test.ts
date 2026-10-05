import { describe, expect, test } from "bun:test";
import { parseUrlOnHosts } from "../src/extract/shared/parse-site-url.ts";
import { schemaOrgAvailabilityLabel } from "../src/extract/shared/schema-org-availability.ts";
import { findSpecValue } from "../src/extract/shared/spec-lookup.ts";

describe("parseUrlOnHosts", () => {
  test("accepts listed hosts only", () => {
    const hosts = new Set(["www.flipkart.com"]);
    expect(parseUrlOnHosts("https://www.flipkart.com/a", hosts)?.pathname).toBe("/a");
    expect(parseUrlOnHosts("https://evil.com/a", hosts)).toBeNull();
    expect(parseUrlOnHosts("::", hosts)).toBeNull();
  });
});

describe("findSpecValue", () => {
  test("matches labels case-insensitively across groups", () => {
    const groups = [
      { title: "A", specs: [{ label: "Colour", value: "White" }] },
      { title: "B", specs: [{ label: "Brand", value: "Apple" }] },
    ];
    expect(findSpecValue(groups, "brand")).toBe("Apple");
    expect(findSpecValue(groups, "Weight")).toBeNull();
  });
});

describe("schemaOrgAvailabilityLabel", () => {
  test("humanises schema.org availability terms", () => {
    expect(schemaOrgAvailabilityLabel("https://schema.org/OutOfStock")).toBe("Out of stock");
    expect(schemaOrgAvailabilityLabel("http://schema.org/InStock")).toBe("In stock");
    expect(schemaOrgAvailabilityLabel("https://schema.org/")).toBeNull();
  });
});
