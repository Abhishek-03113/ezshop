import type { ProductSnapshot } from "../product-snapshot.ts";
import { normalizeLabelKey, normalizeValue } from "./label-key.ts";
import { markBestSpecs } from "./mark-best.ts";
import { buildPriceCells, buildRatingCells } from "./top-cells.ts";
import type { ComparisonGroup, ComparisonMatrix, ComparisonOptions, ComparisonRow } from "./types.ts";

interface DraftRow {
  key: string;
  label: string;
  groupTitle: string;
  values: (string | null)[];
}

/** Collects one draft row per label key, in first-seen order, remembering where it first appeared. */
function collectDraftRows(snapshots: readonly ProductSnapshot[]): DraftRow[] {
  const rows = new Map<string, DraftRow>();
  snapshots.forEach((snapshot, column) => {
    for (const group of snapshot.specGroups) {
      for (const spec of group.specs) {
        const key = normalizeLabelKey(spec.label);
        const row = rows.get(key) ?? {
          key,
          label: spec.label,
          groupTitle: group.title,
          values: snapshots.map(() => null),
        };
        row.values[column] ??= spec.value;
        rows.set(key, row);
      }
    }
  });
  return [...rows.values()];
}

function toRow(draft: DraftRow): ComparisonRow {
  const best = markBestSpecs(draft.key, draft.values);
  const distinct = new Set(draft.values.map((value) => (value === null ? null : normalizeValue(value))));
  return {
    key: draft.key,
    label: draft.label,
    cells: draft.values.map((text, index) => ({ text, isBest: best[index] ?? false })),
    differs: distinct.size > 1,
  };
}

function matchesQuery(draft: DraftRow, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (needle === "") return true;
  return [draft.label, ...draft.values].some((text) => text?.toLowerCase().includes(needle) ?? false);
}

function groupRows(
  rows: readonly { draft: DraftRow; row: ComparisonRow }[],
  differencesOnly: boolean,
): ComparisonGroup[] {
  const groups = new Map<string, ComparisonGroup>();
  for (const { draft, row } of rows) {
    const group = groups.get(draft.groupTitle) ?? { title: draft.groupTitle, rows: [], identicalCount: 0 };
    if (differencesOnly && !row.differs) group.identicalCount += 1;
    else group.rows.push(row);
    groups.set(draft.groupTitle, group);
  }
  return [...groups.values()];
}

/**
 * Aligns the products' specs into a matrix: one row per normalized label, one cell per product,
 * "best" flags on numeric rows, and (with `differencesOnly`) identical rows folded into a count.
 * With fewer than two products there is nothing to differ from, so every row is kept.
 *
 * @example buildComparisonMatrix([monitorA, monitorB], { differencesOnly: true }).identicalCount // 12
 */
export function buildComparisonMatrix(
  snapshots: readonly ProductSnapshot[],
  options: ComparisonOptions,
): ComparisonMatrix {
  const hideIdentical = options.differencesOnly && snapshots.length > 1;
  const kept = collectDraftRows(snapshots)
    .filter((draft) => matchesQuery(draft, options.query ?? ""))
    .map((draft) => ({ draft, row: toRow(draft) }));
  const groups = groupRows(kept, hideIdentical);
  return {
    prices: buildPriceCells(snapshots),
    ratings: buildRatingCells(snapshots),
    groups: groups.filter((group) => group.rows.length > 0),
    identicalCount: groups.reduce((total, group) => total + group.identicalCount, 0),
  };
}
