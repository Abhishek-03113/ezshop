import type { Spec, SpecGroup } from "@ezshop/catalog";

/**
 * Keeps specs whose label or value contains the query (case-insensitive); drops emptied groups.
 * A blank query returns the groups unchanged.
 *
 * @example filterSpecGroups(groups, "battery") // only battery-related rows
 */
export function filterSpecGroups(groups: readonly SpecGroup[], query: string): SpecGroup[] {
  const needle = query.trim().toLowerCase();
  if (needle === "") return [...groups];
  return groups
    .map((group) => ({ ...group, specs: group.specs.filter((spec) => specMatches(spec, needle)) }))
    .filter((group) => group.specs.length > 0);
}

function specMatches(spec: Spec, needle: string): boolean {
  return spec.label.toLowerCase().includes(needle) || spec.value.toLowerCase().includes(needle);
}

/**
 * Total number of spec rows across groups.
 *
 * @example countSpecs([{ title: "A", specs: [s1, s2] }]) // 2
 */
export function countSpecs(groups: readonly SpecGroup[]): number {
  return groups.reduce((total, group) => total + group.specs.length, 0);
}
