import { describe, expect, test } from "bun:test";
import { ratingCountLabel } from "../src/present/rating-label.ts";

describe("ratingCountLabel", () => {
  test("groups digits the Indian way and is singular-aware", () => {
    expect(ratingCountLabel(17240)).toBe("17,240 ratings");
    expect(ratingCountLabel(1724000)).toBe("17,24,000 ratings");
    expect(ratingCountLabel(1)).toBe("1 rating");
    expect(ratingCountLabel(0)).toBe("0 ratings");
  });
});
