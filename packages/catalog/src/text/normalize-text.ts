// Amazon pads labels with LRM/RLM marks (e.g. "Brand ‏ : ‎ Apple") and zero-width spaces.
const INVISIBLE_MARKS = /[\u200b\u200e\u200f\ufeff]/g;
const WHITESPACE_RUN = /\s+/g;

/**
 * Collapses whitespace and strips invisible direction marks so page text compares cleanly.
 *
 * @example normalizeText("  Brand \u200e:\n Apple ") // "Brand : Apple"
 */
export function normalizeText(raw: string): string {
  return raw.replace(INVISIBLE_MARKS, "").replace(WHITESPACE_RUN, " ").trim();
}

/**
 * Normalises text and returns null when nothing is left, so optional fields stay null, never "".
 *
 * @example textOrNull("   ") // null
 */
export function textOrNull(raw: string | null | undefined): string | null {
  const text = normalizeText(raw ?? "");
  return text === "" ? null : text;
}
