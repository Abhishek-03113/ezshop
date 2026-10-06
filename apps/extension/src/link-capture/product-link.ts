/** Coarse Chrome match patterns for the context menu; the exact check is isSupportedProductUrl on click. */
export const PRODUCT_LINK_PATTERNS: readonly string[] = [
  "https://www.amazon.in/dp/*",
  "https://www.amazon.in/*/dp/*",
  "https://www.amazon.in/gp/product/*",
  "https://www.amazon.in/*/gp/product/*",
  "https://www.flipkart.com/*/p/*",
];

/**
 * A readable stand-in for a product's title, taken from the URL slug, for the "Reading …" toast before
 * the page is fetched.
 *
 * @example titleFromProductUrl("https://www.amazon.in/ASUS-ProArt-PA279CV/dp/B0FQG1YHYR") // "ASUS ProArt PA279CV"
 */
export function titleFromProductUrl(url: string): string {
  const segments = (URL.parse(url)?.pathname ?? "").split("/").filter((segment) => segment !== "");
  const slug = segments.find((segment) => segment.includes("-"));
  return slug === undefined ? "product" : decodeURIComponent(slug).replace(/-/g, " ");
}

export interface ClickedProductLink {
  url: string;
  label: string;
}

/**
 * The product link an Alt+click landed on, or null. Walks up from the click target to the nearest anchor.
 *
 * @example productLinkFromClick(event.target, looksLikeProductLink)
 */
export function productLinkFromClick(
  target: EventTarget | null,
  isSupported: (url: string) => boolean,
): ClickedProductLink | null {
  // Duck-typed rather than `instanceof Element`: the check must hold across realms (and in DOM test doubles).
  const closest = (target as Partial<Element> | null)?.closest;
  const anchor = typeof closest === "function" ? closest.call(target, "a[href]") : null;
  if (anchor === null) return null;
  const url = (anchor as HTMLAnchorElement).href;
  if (!isSupported(url)) return null;
  const label = (anchor.textContent ?? "").replace(/\s+/g, " ").trim();
  return { url, label: label === "" ? titleFromProductUrl(url) : label };
}

const PRODUCT_PATH_HINT =
  /^https:\/\/(?:www\.)?(?:amazon\.in\/(?:.+\/)?(?:dp|gp\/product)\/|flipkart\.com\/[^/]+\/p\/)/;

/**
 * Cheap link test for the always-on content script, which must stay tiny: importing the real
 * isSupportedProductUrl would bundle all of @picky/catalog (zod, extractors) into every Amazon page.
 * The service worker re-checks with the real extractor before fetching anything.
 *
 * @example looksLikeProductLink("https://www.amazon.in/Some-Item/dp/B0FQG1YHYR") // true
 */
export function looksLikeProductLink(url: string): boolean {
  return PRODUCT_PATH_HINT.test(url);
}
