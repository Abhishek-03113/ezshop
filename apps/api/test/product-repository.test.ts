import { describe, expect, test } from "bun:test";
import { summarizeProduct } from "../src/products/product-repository.ts";
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
