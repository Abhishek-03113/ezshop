/**
 * Joins site names for UI copy.
 *
 * @example formatSourceList(["amazon.in", "flipkart.com", "x.com"]) // "amazon.in, flipkart.com or x.com"
 */
export function formatSourceList(sources: readonly string[]): string {
  if (sources.length <= 1) return sources.join("");
  return `${sources.slice(0, -1).join(", ")} or ${sources.at(-1)}`;
}
