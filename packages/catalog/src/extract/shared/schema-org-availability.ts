const CAMEL_CASE_BOUNDARY = /(?<=[a-z])(?=[A-Z])/g;

/**
 * Turns a schema.org availability IRI into readable text.
 *
 * @example schemaOrgAvailabilityLabel("https://schema.org/OutOfStock") // "Out of stock"
 */
export function schemaOrgAvailabilityLabel(availability: string): string | null {
  const term = availability.split("/").at(-1)?.trim() ?? "";
  if (term === "") return null;
  const words = term.replace(CAMEL_CASE_BOUNDARY, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
