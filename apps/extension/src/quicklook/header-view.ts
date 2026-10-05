import { Dom } from "../popup/dom.ts";
import type { OverlayActions } from "./overlay-actions.ts";
import { thisPageColumn, type QuickLookModel } from "./quicklook-model.ts";

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

function modeButton(dom: Dom, label: string, checked: boolean, onPick: () => void): HTMLElement {
  const button = dom.el("button", {
    className: "segment",
    text: label,
    attrs: { type: "button", role: "radio", "aria-checked": String(checked), "data-focus": `mode-${label}` },
  });
  button.addEventListener("click", onPick);
  return button;
}

function modeControl(dom: Dom, differencesOnly: boolean, actions: OverlayActions): HTMLElement {
  return dom.el("div", { className: "segmented", attrs: { role: "radiogroup", "aria-label": "Rows" } }, [
    modeButton(dom, "Differences", differencesOnly, () => actions.setDifferencesOnly(true)),
    modeButton(dom, "All specs", !differencesOnly, () => actions.setDifferencesOnly(false)),
  ]);
}

function subtitle(model: QuickLookModel): string {
  const saved = model.state?.products.length ?? 0;
  return thisPageColumn(model) === null ? `${saved} saved` : `${saved} saved · comparing with this page`;
}

/**
 * Dialog header: comparison picker, saved-count line, Differences | All specs switch and the close button.
 * With no comparisons yet only the close button remains.
 *
 * @example headerView(dom, model, actions)
 */
export function headerView(dom: Dom, model: QuickLookModel, actions: OverlayActions): HTMLElement {
  const hasComparisons = (model.state?.comparisons.length ?? 0) > 0;
  const close = dom.el(
    "button",
    { className: "close", attrs: { type: "button", "aria-label": "Close Quick Look", "data-focus": "close" } },
    [dom.icon("close", "icon-close")],
  );
  close.addEventListener("click", () => actions.close());
  const parts = hasComparisons
    ? [
        comparisonPicker(dom, model, actions),
        dom.el("span", { className: "subtitle", text: subtitle(model) }),
        modeControl(dom, model.differencesOnly, actions),
      ]
    : [dom.el("h2", { className: "title", text: "Quick Look" }), dom.el("span", { className: "grow" })];
  return dom.el("header", { className: "header" }, [...parts, close]);
}
