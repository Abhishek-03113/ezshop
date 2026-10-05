import { describe, expect, test } from "bun:test";
import { productMatchesQuery, searchableText, summarizeProduct } from "../src/products/product-repository.ts";
import { buildSampleSnapshot } from "./support/sample-snapshot.ts";

describe("summarizeProduct", () => {
  test("keeps list fields and the first image", () => {
    const snapshot = buildSampleSnapshot();
    const summary = summarizeProduct({ id: "p1", snapshot, createdAt: "c", updatedAt: "u" });
    expect(summary).toEqual({
      id: "p1",
      source: "amazon.in",
      title: snapshot.title,
      brand: "Apple",
      category: null,
      price: snapshot.price,
      imageUrl: snapshot.images[0] ?? null,
      updatedAt: "u",
    });
  });

  test("has a null image when the snapshot has none", () => {
    const snapshot = buildSampleSnapshot({ images: [] });
    expect(summarizeProduct({ id: "p1", snapshot, createdAt: "c", updatedAt: "u" }).imageUrl).toBeNull();
  });
});

describe("search", () => {
  const snapshot = buildSampleSnapshot({
    category: "Smartphones",
    specGroups: [{ title: "Display", specs: [{ label: "Panel", value: "OLED" }] }],
  });

  test("searchableText joins title, brand, category and spec labels and values", () => {
    expect(searchableText(snapshot)).toBe("Apple iPhone 17 512 GB Apple Smartphones Panel OLED");
  });

  test("matches title, brand, category and spec values case-insensitively", () => {
    for (const query of ["iphone", "APPLE", "smartphones", "  oled ", "panel"]) {
      expect(productMatchesQuery(snapshot, query)).toBe(true);
    }
  });

  test("a blank query matches everything and an absent word matches nothing", () => {
    expect(productMatchesQuery(snapshot, "   ")).toBe(true);
    expect(productMatchesQuery(snapshot, "https")).toBe(false);
  });
});
