import type { Dom } from "./dom.ts";
import { renderNoticeView } from "./notice-view.ts";
import { renderLibraryButton } from "./unsupported-view.ts";

export interface ErrorHandlers {
  onRetry: () => void;
}

/**
 * "Couldn't save this product" board, styled like the Unsupported one, with Try again.
 *
 * @example renderErrorView(dom, "HTTP 500", "http://localhost:5173", { onRetry })
 */
export function renderErrorView(dom: Dom, message: string, webBaseUrl: string, handlers: ErrorHandlers): HTMLElement {
  const retry = dom.el("button", { className: "button button-primary", attrs: { type: "button" }, text: "Try again" });
  retry.addEventListener("click", handlers.onRetry);
  const model = {
    icon: "alert",
    title: "Couldn't save this product",
    body: "Something went wrong reading or saving this page. Give it another try.",
    detail: message,
  } as const;
  return renderNoticeView(dom, model, [], [retry, renderLibraryButton(dom, webBaseUrl)]);
}
