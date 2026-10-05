import type { SpecGroup } from "../../product-snapshot.ts";

/**
 * Value of the first spec with this label (case-insensitive) across all groups, or null.
 *
 * @example findSpecValue(groups, "brand") // "Apple"
 */
export function findSpecValue(groups: readonly SpecGroup[], label: string): string | null {
  const wanted = label.toLowerCase();
  const spec = groups.flatMap((group) => group.specs).find((candidate) => candidate.label.toLowerCase() === wanted);
  return spec?.value ?? null;
}
