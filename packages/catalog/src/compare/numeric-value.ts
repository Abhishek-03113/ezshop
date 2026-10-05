export interface NumericValue {
  amount: number;
  /** Lowercased, trailing plural "s" removed, so "2 Years" and "1 year" share the unit "year". */
  unit: string;
}

const LEADING_NUMBER = /^\s*(?:₹|rs\.?\s*)?(-?\d[\d,]*(?:\.\d+)?)\s*([a-zA-Z%"]*)/;

/**
 * Reads the leading number and unit of a spec value, or null when it does not start with a number.
 *
 * @example parseLeadingNumber("1,000 Nits typical") // { amount: 1000, unit: "nit" }
 */
export function parseLeadingNumber(text: string): NumericValue | null {
  const match = LEADING_NUMBER.exec(text);
  if (match === null) return null;
  const amount = Number((match[1] ?? "").replace(/,/g, ""));
  if (!Number.isFinite(amount)) return null;
  return { amount, unit: (match[2] ?? "").toLowerCase().replace(/s$/, "") };
}
