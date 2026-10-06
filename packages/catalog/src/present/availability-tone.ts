export type AvailabilityTone = "in-stock" | "out-of-stock" | "unknown";

/**
 * Colour class for the availability dot, guessed from the store's own wording.
 *
 * @example availabilityTone("In stock") // "in-stock"
 */
export function availabilityTone(text: string): AvailabilityTone {
  if (/\b(out of stock|unavailable|sold out|coming soon)\b/i.test(text)) return "out-of-stock";
  if (/\bin stock\b/i.test(text)) return "in-stock";
  return "unknown";
}
