import type { ProductSnapshot } from "../product-snapshot.ts";

const TITLE_WORD_LIMIT = 6;

/**
 * Flipkart search URL for finding the same product there: brand plus the first words of the title
 * (where the model name lives), without parenthetical marketing detail.
 *
 * @example flipkartSearchUrl(snapshot) // "https://www.flipkart.com/search?q=ASUS%20ProArt%20PA279CV%2027-inch"
 */
export function flipkartSearchUrl(snapshot: ProductSnapshot): string {
  const headline = snapshot.title.replace(/\([^)]*\)/g, " ").split(/[,|–—]/)[0] ?? snapshot.title;
  const words = headline.split(/\s+/).filter((word) => word !== "");
  const brand = snapshot.brand ?? "";
  const startsWithBrand = brand !== "" && (words[0] ?? "").toLowerCase() === brand.toLowerCase();
  const query = [...(brand !== "" && !startsWithBrand ? [brand] : []), ...words].slice(0, TITLE_WORD_LIMIT);
  return `https://www.flipkart.com/search?q=${encodeURIComponent(query.join(" "))}`;
}
