export type BestDirection = "higher" | "lower";

// Word-bounded so "ram" does not match "program" or "frame".
const HIGHER_IS_BETTER = [
  /\bbrightness\b/,
  /\brefresh rate\b/,
  /\bpower delivery\b/,
  /\busb c power\b/,
  /\bwarranty\b/,
  /\bbattery\b/,
  /\bram\b/,
  /\bstorage\b/,
  /\bcontrast\b/,
];
const LOWER_IS_BETTER = [/\bweight\b/, /\bresponse time\b/, /\binput lag\b/, /\bpower consumption\b/];

/**
 * Which numeric direction wins for a normalized label key, or null when "better" is a matter of taste
 * (screen size, colour...) and nothing should be marked.
 *
 * @example bestDirectionFor("response time") // "lower"
 */
export function bestDirectionFor(labelKey: string): BestDirection | null {
  if (LOWER_IS_BETTER.some((pattern) => pattern.test(labelKey))) return "lower";
  if (HIGHER_IS_BETTER.some((pattern) => pattern.test(labelKey))) return "higher";
  return null;
}
