import type { Money, ProductSnapshot } from "../product-snapshot.ts";
import { winningPositions } from "./mark-best.ts";
import type { ComparisonCell } from "./types.ts";

function formatMoney(money: Money): string {
  const symbol = money.currency === "INR" ? "₹" : `${money.currency} `;
  return `${symbol}${money.amount.toLocaleString("en-IN")}`;
}

/**
 * Price row: formatted amounts, the lowest flagged (ties all flagged, needs two prices).
 *
 * @example buildPriceCells(snapshots) // [{ text: "₹27,490", isBest: true }, { text: null, isBest: false }]
 */
export function buildPriceCells(snapshots: readonly ProductSnapshot[]): ComparisonCell[] {
  const winners = winningPositions(
    snapshots.map((snapshot) => snapshot.price?.amount ?? null),
    "lower",
  );
  return snapshots.map((snapshot, index) => ({
    text: snapshot.price === null ? null : formatMoney(snapshot.price),
    isBest: winners[index] ?? false,
  }));
}

/**
 * Rating row ("4.3 ★ · 2,140"). Never flagged: a 5.0 from three reviews is not "best".
 *
 * @example buildRatingCells(snapshots)[0] // { text: "4.3 ★ · 2,140", isBest: false }
 */
export function buildRatingCells(snapshots: readonly ProductSnapshot[]): ComparisonCell[] {
  return snapshots.map(({ rating }) => ({
    text: rating === null ? null : `${rating.average.toFixed(1)} ★ · ${rating.count.toLocaleString("en-IN")}`,
    isBest: false,
  }));
}
