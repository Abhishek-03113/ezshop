import { describe, expect, test } from "bun:test";
import { nameForSelection, pruneSelection, toggleSelected } from "../src/library/selection.ts";
import { makeSummary } from "./fakes/product-fixtures.ts";

describe("toggleSelected", () => {
  test("adds, removes and never mutates its input", () => {
    const start = new Set(["a"]);
    expect([...toggleSelected(start, "b")]).toEqual(["a", "b"]);
    expect([...toggleSelected(start, "a")]).toEqual([]);
    expect([...start]).toEqual(["a"]);
  });
});

describe("pruneSelection", () => {
  test("drops ids that are no longer shown", () => {
    const shown = [makeSummary({ id: "a" })];
    expect([...pruneSelection(new Set(["a", "gone"]), shown)]).toEqual(["a"]);
  });
});

describe("nameForSelection", () => {
  test("uses the shared category", () => {
    expect(nameForSelection([makeSummary({ category: "Monitors" }), makeSummary({ category: "Monitors" })])).toBe(
      "Monitors",
    );
  });

  test("falls back to a count for mixed or missing categories", () => {
    expect(nameForSelection([makeSummary({ category: "A" }), makeSummary({ category: "B" })])).toBe(
      "Comparison of 2 products",
    );
    expect(nameForSelection([makeSummary({ category: null })])).toBe("Comparison of 1 product");
  });
});
