import { describe, expect, test } from "bun:test";
import {
  INITIAL_MODEL,
  effectiveView,
  neighbourComparisonId,
  thisPageColumn,
  viewForCommand,
} from "../../src/quicklook/quicklook-model.ts";
import { buildCatalogProduct, buildSnapshot } from "../support/build-snapshot.ts";
import { stateWith } from "../support/quicklook-state.ts";

describe("thisPageColumn", () => {
  test("is the page snapshot when it is not saved yet", () => {
    const model = { ...INITIAL_MODEL, pageSnapshot: buildSnapshot(), state: stateWith("c1", []) };
    expect(thisPageColumn(model)?.externalId).toBe("B0FQG1YHYR");
  });
  test("is null when the same product is already in the comparison", () => {
    const saved = buildCatalogProduct("p1", { externalId: "B0FQG1YHYR" });
    const model = { ...INITIAL_MODEL, pageSnapshot: buildSnapshot(), state: stateWith("c1", [saved]) };
    expect(thisPageColumn(model)).toBeNull();
  });
  test("is null on a non-product page", () => {
    expect(thisPageColumn(INITIAL_MODEL)).toBeNull();
  });
});

describe("neighbourComparisonId", () => {
  const state = stateWith("c2", [], ["c1", "c2", "c3"]);
  test("steps right and left with wrap-around", () => {
    expect(neighbourComparisonId(state, 1)).toBe("c3");
    expect(neighbourComparisonId(stateWith("c3", [], ["c1", "c2", "c3"]), 1)).toBe("c1");
    expect(neighbourComparisonId(stateWith("c1", [], ["c1", "c2", "c3"]), -1)).toBe("c3");
  });
  test("is null with a single comparison or none selected", () => {
    expect(neighbourComparisonId(stateWith("c1", []), 1)).toBeNull();
    expect(neighbourComparisonId({ ...state, selectedId: null }, 1)).toBeNull();
  });
});

describe("viewForCommand", () => {
  test("maps open-comparison to the compare view", () => {
    expect(viewForCommand("open-comparison")).toBe("compare");
  });
  test("ignores _execute_action (a click event) and unknown commands", () => {
    expect(viewForCommand("_execute_action")).toBeNull();
    expect(viewForCommand("nope")).toBeNull();
  });
});

describe("effectiveView", () => {
  test("keeps the requested view on a product page", () => {
    const page = buildSnapshot();
    expect(effectiveView({ ...INITIAL_MODEL, pageSnapshot: page })).toBe("specs");
    expect(effectiveView({ ...INITIAL_MODEL, pageSnapshot: page, view: "compare" })).toBe("compare");
  });
  test("falls back to compare without a page snapshot", () => {
    expect(effectiveView(INITIAL_MODEL)).toBe("compare");
  });
});
