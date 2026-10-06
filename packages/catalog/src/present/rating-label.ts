const COUNT_FORMAT = new Intl.NumberFormat("en-IN");

/**
 * "17,240 ratings" / "1 rating", with Indian digit grouping.
 *
 * @example ratingCountLabel(1724000) // "17,24,000 ratings"
 */
export function ratingCountLabel(count: number): string {
  return `${COUNT_FORMAT.format(count)} ${count === 1 ? "rating" : "ratings"}`;
}
