import { describe, expect, test } from "bun:test";
import { countSpecs, filterSpecGroups, specCountLabel, specGroupAnchor } from "../src/specs/filter-spec-groups.ts";

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

  test("matches the group title and keeps every spec of that group", () => {
    expect(filterSpecGroups(groups, "technical")).toEqual([groups[1]!]);
    expect(filterSpecGroups(groups, "glance")).toEqual([groups[0]!]);
  });

  test("returns nothing when no spec matches", () => {
    expect(filterSpecGroups(groups, "zzz")).toEqual([]);
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

describe("specCountLabel", () => {
  test("describes the full sheet without a query", () => {
    expect(specCountLabel(groups, groups, "")).toBe("3 specs in 2 groups");
    expect(specCountLabel([groups[1]!], [groups[1]!], " ")).toBe("1 spec in 1 group");
  });

  test("counts matching specs with a query", () => {
    expect(specCountLabel(groups, [groups[1]!], "battery")).toBe("1 matching spec");
    expect(specCountLabel(groups, groups, "a")).toBe("3 matching specs");
  });
});

describe("specGroupAnchor", () => {
  test("slugifies the title into a stable id", () => {
    expect(specGroupAnchor("Item details")).toBe("group-item-details");
    expect(specGroupAnchor("Power & Battery!")).toBe("group-power-battery");
  });
});
