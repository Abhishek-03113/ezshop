import { parseMoney } from "../../money/parse-money.ts";
import { firstAttr, firstText, type PageNode } from "../../page/page-node.ts";
import type { Money, Rating } from "../../product-snapshot.ts";

// .a-offscreen is sometimes a blank placeholder; the visible (aria-hidden) price is the fallback.
// See research/FINDINGS.md §3 "Product page".
const PRICE_SELECTORS = [
  ".priceToPay .a-offscreen",
  ".priceToPay [aria-hidden='true']",
  "#corePrice_feature_div .a-price .a-offscreen",
] as const;
const LIST_PRICE_SELECTORS = [".basisPrice .a-offscreen"] as const;
const RATING_SELECTORS = ["#averageCustomerReviews .a-icon-alt"] as const;
const RATING_COUNT_SELECTORS = ["#acrCustomerReviewText"] as const;

const FIRST_DECIMAL = /\d+(?:\.\d+)?/;
const NON_DIGIT = /\D/g;

/**
 * Selling price (what the buyer pays), in INR.
 *
 * @example extractAmazonPrice(page) // { amount: 124900, currency: "INR" }
 */
export function extractAmazonPrice(page: PageNode): Money | null {
  const display = firstText(page, PRICE_SELECTORS);
  return display === null ? null : parseMoney(display, "INR");
}

/**
 * M.R.P. shown struck through next to a discounted price; null when there is no discount.
 *
 * @example extractAmazonListPrice(page) // { amount: 133399, currency: "INR" }
 */
export function extractAmazonListPrice(page: PageNode): Money | null {
  const display = firstText(page, LIST_PRICE_SELECTORS);
  return display === null ? null : parseMoney(display, "INR");
}

/**
 * Star average and rating count, e.g. "4.7 out of 5 stars" and "(753)".
 *
 * @example extractAmazonRating(page) // { average: 4.7, count: 753 }
 */
export function extractAmazonRating(page: PageNode): Rating | null {
  const stars = firstAttr(page, "#acrPopover", "title") ?? firstText(page, RATING_SELECTORS);
  const average = Number.parseFloat(FIRST_DECIMAL.exec(stars ?? "")?.[0] ?? "");
  if (!Number.isFinite(average)) return null;
  const countText = (firstText(page, RATING_COUNT_SELECTORS) ?? "").replace(NON_DIGIT, "");
  return { average, count: countText === "" ? 0 : Number.parseInt(countText, 10) };
}
