import { describe, expect, test } from "bun:test";
import { countSpecs, filterSpecGroups } from "../src/specs/filter-spec-groups.ts";

const groups = [
  {
    title: "At a glance",
    specs: [
      { label: "Brand", value: "Apple" },
      { label: "Storage", value: "512 GB" },
    ],
  },
  { title: "Technical details", specs: [{ label: "Power and Battery", value: "Up to 30 hours" }] },
];

describe("filterSpecGroups", () => {
  test("matches labels and values case-insensitively and drops empty groups", () => {
    expect(filterSpecGroups(groups, "BATTERY")).toEqual([groups[1]!]);
    expect(filterSpecGroups(groups, "apple")).toEqual([
      { title: "At a glance", specs: [{ label: "Brand", value: "Apple" }] },
    ]);
  });

  test("returns every group for a blank query", () => {
    expect(filterSpecGroups(groups, "  ")).toEqual(groups);
  });
});

describe("countSpecs", () => {
  test("sums rows across groups", () => {
    expect(countSpecs(groups)).toBe(3);
  });
});
