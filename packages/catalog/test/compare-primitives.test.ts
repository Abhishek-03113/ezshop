import { describe, expect, test } from "bun:test";
import { bestDirectionFor } from "../src/compare/best-direction.ts";
import { normalizeLabelKey, normalizeValue } from "../src/compare/label-key.ts";
import { markBestSpecs, winningPositions } from "../src/compare/mark-best.ts";
import { parseLeadingNumber } from "../src/compare/numeric-value.ts";

describe("normalizeLabelKey", () => {
  test("lowercases, drops brackets and punctuation, collapses spaces", () => {
    expect(normalizeLabelKey("  Screen   Size (inches): ")).toBe("screen size");
  });
  test("maps synonyms", () => {
    expect(normalizeLabelKey("Max Brightness (nits)")).toBe("brightness");
    expect(normalizeLabelKey("Item Weight")).toBe("weight");
  });
});

describe("normalizeValue", () => {
  test("ignores case, grouping commas, unit spacing and trailing punctuation", () => {
    expect(normalizeValue("1,000 Nits.")).toBe(normalizeValue("1000nits"));
  });
  test("keeps different values different", () => {
    expect(normalizeValue("350 nits")).not.toBe(normalizeValue("400 nits"));
  });
});

describe("parseLeadingNumber", () => {
  test("reads amount and singular lowercase unit", () => {
    expect(parseLeadingNumber("1,000 Nits typical")).toEqual({ amount: 1000, unit: "nit" });
    expect(parseLeadingNumber("2 Years")).toEqual({ amount: 2, unit: "year" });
    expect(parseLeadingNumber("144Hz")).toEqual({ amount: 144, unit: "hz" });
  });
  test("returns null for non-numeric text", () => {
    expect(parseLeadingNumber("DisplayHDR 400")).toBeNull();
    expect(parseLeadingNumber("—")).toBeNull();
  });
});

describe("bestDirectionFor", () => {
  test("knows higher, lower and neutral labels", () => {
    expect(bestDirectionFor("refresh rate")).toBe("higher");
    expect(bestDirectionFor("response time")).toBe("lower");
    expect(bestDirectionFor("screen size")).toBeNull();
  });
  test("matches whole words only", () => {
    expect(bestDirectionFor("program frame")).toBeNull();
    expect(bestDirectionFor("ram")).toBe("higher");
  });
});

describe("winningPositions", () => {
  test("flags all ties", () => {
    expect(winningPositions([3, 1, 3], "higher")).toEqual([true, false, true]);
  });
  test("flags nothing for one value or all-equal values", () => {
    expect(winningPositions([3, null], "higher")).toEqual([false, false]);
    expect(winningPositions([2, 2], "lower")).toEqual([false, false]);
  });
  test("lower direction picks the minimum", () => {
    expect(winningPositions([5, 1, null], "lower")).toEqual([false, true, false]);
  });
});

describe("markBestSpecs", () => {
  test("marks the highest brightness", () => {
    expect(markBestSpecs("brightness", ["400 nits", "350 nits", null])).toEqual([true, false, false]);
  });
  test("ignores values with a different unit", () => {
    expect(markBestSpecs("weight", ["5 kg", "4 kg", "900 g"])).toEqual([false, true, false]);
  });
  test("marks nothing when only one value is comparable", () => {
    expect(markBestSpecs("brightness", ["400 nits", "bright", null])).toEqual([false, false, false]);
  });
  test("marks nothing for undirected labels", () => {
    expect(markBestSpecs("screen size", ["27 inches", "32 inches"])).toEqual([false, false]);
  });
});
