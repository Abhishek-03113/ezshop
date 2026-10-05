import { describe, expect, test } from "bun:test";
import { buildComparisonMatrix } from "../src/compare/build-matrix.ts";
import { flipkartSearchUrl } from "../src/compare/flipkart-search-url.ts";
import { buildPriceCells, buildRatingCells } from "../src/compare/top-cells.ts";
import { snapshotWith } from "./compare-support.ts";

const LG = snapshotWith(
  "LG 27UP850N",
  [
    ["Display", "Max Brightness", "400 nits"],
    ["Display", "Panel", "IPS"],
    ["Connectivity", "USB-C power", "96 W"],
  ],
  { price: { amount: 29999, currency: "INR" }, rating: { average: 4.3, count: 2140 } },
);
const DELL = snapshotWith(
  "Dell S2722QC",
  [
    ["Specs", "Brightness (nits)", "350 nits"],
    ["Specs", "Panel", "ips"],
    ["Specs", "Response Time", "4 ms"],
  ],
  { price: { amount: 27490, currency: "INR" } },
);

describe("buildComparisonMatrix", () => {
  const matrix = buildComparisonMatrix([LG, DELL], { differencesOnly: false });

  test("aligns synonyms into one row placed under its first group", () => {
    const display = matrix.groups.find((group) => group.title === "Display");
    const brightness = display?.rows.find((row) => row.key === "brightness");
    expect(brightness?.label).toBe("Max Brightness");
    expect(brightness?.cells.map((cell) => cell.text)).toEqual(["400 nits", "350 nits"]);
    expect(brightness?.cells.map((cell) => cell.isBest)).toEqual([true, false]);
  });

  test("rows seen only in a later product go under that product's group", () => {
    const specs = matrix.groups.find((group) => group.title === "Specs");
    expect(specs?.rows.map((row) => row.key)).toEqual(["response time"]);
    expect(specs?.rows[0]?.cells.map((cell) => cell.text)).toEqual([null, "4 ms"]);
  });

  test("missing values make a row differ; cosmetic differences do not", () => {
    const rows = matrix.groups.flatMap((group) => group.rows);
    expect(rows.find((row) => row.key === "panel")?.differs).toBe(false);
    expect(rows.find((row) => row.key === "usb c power")?.differs).toBe(true);
  });

  test("lowest price is best and prices are formatted", () => {
    expect(matrix.prices).toEqual([
      { text: "₹29,999", isBest: false },
      { text: "₹27,490", isBest: true },
    ]);
  });

  test("differencesOnly hides identical rows and counts them", () => {
    const diff = buildComparisonMatrix([LG, DELL], { differencesOnly: true });
    expect(diff.identicalCount).toBe(1);
    expect(diff.groups.flatMap((group) => group.rows.map((row) => row.key))).not.toContain("panel");
    expect(diff.groups.find((group) => group.title === "Display")?.identicalCount).toBe(1);
  });

  test("differencesOnly keeps every row for a single product", () => {
    const single = buildComparisonMatrix([LG], { differencesOnly: true });
    expect(single.groups.flatMap((group) => group.rows)).toHaveLength(3);
    expect(single.identicalCount).toBe(0);
  });

  test("query filters by label or value, case-insensitively", () => {
    const byLabel = buildComparisonMatrix([LG, DELL], { differencesOnly: false, query: "RESPONSE" });
    expect(byLabel.groups.flatMap((group) => group.rows.map((row) => row.key))).toEqual(["response time"]);
    const byValue = buildComparisonMatrix([LG, DELL], { differencesOnly: false, query: "96 w" });
    expect(byValue.groups.flatMap((group) => group.rows.map((row) => row.key))).toEqual(["usb c power"]);
  });

  test("no snapshots gives an empty matrix", () => {
    expect(buildComparisonMatrix([], { differencesOnly: false })).toEqual({
      prices: [],
      ratings: [],
      groups: [],
      identicalCount: 0,
    });
  });

  test("ties for best are all marked", () => {
    const tied = snapshotWith("Tie", [["Display", "Refresh rate", "400 Hz"]]);
    const slow = snapshotWith("Slow", [["Display", "Refresh rate", "60 Hz"]]);
    const row = buildComparisonMatrix([tied, slow, tied], { differencesOnly: false }).groups[0]?.rows[0];
    expect(row?.cells.map((cell) => cell.isBest)).toEqual([true, false, true]);
  });
});

describe("price and rating cells", () => {
  test("a single price is not flagged", () => {
    expect(buildPriceCells([LG])).toEqual([{ text: "₹29,999", isBest: false }]);
  });
  test("non-INR currency keeps its code", () => {
    const usd = snapshotWith("X", [], { price: { amount: 1200, currency: "USD" } });
    expect(buildPriceCells([usd])[0]?.text).toBe("USD 1,200");
  });
  test("ratings show average and count, never best", () => {
    expect(buildRatingCells([LG, DELL])).toEqual([
      { text: "4.3 ★ · 2,140", isBest: false },
      { text: null, isBest: false },
    ]);
  });
});

describe("flipkartSearchUrl", () => {
  test("uses brand plus leading title words, encoded", () => {
    const monitor = snapshotWith("ProArt PA279CV 27-inch 4K UHD Professional Monitor (Black)", [], { brand: "ASUS" });
    expect(flipkartSearchUrl(monitor)).toBe(
      "https://www.flipkart.com/search?q=ASUS%20ProArt%20PA279CV%2027-inch%204K%20UHD",
    );
  });
  test("does not repeat a brand the title already starts with", () => {
    const phone = snapshotWith("Apple iPhone 17, 256 GB", [], { brand: "Apple" });
    expect(flipkartSearchUrl(phone)).toBe("https://www.flipkart.com/search?q=Apple%20iPhone%2017");
  });
});
