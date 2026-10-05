import { describe, expect, test } from "bun:test";
import { GROUP_OPTIONS, groupLabel, parseGroupKey } from "../src/library/group-options.ts";
import { parseLibrarySearch } from "../src/library/library-search.ts";

describe("parseLibrarySearch", () => {
  test("keeps a trimmed query and a known group, plus the import URL", () => {
    expect(parseLibrarySearch({ q: " usb-c ", group: "brand", import: "https://www.amazon.in/dp/B0FQG1YHYR" })).toEqual(
      {
        import: "https://www.amazon.in/dp/B0FQG1YHYR",
        q: "usb-c",
        group: "brand",
      },
    );
  });

  test("drops blank or non-string queries and unknown groups", () => {
    for (const q of ["  ", 3, undefined]) expect(parseLibrarySearch({ q }).q).toBeUndefined();
    expect(parseLibrarySearch({ group: "color" }).group).toBeUndefined();
  });
});

describe("group options", () => {
  test("parseGroupKey accepts exactly the menu keys", () => {
    for (const option of GROUP_OPTIONS) expect(parseGroupKey(option.key)).toBe(option.key);
    expect(parseGroupKey("Category")).toBeUndefined();
  });

  test("groupLabel names the active grouping", () => {
    expect(groupLabel("price")).toBe("Price band");
  });
});
