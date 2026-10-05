import { parseImportSearch, type ImportSearch } from "../import/import-search.ts";
import { parseGroupKey, type GroupKey } from "./group-options.ts";

/** Search params of "/": the landing-page import URL, the library search text and the grouping. */
export interface LibrarySearch extends ImportSearch {
  q?: string | undefined;
  /** Absent means the default grouping (category), which keeps default URLs clean. */
  group?: GroupKey | undefined;
}

/**
 * TanStack `validateSearch` for "/": `?import=` must be an http(s) URL, `?q=` non-blank text, `?group=` a known key.
 * Missing keys are explicit undefined for the reason given in parseImportSearch.
 *
 * @example parseLibrarySearch({ q: " usb-c ", group: "brand" }) // { import: undefined, q: "usb-c", group: "brand" }
 */
export function parseLibrarySearch(search: Record<string, unknown>): LibrarySearch {
  const candidate = search["q"];
  const query = typeof candidate === "string" ? candidate.trim() : "";
  return {
    ...parseImportSearch(search),
    q: query === "" ? undefined : query,
    group: parseGroupKey(search["group"]),
  };
}
