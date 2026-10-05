/** Search params of "/": `import` is a product URL handed over by the landing page. */
export interface ImportSearch {
  import?: string | undefined;
}

/**
 * TanStack `validateSearch` for "/": keeps `?import=` only when it is an http(s) URL, so junk never reaches the API.
 *
 * @example parseImportSearch({ import: "https://www.amazon.in/dp/B0FQG1YHYR" }) // { import: "https://www.amazon.in/dp/B0FQG1YHYR" }
 */
export function parseImportSearch(search: Record<string, unknown>): ImportSearch {
  const candidate = search["import"];
  // Explicit undefined, not {}: TanStack merges the parent's raw search over a child's validated one,
  // so an omitted key would let the rejected value leak back in.
  if (typeof candidate !== "string" || !isHttpUrl(candidate.trim())) return { import: undefined };
  return { import: candidate.trim() };
}

function isHttpUrl(text: string): boolean {
  try {
    const { protocol } = new URL(text);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}
