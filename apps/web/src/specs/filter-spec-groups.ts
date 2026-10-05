import type { Spec, SpecGroup } from "@ezshop/catalog";
import { pluralize } from "../format/format-count.ts";

/**
 * Keeps specs whose label, value or group title contains the query (case-insensitive); drops emptied groups.
 * A blank query returns the groups unchanged.
 *
 * @example filterSpecGroups(groups, "battery") // only battery-related rows
 */
export function filterSpecGroups(groups: readonly SpecGroup[], query: string): SpecGroup[] {
  const needle = query.trim().toLowerCase();
  if (needle === "") return [...groups];
  return groups
    .map((group) => ({ ...group, specs: group.specs.filter((spec) => specMatches(spec, group.title, needle)) }))
    .filter((group) => group.specs.length > 0);
}

function specMatches(spec: Spec, groupTitle: string, needle: string): boolean {
  return [spec.label, spec.value, groupTitle].some((field) => field.toLowerCase().includes(needle));
}

/**
 * Total number of spec rows across groups.
 *
 * @example countSpecs([{ title: "A", specs: [s1, s2] }]) // 2
 */
export function countSpecs(groups: readonly SpecGroup[]): number {
  return groups.reduce((total, group) => total + group.specs.length, 0);
}

/**
 * Subtitle under "Specifications": the full size, or how many rows survive an active search.
 *
 * @example specCountLabel(all, visible, "") // "54 specs in 10 groups"; with a query: "3 matching specs"
 */
export function specCountLabel(all: readonly SpecGroup[], visible: readonly SpecGroup[], query: string): string {
  if (query.trim() !== "") return `${countSpecs(visible)} matching ${countSpecs(visible) === 1 ? "spec" : "specs"}`;
  return `${pluralize(countSpecs(all), "spec")} in ${pluralize(all.length, "group")}`;
}

/**
 * Stable in-page anchor for a spec group, derived from its title so it survives filtering.
 *
 * @example specGroupAnchor("Item details") // "group-item-details"
 */
export function specGroupAnchor(title: string): string {
  return `group-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}
