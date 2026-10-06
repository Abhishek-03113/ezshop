import { type CatalogProductSummary, pluralize } from "@picky/catalog";

/**
 * A new selection with the id flipped; the input set is left alone so React state stays immutable.
 *
 * @example toggleSelected(new Set(["a"]), "b") // Set { "a", "b" }
 */
export function toggleSelected(selected: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(selected);
  if (!next.delete(id)) next.add(id);
  return next;
}

/**
 * Drops selected ids that are no longer on screen (filtered out, deleted), so "Compare N" never counts ghosts.
 *
 * @example pruneSelection(new Set(["a", "gone"]), products) // Set { "a" }
 */
export function pruneSelection(selected: ReadonlySet<string>, products: readonly CatalogProductSummary[]): Set<string> {
  const visible = new Set(products.map((product) => product.id));
  return new Set([...selected].filter((id) => visible.has(id)));
}

/**
 * Name for a comparison made from a hand-picked selection: the shared category when there is one.
 *
 * @example nameForSelection(monitorsOnly) // "Monitors"
 */
export function nameForSelection(products: readonly CatalogProductSummary[]): string {
  const categories = new Set(products.map((product) => product.category));
  const [only] = [...categories];
  if (categories.size === 1 && only !== null && only !== undefined) return only;
  return `Comparison of ${pluralize(products.length, "product")}`;
}
