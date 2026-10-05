import type { PageNode } from "../../page/page-node.ts";
import type { SpecGroup } from "../../product-snapshot.ts";
import { readSpecGroups, type SpecGroupSource } from "../shared/spec-sections.ts";

const PROD_DET_ROWS = { row: "tr", label: "th", value: "td" } as const;
const TWO_CELL_ROWS = { row: "tr", label: "td:first-child", value: "td:last-child" } as const;

// Amazon spreads specs over several widgets; their presence varies by category and layout.
// Order here is the order ezshop shows them in: the overview first, as the at-a-glance summary.
const AMAZON_SPEC_SOURCES: readonly SpecGroupSource[] = [
  { kind: "fixed", title: "At a glance", ...TWO_CELL_ROWS, row: "#productOverview_feature_div tr" },
  // Brand-supplied spec sheet (seen on iPhone 17, B0FQG1YHYR). Excludes the prodDetTable
  // tables, which some layouts nest under #tech and which are read below.
  { kind: "fixed", title: "Technical details", ...TWO_CELL_ROWS, row: "#tech table:not(.prodDetTable) tr" },
  { kind: "fixed", title: "Product details", ...PROD_DET_ROWS, row: "#productDetails_techSpec_section_1 tr" },
  {
    kind: "fixed",
    title: "Additional information",
    ...PROD_DET_ROWS,
    row: "#productDetails_detailBullets_sections1 tr",
  },
  {
    // Expander layout: titled, collapsible sections ("Item details", "Audio", …), seen on
    // Sony WH-1000XM5 (B09XS7JWHH) instead of the fixed tables above.
    kind: "titled",
    section: "[id^='productDetails_expanderTables_depth'] .a-expander-container",
    sectionTitle: ".a-expander-prompt",
    ...PROD_DET_ROWS,
    row: "table.prodDetTable tr",
  },
  {
    // Older layout: "Brand ‏ : ‎ Apple" bullet list instead of tables.
    kind: "fixed",
    title: "Item details",
    row: "#detailBullets_feature_div li",
    label: ".a-text-bold",
    value: ".a-text-bold + span",
  },
];

/**
 * Reads every known Amazon spec widget into titled groups, skipping widgets absent from the page.
 *
 * @example extractAmazonSpecGroups(page)[0] // { title: "At a glance", specs: [{ label: "Brand", value: "Apple" }, …] }
 */
export function extractAmazonSpecGroups(page: PageNode): SpecGroup[] {
  return readSpecGroups(page, AMAZON_SPEC_SOURCES);
}
