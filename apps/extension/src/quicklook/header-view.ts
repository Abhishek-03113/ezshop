import { Dom } from "../popup/dom.ts";
import type { OverlayActions } from "./overlay-actions.ts";
import { showsSpecs, thisPageColumn, type QuickLookModel, type QuickLookView } from "./quicklook-model.ts";

function comparisonPicker(dom: Dom, model: QuickLookModel, actions: OverlayActions): HTMLElement {
  const state = model.state;
  const select = dom.el("select", {
    className: "picker",
    attrs: { "aria-label": "Comparison", "data-focus": "picker" },
  });
  for (const comparison of state?.comparisons ?? []) {
    const option = dom.el("option", { text: comparison.name, attrs: { value: comparison.id } });
    option.selected = comparison.id === state?.selectedId;
    select.append(option);
  }
  select.disabled = model.busy;
  select.addEventListener("change", () => actions.select(select.value));
  return dom.el("span", { className: "picker-wrap" }, [select, dom.icon("chevronDown", "icon-picker")]);
}

function segmentButton(dom: Dom, focusKey: string, label: string, checked: boolean, onPick: () => void): HTMLElement {
  const button = dom.el("button", {
    className: "segment",
    text: label,
    attrs: { type: "button", role: "radio", "aria-checked": String(checked), "data-focus": `${focusKey}-${label}` },
  });
  button.addEventListener("click", onPick);
  return button;
}

/**
 * Top-level Specs | Compare switch. Its data-focus keys survive the re-render a switch causes, so
 * keyboard focus stays on the segment that was just activated.
 */
function viewControl(dom: Dom, view: QuickLookView, actions: OverlayActions): HTMLElement {
  const attrs = { role: "radiogroup", "aria-label": "View" };
  return dom.el("div", { className: "segmented segmented-view", attrs }, [
    segmentButton(dom, "view", "Specs", view === "specs", () => actions.setView("specs")),
    segmentButton(dom, "view", "Compare", view === "compare", () => actions.setView("compare")),
  ]);
}

function subtitle(model: QuickLookModel): string {
  const saved = model.state?.products.length ?? 0;
  return thisPageColumn(model) === null ? `${saved} saved` : `${saved} saved · comparing with this page`;
}

function comparisonControls(dom: Dom, model: QuickLookModel, actions: OverlayActions): HTMLElement[] {
  const hasComparisons = (model.state?.comparisons.length ?? 0) > 0;
  if (!hasComparisons)
    return [dom.el("h2", { className: "title", text: "Quick Look" }), dom.el("span", { className: "grow" })];
  return [
    comparisonPicker(dom, model, actions),
    dom.el("span", { className: "subtitle", text: subtitle(model) }),
    dom.el("span", { className: "grow" }),
  ];
}

/**
 * Dialog header: the Specs | Compare switch (only on a product page), then either the comparison
 * picker and saved-count line, or, in the specs view, just a spacer;
 * the close button always ends it. With no comparisons yet the title stands in for the picker.
 *
 * @example headerView(dom, model, actions)
 */
export function headerView(dom: Dom, model: QuickLookModel, actions: OverlayActions): HTMLElement {
  const close = dom.el(
    "button",
    { className: "close", attrs: { type: "button", "aria-label": "Close Quick Look", "data-focus": "close" } },
    [dom.icon("close", "icon-close")],
  );
  close.addEventListener("click", () => actions.close());
  const hasPage = model.pageSnapshot !== null;
  const switcher = hasPage ? [viewControl(dom, model.view, actions)] : [];
  const rest = showsSpecs(model) ? [dom.el("span", { className: "grow" })] : comparisonControls(dom, model, actions);
  return dom.el("header", { className: "header" }, [...switcher, ...rest, close]);
}
