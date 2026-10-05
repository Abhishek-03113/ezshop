import { describe, expect, test } from "bun:test";
import { mergeSpecGroupsByTitle, readSpecGroups, readSpecRows } from "../src/extract/shared/spec-sections.ts";
import { parseHtmlPage } from "../src/page/cheerio-page.ts";

const ROWS = { row: "tr", label: "th", value: "td" };

describe("readSpecRows", () => {
  test("reads label/value rows, trimming a trailing colon and skipping half-empty rows", () => {
    const page = parseHtmlPage("<table><tr><th>Brand :</th><td>Sony</td></tr><tr><th>Blank</th><td></td></tr></table>");
    expect(readSpecRows(page, ROWS)).toEqual([{ label: "Brand", value: "Sony" }]);
  });
});

describe("readSpecGroups", () => {
  test("reads fixed groups and titled sections in source order", () => {
    const page = parseHtmlPage(`
      <table id="fixed"><tr><th>A</th><td>1</td></tr></table>
      <section><h4>Audio</h4><table><tr><th>B</th><td>2</td></tr></table></section>`);
    expect(
      readSpecGroups(page, [
        { kind: "fixed", title: "Overview", ...ROWS, row: "#fixed tr" },
        { kind: "titled", section: "section", sectionTitle: "h4", ...ROWS },
      ]),
    ).toEqual([
      { title: "Overview", specs: [{ label: "A", value: "1" }] },
      { title: "Audio", specs: [{ label: "B", value: "2" }] },
    ]);
  });
});

describe("mergeSpecGroupsByTitle", () => {
  test("folds same-titled groups, drops repeated labels, empty and untitled groups", () => {
    const a = { label: "A", value: "1" };
    const b = { label: "B", value: "2" };
    expect(
      mergeSpecGroupsByTitle([
        { title: "X", specs: [a] },
        { title: "X", specs: [{ ...a, value: "dup" }, b] },
        { title: "", specs: [a] },
        { title: "Empty", specs: [] },
      ]),
    ).toEqual([{ title: "X", specs: [a, b] }]);
  });
});
