/** Spec labels that mean the same thing across Amazon and Flipkart, keyed by their normalized form. */
const LABEL_SYNONYMS: Readonly<Record<string, string>> = {
  "max brightness": "brightness",
  "maximum brightness": "brightness",
  "peak brightness": "brightness",
  "max refresh rate": "refresh rate",
  "maximum refresh rate": "refresh rate",
  "display size": "screen size",
  "standing screen display size": "screen size",
  "item weight": "weight",
  "product weight": "weight",
  "net weight": "weight",
  "battery life": "battery",
  "battery capacity": "battery",
  "ram size": "ram",
  "memory storage capacity": "storage",
  "internal storage": "storage",
  "hard disk size": "storage",
  "warranty period": "warranty",
  "warranty summary": "warranty",
  "manufacturer warranty": "warranty",
};

/**
 * Collapses a spec label to a comparable key: lowercase, no bracketed unit hints, no punctuation,
 * single spaces, then the synonym table.
 *
 * @example normalizeLabelKey("Max Brightness (nits):") // "brightness"
 */
export function normalizeLabelKey(label: string): string {
  const plain = label
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return LABEL_SYNONYMS[plain] ?? plain;
}

/**
 * Collapses a spec value so cosmetic differences do not count as differences.
 *
 * @example normalizeValue("1,000 Nits") === normalizeValue("1000nits") // true
 */
export function normalizeValue(value: string): string {
  return value
    .toLowerCase()
    .replace(/(\d),(?=\d)/g, "$1")
    .replace(/(\d)\s+(?=[a-z%"])/g, "$1")
    .replace(/\s+/g, " ")
    .replace(/[.;,\s]+$/, "")
    .trim();
}
