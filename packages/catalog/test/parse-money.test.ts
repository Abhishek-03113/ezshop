import { describe, expect, test } from "bun:test";
import { parseMoney } from "../src/money/parse-money.ts";

describe("parseMoney", () => {
  test("parses Indian digit grouping", () => {
    expect(parseMoney("₹1,24,900.00")).toEqual({ amount: 124900, currency: "INR" });
  });

  test("uses the fallback currency when no symbol is shown", () => {
    expect(parseMoney("1,24,900", "INR")).toEqual({ amount: 124900, currency: "INR" });
  });

  test("returns null without an amount or a currency", () => {
    expect(parseMoney("₹")).toBeNull();
    expect(parseMoney("1,999")).toBeNull();
  });
});
