import { describe, expect, test } from "bun:test";
import { isExtensionRequest } from "../src/messaging/messages.ts";
import { comparisonNameFor } from "../src/snapshot-category.ts";

describe("isExtensionRequest", () => {
  test("accepts our message types", () => {
    expect(isExtensionRequest({ type: "link:add", url: "u", label: "l" })).toBe(true);
    expect(isExtensionRequest({ type: "toast:quicklook" })).toBe(true);
  });
  test("rejects everything else", () => {
    expect(isExtensionRequest(null)).toBe(false);
    expect(isExtensionRequest("quicklook:init")).toBe(false);
    expect(isExtensionRequest({ type: "other" })).toBe(false);
    expect(isExtensionRequest({})).toBe(false);
  });
});

describe("comparisonNameFor", () => {
  test("uses the trimmed category", () => {
    expect(comparisonNameFor({ category: " Monitors " })).toBe("Monitors");
  });
  test("falls back for null or blank categories", () => {
    expect(comparisonNameFor({ category: null })).toBe("My comparison");
    expect(comparisonNameFor({ category: "  " }, "New comparison")).toBe("New comparison");
  });
});
