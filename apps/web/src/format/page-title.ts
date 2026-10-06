const SITE_NAME = "ezshop";

/**
 * Browser-tab title: the page's own name first, then the site name, so tabs stay tell-apart-able.
 * Without it every tab reads "ezshop" and history entries are indistinguishable.
 *
 * @example pageTitle("Budget 4K picks") // "Budget 4K picks · ezshop"
 */
export function pageTitle(pageName: string): string {
  const trimmed = pageName.trim();
  return trimmed === "" ? SITE_NAME : `${trimmed} · ${SITE_NAME}`;
}
