import { parseUrlOnHosts } from "../shared/parse-site-url.ts";

const AMAZON_IN_HOSTS: ReadonlySet<string> = new Set(["www.amazon.in", "amazon.in"]);

// Product pages live at /dp/<ASIN> or /gp/product/<ASIN>, optionally behind a slug: /Apple-iPhone-17/dp/B0FQG1YHYR/ref=…
const ASIN_IN_PATH = /\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?]|$)/;

export interface AmazonProductRef {
  asin: string;
}

/**
 * Recognises an Amazon.in product-page URL and pulls out its ASIN; null for anything else.
 *
 * @example parseAmazonProductUrl("https://www.amazon.in/dp/B0FQG1YHYR") // { asin: "B0FQG1YHYR" }
 */
export function parseAmazonProductUrl(pageUrl: string): AmazonProductRef | null {
  const url = parseUrlOnHosts(pageUrl, AMAZON_IN_HOSTS);
  const asin = url === null ? undefined : ASIN_IN_PATH.exec(url.pathname)?.[1];
  return asin === undefined ? null : { asin };
}

/**
 * Tracking-free product URL, so the same product always stores under one URL.
 *
 * @example canonicalAmazonUrl("B0FQG1YHYR") // "https://www.amazon.in/dp/B0FQG1YHYR"
 */
export function canonicalAmazonUrl(asin: string): string {
  return `https://www.amazon.in/dp/${asin}`;
}
