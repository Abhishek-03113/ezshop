import type { PageNode } from "../../page/page-node.ts";
import type { Highlight } from "../../product-snapshot.ts";

// Legal boilerplate Amazon injects into "About this item" on some listings (seen on AppleCare bundles).
const BOILERPLATE_BULLET = /^By clicking on Add to Cart/i;

// Bullets are often "HEADLINE — detail". A dash further in than this is part of the sentence.
const HEADING_SEPARATOR = " — ";
const MAX_HEADING_LENGTH = 80;

/**
 * Reads the "About this item" bullets, splitting "HEADLINE — detail" into heading and text.
 *
 * @example extractAmazonHighlights(page)[0] // { heading: "DESIGNED TO DELIGHT. BUILT TO LAST", text: "iPhone 17 comes in…" }
 */
export function extractAmazonHighlights(page: PageNode): Highlight[] {
  return page
    .findAll("#feature-bullets li")
    .map((item) => item.text())
    .filter((bullet) => bullet !== "" && !BOILERPLATE_BULLET.test(bullet))
    .map(splitHighlight);
}

/**
 * Splits one bullet into an optional heading and its body.
 *
 * @example splitHighlight("iOS — A fresh design") // { heading: "iOS", text: "A fresh design" }
 */
export function splitHighlight(bullet: string): Highlight {
  const separatorAt = bullet.indexOf(HEADING_SEPARATOR);
  if (separatorAt <= 0 || separatorAt > MAX_HEADING_LENGTH) return { heading: null, text: bullet };
  const text = bullet.slice(separatorAt + HEADING_SEPARATOR.length).trim();
  if (text === "") return { heading: null, text: bullet };
  return { heading: bullet.slice(0, separatorAt).trim(), text };
}
