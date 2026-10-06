import type { CatalogComparisonSummary } from "@picky/catalog";
import type { AddTarget } from "./add-target.ts";

export interface MenuEntry {
  id: string;
  parentId?: string;
  title: string;
  kind: "normal" | "separator";
}

export const ROOT_MENU_ID = "picky:add";
const COMPARISON_PREFIX = "picky:cmp:";
const LIBRARY_ID = "picky:library";
const NEW_ID = "picky:new";

/** Chrome reads "&" in a menu title as an accelerator marker; doubling it shows a literal "&". */
function menuTitle(text: string): string {
  return text.replaceAll("&", "&&");
}

function comparisonEntries(comparisons: readonly CatalogComparisonSummary[], lastUsedId: string | null): MenuEntry[] {
  const lastUsed = comparisons.find((comparison) => comparison.id === lastUsedId);
  const ordered = lastUsed === undefined ? comparisons : [lastUsed, ...comparisons.filter((c) => c.id !== lastUsed.id)];
  return ordered.map((comparison) => ({
    id: `${COMPARISON_PREFIX}${comparison.id}`,
    parentId: ROOT_MENU_ID,
    title: menuTitle(comparison.id === lastUsed?.id ? `${comparison.name} (last used)` : comparison.name),
    kind: "normal",
  }));
}

/**
 * The "Add to Picky" submenu: last-used comparison first (labelled), the others, a separator, then
 * "Library only" and "New comparison…". The root entry comes first.
 *
 * @example buildMenuEntries(comparisons, "c1").map((entry) => entry.title)
 * // ["Add to Picky", "Monitors (last used)", "Home office", "", "Library only", "New comparison…"]
 */
export function buildMenuEntries(
  comparisons: readonly CatalogComparisonSummary[],
  lastUsedId: string | null,
): MenuEntry[] {
  const child = (id: string, title: string, kind: MenuEntry["kind"] = "normal"): MenuEntry => ({
    id,
    parentId: ROOT_MENU_ID,
    title,
    kind,
  });
  return [
    { id: ROOT_MENU_ID, title: "Add to Picky", kind: "normal" },
    ...comparisonEntries(comparisons, lastUsedId),
    ...(comparisons.length > 0 ? [child("picky:separator", "", "separator")] : []),
    child(LIBRARY_ID, "Library only"),
    child(NEW_ID, "New comparison…"),
  ];
}

/**
 * What a clicked menu item means, or null for the root and foreign items.
 *
 * @example addTargetFromMenuItem("picky:cmp:c1") // { kind: "comparison", comparisonId: "c1" }
 */
export function addTargetFromMenuItem(menuItemId: string | number): AddTarget | null {
  const id = String(menuItemId);
  if (id === LIBRARY_ID) return { kind: "library" };
  if (id === NEW_ID) return { kind: "new" };
  if (!id.startsWith(COMPARISON_PREFIX)) return null;
  return { kind: "comparison", comparisonId: id.slice(COMPARISON_PREFIX.length) };
}
