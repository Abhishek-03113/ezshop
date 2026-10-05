import type { PageNode } from "../../page/page-node.ts";
import type { SpecGroup } from "../../product-snapshot.ts";
import { readSpecGroups, type TitledSpecSectionSource } from "../shared/spec-sections.ts";

// Flipkart renders with React Native Web: class names are hashed and change between deploys.
// These hooks are its layout primitives and font tokens, which were identical in SSR HTML and the
// hydrated DOM (checked 2026-10-05 on the iPhone 17 page, pid MOBHQV9YAZYYWY8A).
const FLIPKART_SPEC_SECTIONS: TitledSpecSectionSource = {
  kind: "titled",
  section: ".grid-formation.grid-column-1 > div",
  sectionTitle: '[font="default-fk-font-l"]',
  row: ".grid-formation-dynamic",
  label: '[font="default-fk-font-m"]',
  value: '[font="s"]',
};

// Flipkart lists sections in an arbitrary order (Battery first, General in the middle).
// "General" carries brand/model/colour, so it leads as the at-a-glance group.
const LEADING_SECTION = "General";

/**
 * Reads Flipkart's "Specifications" sections into titled groups, "General" first.
 *
 * @example extractFlipkartSpecGroups(page)[0]?.title // "General"
 */
export function extractFlipkartSpecGroups(page: PageNode): SpecGroup[] {
  const groups = readSpecGroups(page, [FLIPKART_SPEC_SECTIONS]);
  return [...groups.filter(isLeadingSection), ...groups.filter((group) => !isLeadingSection(group))];
}

function isLeadingSection(group: SpecGroup): boolean {
  return group.title === LEADING_SECTION;
}
