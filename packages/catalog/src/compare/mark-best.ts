import { bestDirectionFor, type BestDirection } from "./best-direction.ts";
import { parseLeadingNumber, type NumericValue } from "./numeric-value.ts";

/** The unit shared by the most values; ties go to the unit seen first. */
function dominantUnit(values: readonly (NumericValue | null)[]): string | null {
  const counts = new Map<string, number>();
  for (const value of values) if (value !== null) counts.set(value.unit, (counts.get(value.unit) ?? 0) + 1);
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[0] ?? null;
}

/**
 * Flags the winning positions among `amounts` (null = not comparable). Ties are all flagged;
 * nothing is flagged when fewer than two values exist or they are all equal.
 *
 * @example winningPositions([1, null, 3, 3], "higher") // [false, false, true, true]
 */
export function winningPositions(amounts: readonly (number | null)[], direction: BestDirection): boolean[] {
  const present = amounts.filter((amount): amount is number => amount !== null);
  const none = amounts.map(() => false);
  if (present.length < 2) return none;
  const best = direction === "higher" ? Math.max(...present) : Math.min(...present);
  if (present.every((amount) => amount === best)) return none;
  return amounts.map((amount) => amount === best);
}

/**
 * Per-cell "best" flags for one spec row: only rows with a known direction and at least two numeric
 * values sharing a unit are marked.
 *
 * @example markBestSpecs("brightness", ["400 nits", "350 nits", null]) // [true, false, false]
 */
export function markBestSpecs(labelKey: string, texts: readonly (string | null)[]): boolean[] {
  const direction = bestDirectionFor(labelKey);
  const none = texts.map(() => false);
  if (direction === null) return none;
  const parsed = texts.map((text) => (text === null ? null : parseLeadingNumber(text)));
  const unit = dominantUnit(parsed);
  const amounts = parsed.map((value) => (value !== null && value.unit === unit ? value.amount : null));
  return winningPositions(amounts, direction);
}
