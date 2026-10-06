const SITE_NAME = "Picky";

/**
 * Browser-tab title: the page's own name first, then the site name, so tabs stay tell-apart-able.
 * Without it every tab reads "Picky" and history entries are indistinguishable.
 *
 * @example pageTitle("Budget 4K picks") // "Budget 4K picks · Picky"
 */
export function pageTitle(pageName: string): string {
  const trimmed = pageName.trim();
  return trimmed === "" ? SITE_NAME : `${trimmed} · ${SITE_NAME}`;
}
