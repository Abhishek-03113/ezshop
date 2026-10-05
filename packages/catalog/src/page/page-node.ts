/**
 * Read-only view of one element of a parsed page. ezshop's thin interface over the HTML
 * library in use: cheerio on the server (`./cheerio-page.ts`), the live DOM in the extension
 * (`./dom-page.ts`). Extractors depend only on this, so one extractor serves both.
 *
 * @example root.findAll("#feature-bullets li").map((item) => item.text())
 */
export interface PageNode {
  /** Text content with whitespace collapsed and invisible marks removed; "" when empty. */
  text(): string;
  /** Attribute value, or null when absent. */
  attr(name: string): string | null;
  /** Descendants matching a CSS selector, in document order. */
  findAll(selector: string): PageNode[];
}

/**
 * Elements whose content is never visible text. Amazon nests a <script> with page-state JSON
 * inside #availability, which leaked into ProductSnapshot.availability on live imports.
 */
export const NON_TEXT_SELECTOR = "script, style, noscript, template";

/**
 * First descendant matching the selector, or null.
 *
 * @example findFirst(root, "#productTitle")?.text()
 */
export function findFirst(root: PageNode, selector: string): PageNode | null {
  return root.findAll(selector)[0] ?? null;
}

/**
 * Text of the first selector that yields non-empty text. Amazon renders the same field under
 * different markup across layouts, so callers list selectors from most to least specific.
 *
 * @example firstText(root, [".priceToPay .a-offscreen", ".priceToPay [aria-hidden=true]"])
 */
export function firstText(root: PageNode, selectors: readonly string[]): string | null {
  for (const selector of selectors) {
    const text = root
      .findAll(selector)
      .find((node) => node.text() !== "")
      ?.text();
    if (text !== undefined) return text;
  }
  return null;
}

/**
 * Attribute of the first element matching the selector, or null.
 *
 * @example firstAttr(root, "#landingImage", "data-old-hires")
 */
export function firstAttr(root: PageNode, selector: string, name: string): string | null {
  return findFirst(root, selector)?.attr(name) ?? null;
}
