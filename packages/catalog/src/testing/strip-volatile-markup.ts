// Scripts and styles are megabytes of bundle code no extractor reads. JSON-LD scripts stay:
// they are product data (Flipkart's identity, price and rating live there).
const NON_DATA_SCRIPT = /<script\b(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/gi;
const STYLE_OR_NOSCRIPT = /<(style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi;

/**
 * Shrinks a captured page to what extractors read, so fixtures stay small and diffable.
 *
 * @example stripVolatileMarkup('<script>x()</script><p>a</p>') // "<p>a</p>"
 */
export function stripVolatileMarkup(html: string): string {
  return html.replace(NON_DATA_SCRIPT, "").replace(STYLE_OR_NOSCRIPT, "");
}
