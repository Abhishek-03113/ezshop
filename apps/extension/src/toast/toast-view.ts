import { Dom } from "../popup/dom.ts";
import { addedDetail, type ToastMessage } from "./toast-message.ts";

export interface ToastActions {
  openQuickLook(): void;
  undo(comparisonId: string, productId: string): void;
  dismiss(): void;
}

function lines(dom: Dom, title: string, detail: string, extra: readonly Node[] = []): HTMLElement {
  return dom.el("div", { className: "toast-text" }, [
    dom.el("p", { className: "toast-title", text: title }),
    dom.el("p", { className: "toast-detail", text: detail }),
    ...extra,
  ]);
}

function linkButton(dom: Dom, label: string, onClick: () => void): HTMLElement {
  const button = dom.el("button", { className: "toast-action", text: label, attrs: { type: "button" } });
  button.addEventListener("click", onClick);
  return button;
}

function badge(dom: Dom, kind: "spin" | "ok" | "fail"): HTMLElement {
  const icon = kind === "spin" ? "spinner" : kind === "ok" ? "check" : "alert";
  return dom.el("span", { className: `toast-badge toast-badge-${kind}`, attrs: { "aria-hidden": "true" } }, [
    dom.icon(icon, "toast-icon"),
  ]);
}

function addedToast(dom: Dom, message: Extract<ToastMessage, { kind: "added" }>, actions: ToastActions): HTMLElement[] {
  const { undo } = message;
  const buttons = [linkButton(dom, "Quick Look", () => actions.openQuickLook())];
  if (undo !== null) buttons.push(linkButton(dom, "Undo", () => actions.undo(undo.comparisonId, undo.productId)));
  const row = dom.el("div", { className: "toast-actions" }, buttons);
  return [badge(dom, "ok"), lines(dom, `Added ${message.title}`, addedDetail(message), [row])];
}

/**
 * One toast card for a message: spinner while reading, a check with Quick Look / Undo when added,
 * an alert with the reason when failed.
 *
 * @example stack.append(toastView(dom, message, actions))
 */
export function toastView(dom: Dom, message: ToastMessage, actions: ToastActions): HTMLElement {
  const content = toastContent(dom, message, actions);
  const card = dom.el("div", { className: "toast", attrs: { "data-toast-id": message.id } }, content);
  if (message.kind === "failed") card.append(linkButton(dom, "Dismiss", () => actions.dismiss()));
  return card;
}

function toastContent(dom: Dom, message: ToastMessage, actions: ToastActions): Node[] {
  if (message.kind === "added") return addedToast(dom, message, actions);
  if (message.kind === "failed") return [badge(dom, "fail"), lines(dom, "Could not add that product", message.reason)];
  return [
    badge(dom, "spin"),
    lines(dom, `Reading ${message.title}…`, `Into ${message.destination} · stay on this page`),
  ];
}
