import { describe, expect, test } from "bun:test";
import { availabilityTone } from "../src/format/availability-tone.ts";
import { pluralize } from "../src/format/format-count.ts";
import { formatSourceList } from "../src/format/format-sources.ts";
import { formatCapturedLabel } from "../src/format/format-relative-date.ts";
import { sourceLabel, storeFilterOptions } from "../src/format/source-label.ts";
import { formatCaptureTime } from "../src/format/format-date.ts";
import { discountPercent, formatMoney, savingsAmount } from "../src/format/format-money.ts";

const inr = (amount: number) => ({ amount, currency: "INR" });

describe("formatMoney", () => {
  test("uses Indian grouping and drops .00 for whole amounts", () => {
    expect(formatMoney(inr(124900))).toBe("₹1,24,900");
    expect(formatMoney(inr(99.5))).toBe("₹99.50");
  });
});

describe("discountPercent", () => {
  test("rounds the discount against the list price", () => {
    expect(discountPercent(inr(124900), inr(133399))).toBe(6);
  });

  test("is null without a real, same-currency discount", () => {
    expect(discountPercent(inr(100), null)).toBeNull();
    expect(discountPercent(inr(100), inr(100))).toBeNull();
    expect(discountPercent(inr(90), { amount: 100, currency: "USD" })).toBeNull();
  });
});

describe("formatCaptureTime", () => {
  test("formats in the given time zone", () => {
    expect(formatCaptureTime("2026-10-05T05:59:30Z", "Asia/Kolkata")).toBe("5 Oct 2026, 11:29");
  });
});

describe("formatSourceList", () => {
  test("joins with commas and a final 'or'", () => {
    expect(formatSourceList(["amazon.in", "flipkart.com", "x.com"])).toBe("amazon.in, flipkart.com or x.com");
    expect(formatSourceList(["amazon.in"])).toBe("amazon.in");
    expect(formatSourceList([])).toBe("");
  });
});

describe("savingsAmount", () => {
  test("is the list price minus the price, or null without a real saving", () => {
    expect(savingsAmount(inr(28926), inr(34990))).toEqual(inr(6064));
    expect(savingsAmount(inr(100), inr(100))).toBeNull();
    expect(savingsAmount(null, inr(100))).toBeNull();
    expect(savingsAmount(inr(90), { amount: 100, currency: "USD" })).toBeNull();
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
    expect(sourceLabel("amazon.in")).toBe("Amazon.in");
    expect(storeFilterOptions()).toEqual([
      { value: "all", label: "All" },
      { value: "amazon.in", label: "Amazon.in" },
      { value: "flipkart.com", label: "Flipkart" },
    ]);
  });
});

describe("pluralize", () => {
  test("adds an s except for exactly one", () => {
    expect([pluralize(0, "spec"), pluralize(1, "spec"), pluralize(2, "spec")]).toEqual([
      "0 specs",
      "1 spec",
      "2 specs",
    ]);
  });
});

describe("availabilityTone", () => {
  test("reads stock state from the store's wording", () => {
    expect(availabilityTone("In stock")).toBe("in-stock");
    expect(availabilityTone("Currently unavailable.")).toBe("out-of-stock");
    expect(availabilityTone("Ships in 2 weeks")).toBe("unknown");
  });
});
