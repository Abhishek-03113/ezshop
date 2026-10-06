import { findFirst, type PageNode } from "../../page/page-node.ts";
import type { Spec, SpecGroup } from "../../product-snapshot.ts";

/** Where one label/value row lives, and where its label and value sit inside it. */
export interface SpecRowSelectors {
  row: string;
  label: string;
  value: string;
}

/** A spec group whose title is fixed by Picky (the page shows no usable heading). */
export interface FixedSpecGroupSource extends SpecRowSelectors {
  kind: "fixed";
  title: string;
}

/** Repeated sections that carry their own heading, e.g. Flipkart's "Display Features". */
export interface TitledSpecSectionSource extends SpecRowSelectors {
  kind: "titled";
  section: string;
  sectionTitle: string;
}

export type SpecGroupSource = FixedSpecGroupSource | TitledSpecSectionSource;

const TRAILING_COLON = /\s*:\s*$/;

/**
 * Reads spec groups from a list of sources, in order, merging groups that share a title.
 *
 * @example readSpecGroups(page, [{ kind: "fixed", title: "Details", row: "tr", label: "th", value: "td" }])
 */
export function readSpecGroups(page: PageNode, sources: readonly SpecGroupSource[]): SpecGroup[] {
  return mergeSpecGroupsByTitle(sources.flatMap((source) => readSpecGroupSource(page, source)));
}

function readSpecGroupSource(page: PageNode, source: SpecGroupSource): SpecGroup[] {
  if (source.kind === "fixed") return [{ title: source.title, specs: readSpecRows(page, source) }];
  return page.findAll(source.section).map((section) => ({
    title: findFirst(section, source.sectionTitle)?.text() ?? "",
    specs: readSpecRows(section, source),
  }));
}

/**
 * Label/value rows under a scope; rows missing either side are skipped.
 *
 * @example readSpecRows(table, { row: "tr", label: "th", value: "td" }) // [{ label: "Brand", value: "Sony" }]
 */
export function readSpecRows(scope: PageNode, selectors: SpecRowSelectors): Spec[] {
  return scope
    .findAll(selectors.row)
    .map((row) => readSpecRow(row, selectors))
    .filter((spec): spec is Spec => spec !== null);
}

function readSpecRow(row: PageNode, selectors: SpecRowSelectors): Spec | null {
  const label = findFirst(row, selectors.label)?.text().replace(TRAILING_COLON, "");
  const value = findFirst(row, selectors.value)?.text();
  if (!label || !value) return null;
  return { label, value };
}

/**
 * Drops untitled and empty groups, and folds groups with the same title into the first one,
 * skipping repeated labels. Pages often show one section in two widgets.
 *
 * @example mergeSpecGroupsByTitle([{ title: "A", specs: [x] }, { title: "A", specs: [y] }]) // [{ title: "A", specs: [x, y] }]
 */
export function mergeSpecGroupsByTitle(groups: readonly SpecGroup[]): SpecGroup[] {
  const specsByTitle = new Map<string, Spec[]>();
  for (const group of groups.filter((candidate) => candidate.title !== "" && candidate.specs.length > 0)) {
    const merged = specsByTitle.get(group.title) ?? [];
    const seenLabels = new Set(merged.map((spec) => spec.label));
    specsByTitle.set(group.title, [...merged, ...group.specs.filter((spec) => !seenLabels.has(spec.label))]);
  }
  return [...specsByTitle].map(([title, specs]) => ({ title, specs }));
}
