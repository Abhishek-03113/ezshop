import { describe, expect, test } from "bun:test";
import { discountPercent, formatMoney, savingsAmount } from "../src/present/money-format.ts";

const inr = (amount: number) => ({ amount, currency: "INR" });

describe("formatMoney", () => {
  test("uses Indian grouping and drops .00 for whole amounts", () => {
    expect(formatMoney(inr(124900))).toBe("₹1,24,900");
    expect(formatMoney(inr(99.5))).toBe("₹99.50");
  });
});

describe("discountPercent", () => {
  test("rounds the discount against the list price", () => {
    expect(discountPercent(inr(124900), inr(133399))).toBe(6);
  });

  test("is null without a real, same-currency discount", () => {
    expect(discountPercent(inr(100), null)).toBeNull();
    expect(discountPercent(inr(100), inr(100))).toBeNull();
    expect(discountPercent(inr(90), { amount: 100, currency: "USD" })).toBeNull();
  });
});

describe("savingsAmount", () => {
  test("is the list price minus the price, or null without a real saving", () => {
    expect(savingsAmount(inr(28926), inr(34990))).toEqual(inr(6064));
    expect(savingsAmount(inr(100), inr(100))).toBeNull();
    expect(savingsAmount(null, inr(100))).toBeNull();
    expect(savingsAmount(inr(90), { amount: 100, currency: "USD" })).toBeNull();
  });
});
