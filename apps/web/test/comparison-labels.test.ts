import { describe, expect, test } from "bun:test";
import {
  comparisonSubtitle,
  ratingLine,
  shortProductName,
  uniqueComparisonName,
} from "../src/comparison/comparison-labels.ts";
import { latestComparisonId } from "../src/comparison/latest-comparison.ts";
import { isTypingTarget } from "../src/hooks/use-slash-focus.ts";
import { makeProduct } from "./fakes/product-fixtures.ts";

describe("comparisonSubtitle", () => {
  test("lists the stores prices come from", () => {
    const products = [makeProduct("a"), makeProduct("b", { source: "flipkart.com" }), makeProduct("c")];
    expect(comparisonSubtitle(products)).toBe("3 products · prices from Amazon.in and Flipkart");
  });

  test("is just the count for an empty comparison", () => {
    expect(comparisonSubtitle([])).toBe("0 products");
  });
});

describe("shortProductName", () => {
  test("drops a leading brand and keeps titles that do not start with it", () => {
    expect(shortProductName("Dell S2722QC", "Dell")).toBe("S2722QC");
    expect(shortProductName("S2722QC by Dell", "Dell")).toBe("S2722QC by Dell");
    expect(shortProductName("Dell", "Dell")).toBe("Dell");
    expect(shortProductName("Widget", null)).toBe("Widget");
  });
});

describe("ratingLine", () => {
  test("formats average and Indian-grouped count", () => {
    expect(ratingLine({ average: 4.3, count: 214000 })).toBe("4.3 ★ · 2,14,000 ratings");
    expect(ratingLine({ average: 5, count: 1 })).toBe("5.0 ★ · 1 rating");
    expect(ratingLine(null)).toBe("No ratings");
  });
});

describe("latestComparisonId", () => {
  test("is the first (newest) comparison, or null", () => {
    const summary = (id: string) => ({ id, name: id, productIds: [], updatedAt: "u" });
    expect(latestComparisonId([summary("c2"), summary("c1")])).toBe("c2");
    expect(latestComparisonId([])).toBeNull();
  });
});

describe("isTypingTarget", () => {
  test("is true for inputs and editable content only", () => {
    expect(isTypingTarget({ tagName: "input" })).toBe(true);
    expect(isTypingTarget({ tagName: "DIV", isContentEditable: true })).toBe(true);
    expect(isTypingTarget({ tagName: "BUTTON" })).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});

describe("uniqueComparisonName", () => {
  test("keeps a free name", () => {
    expect(uniqueComparisonName("Monitors", ["Headphones"])).toBe("Monitors");
  });
  test("numbers a taken name, ignoring case and spaces, until it is free", () => {
    expect(uniqueComparisonName("Monitors", ["monitors ", "Monitors 2"])).toBe("Monitors 3");
  });
});
