import type { Money } from "../product-snapshot.ts";

const CURRENCY_BY_SYMBOL: ReadonlyMap<string, string> = new Map([
  ["₹", "INR"],
  ["$", "USD"],
  ["€", "EUR"],
  ["£", "GBP"],
]);

// Indian grouping ("1,24,900") makes locale parsing unreliable; keep digits and the decimal point only.
const NON_NUMERIC = /[^0-9.]/g;

/**
 * Parses a displayed price such as "₹1,24,900.00" into a Money value.
 * Returns null when the text has no amount, or no currency and no fallback.
 *
 * @example parseMoney("₹1,24,900") // { amount: 124900, currency: "INR" }
 */
export function parseMoney(display: string, fallbackCurrency?: string): Money | null {
  const currency = detectCurrency(display) ?? fallbackCurrency;
  const digits = display.replace(NON_NUMERIC, "");
  if (currency === undefined || digits === "") return null;
  const amount = Number.parseFloat(digits);
  return Number.isFinite(amount) ? { amount, currency } : null;
}

function detectCurrency(display: string): string | undefined {
  for (const [symbol, code] of CURRENCY_BY_SYMBOL) {
    if (display.includes(symbol)) return code;
  }
  return undefined;
}
