import type { Money } from "@ezshop/catalog";

/**
 * Formats money the way Indian shoppers read it: ₹1,24,900.
 *
 * @example formatMoney({ amount: 124900, currency: "INR" }) // "₹1,24,900"
 */
export function formatMoney(money: Money): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: money.currency,
    maximumFractionDigits: Number.isInteger(money.amount) ? 0 : 2,
  }).format(money.amount);
}

/**
 * Whole-percent discount of price against list price; null when there is no real discount.
 *
 * @example discountPercent({ amount: 90, currency: "INR" }, { amount: 100, currency: "INR" }) // 10
 */
export function discountPercent(price: Money | null, listPrice: Money | null): number | null {
  if (price === null || listPrice === null) return null;
  if (price.currency !== listPrice.currency || listPrice.amount <= price.amount) return null;
  return Math.round((1 - price.amount / listPrice.amount) * 100);
}

/**
 * How much cheaper the price is than the list price; null when there is no real, same-currency saving.
 *
 * @example savingsAmount({ amount: 90, currency: "INR" }, { amount: 100, currency: "INR" }) // { amount: 10, currency: "INR" }
 */
export function savingsAmount(price: Money | null, listPrice: Money | null): Money | null {
  if (price === null || listPrice === null) return null;
  if (price.currency !== listPrice.currency || listPrice.amount <= price.amount) return null;
  return { amount: listPrice.amount - price.amount, currency: price.currency };
}
