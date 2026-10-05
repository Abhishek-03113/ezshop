import type { PageNode } from "../../page/page-node.ts";
import { textOrNull } from "../../text/normalize-text.ts";
import { parseJsonLdNodes } from "./json-ld-product.ts";

// Crumbs that name navigation, not a product category.
const NON_CATEGORY_CRUMBS = new Set(["home", "back to results"]);

/**
 * The category of a product: the last crumb that names a real category. Skips "Home" and any crumb
 * that merely repeats the product title (Flipkart ends its trail with the product itself).
 *
 * @example categoryFromCrumbs(["Electronics", "Headphones", "Over-Ear"], "Sony WH-1000XM5") // "Over-Ear"
 */
export function categoryFromCrumbs(crumbs: readonly string[], productTitle: string): string | null {
  const title = productTitle.toLowerCase();
  const meaningful = crumbs
    .map((crumb) => crumb.trim())
    .filter((crumb) => crumb !== "" && !NON_CATEGORY_CRUMBS.has(crumb.toLowerCase()) && crumb.toLowerCase() !== title);
  return meaningful.at(-1) ?? null;
}

/**
 * Crumb labels of Amazon's visible breadcrumb trail, in order.
 *
 * @example amazonBreadcrumbLabels(page) // ["Electronics", "Headphones"]
 */
export function amazonBreadcrumbLabels(page: PageNode): string[] {
  return page
    .findAll("#wayfinding-breadcrumbs_feature_div li:not(.a-breadcrumb-divider) a")
    .map((link) => link.text())
    .filter((label) => label !== "");
}

/**
 * Crumb labels from schema.org BreadcrumbList JSON-LD (Flipkart), in order; empty when absent.
 *
 * @example jsonLdBreadcrumbLabels(page) // ["Home", "Audio", "Headphones"]
 */
export function jsonLdBreadcrumbLabels(page: PageNode): string[] {
  const list = page
    .findAll('script[type="application/ld+json"]')
    .flatMap((script) => parseJsonLdNodes(script.text()))
    .find(isBreadcrumbList);
  if (list === undefined) return [];
  return list.itemListElement.map(crumbName).filter((name): name is string => name !== null);
}

interface BreadcrumbList {
  itemListElement: unknown[];
}

function isBreadcrumbList(node: unknown): node is BreadcrumbList {
  if (typeof node !== "object" || node === null) return false;
  const record = node as Record<string, unknown>;
  return record["@type"] === "BreadcrumbList" && Array.isArray(record.itemListElement);
}

function crumbName(crumb: unknown): string | null {
  if (typeof crumb !== "object" || crumb === null) return null;
  const record = crumb as { name?: unknown; item?: { name?: unknown } | unknown };
  const nested =
    typeof record.item === "object" && record.item !== null ? (record.item as { name?: unknown }).name : undefined;
  const name = record.name ?? nested;
  return typeof name === "string" ? textOrNull(name) : null;
}
