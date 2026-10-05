import { describe, expect, test } from "bun:test";
import { formatCaptureTime } from "../src/format/format-date.ts";
import { discountPercent, formatMoney } from "../src/format/format-money.ts";

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

import { formatSourceList } from "../src/format/format-sources.ts";

describe("formatSourceList", () => {
  test("joins with commas and a final 'or'", () => {
    expect(formatSourceList(["amazon.in", "flipkart.com", "x.com"])).toBe("amazon.in, flipkart.com or x.com");
    expect(formatSourceList(["amazon.in"])).toBe("amazon.in");
    expect(formatSourceList([])).toBe("");
  });
});
