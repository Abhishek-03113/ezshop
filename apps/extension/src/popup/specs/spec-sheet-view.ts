import { filterSpecGroups, specCountLabel, type ProductSnapshot, type SpecGroup } from "@picky/catalog";
import type { Dom } from "../dom.ts";
import { renderSpecHighlightsView } from "./spec-highlights-view.ts";
import { renderGroupChips, renderGroupSections, renderNoMatches } from "./spec-groups-view.ts";
import { renderSpecPriceView } from "./spec-price-view.ts";
import { renderSpecSearchView } from "./spec-search-view.ts";
import { renderSpecSummaryView } from "./spec-summary-view.ts";

/**
 * The spec sheet content, host-agnostic: product summary, price, highlights, then searchable spec
 * groups. It is a size container (see spec-sheet.css) so it lays out for the width it is given, not
 * the viewport: the popup stays compact and the Quick Look card gets the web's wide layout. It does
 * not scroll itself; the host's scroll container is what the sticky search + chips stick inside.
 * Typing only swaps the count, chips and group nodes, so the input keeps focus.
 *
 * @example overlayBody.append(renderSpecSheetContent(dom, snapshot))
 */
export function renderSpecSheetContent(dom: Dom, snapshot: ProductSnapshot): HTMLElement {
  const content = dom.el("div", { className: "spec-content" }, [
    renderSpecSummaryView(dom, snapshot),
    renderSpecPriceView(dom, snapshot),
    ...renderSpecHighlightsView(dom, snapshot.highlights),
    renderSpecSheet(dom, snapshot.specGroups),
  ]);
  return dom.el("div", { className: "spec-view" }, [content]);
}

/**
 * The popup's spec view: the shared content inside a <main> that is the popup's scroll container.
 *
 * @example root.replaceChildren(renderShell(dom, { onBack, title: "Specifications" }, renderSpecSheetView(dom, snapshot)))
 */
export function renderSpecSheetView(dom: Dom, snapshot: ProductSnapshot): HTMLElement {
  return dom.el("main", { className: "body spec-body" }, [renderSpecSheetContent(dom, snapshot)]);
}

interface SheetSlots {
  count: HTMLElement;
  chips: HTMLElement;
  results: HTMLElement;
}

function renderSpecSheet(dom: Dom, groups: readonly SpecGroup[]): HTMLElement {
  const slots: SheetSlots = {
    count: dom.el("span", { className: "subtle" }),
    chips: dom.el("div", { className: "chips-slot" }),
    results: dom.el("div", { className: "groups-slot" }),
  };
  const repaint = (query: string): void => paintSheet(dom, groups, slots, query, clearSearch);
  const search = renderSpecSearchView(dom, repaint);
  const clearSearch = (): void => {
    search.input.value = "";
    repaint("");
    search.input.focus();
  };
  repaint("");
  return dom.el("section", { className: "spec-sheet", attrs: { "aria-labelledby": "spec-sheet-title" } }, [
    dom.el("div", { className: "spec-sheet-head" }, [
      dom.el("h2", { attrs: { id: "spec-sheet-title" }, text: "Specifications" }),
      slots.count,
    ]),
    dom.el("div", { className: "spec-sheet-tools" }, [search.element, slots.chips]),
    slots.results,
  ]);
}

/** Replaces only the count, chips and results; the search input is never touched. */
function paintSheet(
  dom: Dom,
  groups: readonly SpecGroup[],
  slots: SheetSlots,
  query: string,
  onClear: () => void,
): void {
  const visible = filterSpecGroups(groups, query);
  slots.count.textContent = specCountLabel(groups, visible, query);
  slots.chips.replaceChildren(...nodesOf(renderGroupChips(dom, visible)));
  slots.results.replaceChildren(...renderResults(dom, visible, query, onClear));
}

function nodesOf(node: HTMLElement | null): HTMLElement[] {
  return node === null ? [] : [node];
}

function renderResults(dom: Dom, visible: readonly SpecGroup[], query: string, onClear: () => void): HTMLElement[] {
  if (visible.length === 0) return [renderNoMatches(dom, query, onClear)];
  return [renderGroupSections(dom, visible)];
}
