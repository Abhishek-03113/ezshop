/**
 * Manifest host permissions: the ones the manifest already declares (marketplaces we fetch product links from)
 * plus the API host, without duplicates.
 *
 * @example mergeHostPermissions(["https://www.amazon.in/*"], "http://localhost:8787/*")
 * // ["https://www.amazon.in/*", "http://localhost:8787/*"]
 */
export function mergeHostPermissions(declared: readonly string[], apiHost: string): string[] {
  return [...new Set([...declared, apiHost])];
}
