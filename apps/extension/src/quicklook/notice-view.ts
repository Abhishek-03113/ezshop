import { Dom } from "../popup/dom.ts";
import type { OverlayActions } from "./overlay-actions.ts";
import { thisPageColumn, type QuickLookModel } from "./quicklook-model.ts";

function notice(dom: Dom, title: string, detail: string, action: HTMLElement | null): HTMLElement {
  const children = [
    dom.el("p", { className: "notice-title", text: title }),
    dom.el("p", { className: "notice-detail", text: detail }),
  ];
  return dom.el("div", { className: "notice" }, action === null ? children : [...children, action]);
}

function actionButton(dom: Dom, label: string, focusId: string, onClick: () => void): HTMLElement {
  const button = dom.el("button", {
    className: "add add-wide",
    text: label,
    attrs: { type: "button", "data-focus": focusId },
  });
  button.addEventListener("click", onClick);
  return button;
}

/** Shown while the first load is in flight. */
export function loadingView(dom: Dom): HTMLElement {
  return dom.el("div", { className: "notice", attrs: { role: "status" } }, [
    dom.icon("spinner", "icon-spin"),
    "Loading your comparisons…",
  ]);
}

/** Shown when the first load failed; `message` is the worker's reason. */
export function failedView(dom: Dom, message: string, actions: OverlayActions): HTMLElement {
  return notice(
    dom,
    "Quick Look could not load",
    message,
    actionButton(dom, "Try again", "retry", () => actions.retry()),
  );
}

/**
 * No comparisons yet. On a product page the button creates one from it (named after its category);
 * elsewhere there is nothing to add.
 *
 * @example emptyView(dom, model, actions)
 */
export function emptyView(dom: Dom, model: QuickLookModel, actions: OverlayActions): HTMLElement {
  if (thisPageColumn(model) === null) {
    return notice(
      dom,
      "No comparisons yet",
      "Open a product page on Amazon.in or Flipkart and press Quick Look to start one.",
      null,
    );
  }
  const button = actionButton(dom, "Add this page to start a comparison", "add-page", () => actions.addPage());
  button.toggleAttribute("disabled", model.busy);
  return notice(dom, "No comparisons yet", "Save this page and it becomes your first comparison.", button);
}

/** A comparison with nothing saved and no product on this page. */
export function emptyComparisonView(dom: Dom): HTMLElement {
  return notice(dom, "Nothing saved here yet", "Open a product page and press Quick Look to add it.", null);
}
