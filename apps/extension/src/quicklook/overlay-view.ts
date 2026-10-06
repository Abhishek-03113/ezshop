import { Dom } from "../popup/dom.ts";
import { footerView } from "./footer-view.ts";
import { headerView } from "./header-view.ts";
import { matrixView } from "./matrix-view.ts";
import { emptyComparisonView, emptyView, failedView, loadingView } from "./notice-view.ts";
import type { OverlayActions } from "./overlay-actions.ts";
import { renderSpecSheetContent } from "../popup/specs/spec-sheet-view.ts";
import { showsSpecs, thisPageColumn, type QuickLookModel } from "./quicklook-model.ts";

function bodyContent(dom: Dom, model: QuickLookModel, actions: OverlayActions): HTMLElement {
  // The page snapshot is already in the model, so specs render without waiting for the comparison API.
  if (model.pageSnapshot !== null && showsSpecs(model)) return renderSpecSheetContent(dom, model.pageSnapshot);
  if (model.status === "loading") return loadingView(dom);
  if (model.status === "failed") return failedView(dom, model.message ?? "unknown error", actions);
  const state = model.state;
  if (state === null || state.comparisons.length === 0) return emptyView(dom, model, actions);
  const hasProducts = state.products.length > 0 || thisPageColumn(model) !== null;
  return hasProducts ? matrixView(dom, model, actions) : emptyComparisonView(dom);
}

function errorBanner(dom: Dom, model: QuickLookModel): HTMLElement[] {
  if (model.status !== "ready" || model.message === null || showsSpecs(model)) return [];
  return [dom.el("p", { className: "banner", text: model.message, attrs: { role: "alert" } })];
}

/**
 * The whole Quick Look dialog (backdrop + card) for a model. Pure: same model, same DOM.
 *
 * `entering` adds the open animation. Every model change re-renders the whole dialog, so animating on each
 * render made the card flash twice per "Add" click (busy, then result); only the first render may animate.
 *
 * @example container.replaceChildren(overlayView(dom, model, actions, true))
 */
export function overlayView(dom: Dom, model: QuickLookModel, actions: OverlayActions, entering = false): HTMLElement {
  const label =
    model.state?.comparisons.find((comparison) => comparison.id === model.state?.selectedId)?.name ?? "comparison";
  const backdrop = dom.el("div", { className: "backdrop", attrs: { "aria-hidden": "true" } });
  backdrop.addEventListener("click", () => actions.close());
  const body = dom.el("div", { className: "body" }, [...errorBanner(dom, model), bodyContent(dom, model, actions)]);
  // tabindex -1 + data-focus: the card takes initial focus, so Return reaches "add this page"
  // instead of activating whichever button would otherwise be focused first.
  const cardAttrs = { role: "dialog", "aria-modal": "true", "aria-label": `Quick Look: ${label}`, tabindex: "-1" };
  const card = dom.el("section", { className: "card", attrs: { ...cardAttrs, "data-focus": "dialog" } }, [
    headerView(dom, model, actions),
    body,
    footerView(dom, model),
  ]);
  return dom.el("div", { className: entering ? "layer entering" : "layer" }, [backdrop, card]);
}
