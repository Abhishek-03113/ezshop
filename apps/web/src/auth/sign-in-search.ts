export type SignInMode = "signin" | "signup";

/** Search params of /login: where to go afterwards, and which form to show. */
export interface SignInSearch {
  redirect?: string;
  mode?: SignInMode;
}

/**
 * Validates /login's search params. `redirect` must be a path on this site: anything else
 * (another origin, "//evil.example", "javascript:") is dropped, so the page cannot be an open redirect.
 *
 * @example parseSignInSearch({ redirect: "/comparisons" }) // { redirect: "/comparisons" }
 */
export function parseSignInSearch(raw: Record<string, unknown>): SignInSearch {
  const search: SignInSearch = {};
  if (typeof raw.redirect === "string" && isSitePath(raw.redirect)) search.redirect = raw.redirect;
  if (raw.mode === "signup") search.mode = "signup";
  return search;
}

/**
 * Where to land after signing in: the validated redirect, else the library.
 *
 * @example afterSignInPath({}) // "/"
 */
export function afterSignInPath(search: SignInSearch): string {
  return search.redirect ?? "/";
}

function isSitePath(value: string): boolean {
  return value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\");
}
