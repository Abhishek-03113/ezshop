import { describe, expect, test } from "bun:test";
import { formatSourceList } from "../src/format/format-sources.ts";
import { formatCapturedLabel } from "../src/format/format-relative-date.ts";
import { storeFilterOptions } from "../src/format/source-label.ts";

describe("formatSourceList", () => {
  test("joins with commas and a final 'or'", () => {
    expect(formatSourceList(["amazon.in", "flipkart.com", "x.com"])).toBe("amazon.in, flipkart.com or x.com");
    expect(formatSourceList(["amazon.in"])).toBe("amazon.in");
    expect(formatSourceList([])).toBe("");
  });
});

describe("formatCapturedLabel", () => {
  const now = new Date("2026-10-05T12:00:00Z");

  test("says today and yesterday by calendar day", () => {
    expect(formatCapturedLabel("2026-10-05T01:00:00Z", now, "UTC")).toBe("Captured today");
    expect(formatCapturedLabel("2026-10-04T23:59:00Z", now, "UTC")).toBe("Captured yesterday");
  });

  test("uses the day and month for older captures, adding the year across years", () => {
    expect(formatCapturedLabel("2026-10-03T08:00:00Z", now, "UTC")).toBe("Captured 3 Oct");
    expect(formatCapturedLabel("2025-12-31T08:00:00Z", now, "UTC")).toBe("Captured 31 Dec 2025");
  });

  test("respects the time zone when deciding which day it was", () => {
    expect(formatCapturedLabel("2026-10-04T20:00:00Z", now, "Asia/Kolkata")).toBe("Captured today");
  });
});

describe("source labels", () => {
  test("map sources to display names and build the store filter from PRODUCT_SOURCES", () => {
    expect(storeFilterOptions()).toEqual([
      { value: "all", label: "All" },
      { value: "amazon.in", label: "Amazon.in" },
      { value: "flipkart.com", label: "Flipkart" },
    ]);
  });
});
