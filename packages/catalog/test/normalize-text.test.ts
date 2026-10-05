import { describe, expect, test } from "bun:test";
import { normalizeText, textOrNull } from "../src/text/normalize-text.ts";

describe("normalizeText", () => {
  test("collapses whitespace and strips direction marks", () => {
    expect(normalizeText("  Brand \u200f:\u200e\n  Apple ")).toBe("Brand : Apple");
  });
});

describe("textOrNull", () => {
  test("returns null for blank or missing text", () => {
    expect(textOrNull("  \u200e ")).toBeNull();
    expect(textOrNull(undefined)).toBeNull();
  });

  test("returns normalised text otherwise", () => {
    expect(textOrNull(" iOS ")).toBe("iOS");
  });
});
