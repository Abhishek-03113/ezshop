import { Dom } from "../popup/dom.ts";
import type { ToastActionRequest } from "../messaging/messages.ts";
import type { ToastMessage } from "./toast-message.ts";
import { toastView } from "./toast-view.ts";

const AUTO_DISMISS_MS: Readonly<Record<ToastMessage["kind"], number | null>> = {
  reading: null,
  added: 9000,
  failed: 12000,
};

type SendAction = (request: ToastActionRequest) => void;

/**
 * The toast stack in a closed shadow root. Showing a message with an existing id replaces that toast,
 * so "Reading…" becomes its result in place.
 *
 * @example const toasts = new ToastStack(stackElement, send); toasts.show(message)
 */
export class ToastStack {
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly dom: Dom;

  constructor(
    private readonly stack: HTMLElement,
    private readonly send: SendAction,
  ) {
    this.dom = new Dom(stack.ownerDocument);
  }

  show(message: ToastMessage): void {
    this.remove(message.id);
    const card = toastView(this.dom, message, {
      openQuickLook: () => this.send({ type: "toast:quicklook" }),
      undo: (comparisonId, productId) => {
        this.send({ type: "toast:undo", comparisonId, productId });
        this.remove(message.id);
      },
      dismiss: () => this.remove(message.id),
    });
    this.stack.append(card);
    const delay = AUTO_DISMISS_MS[message.kind];
    if (delay !== null)
      this.timers.set(
        message.id,
        setTimeout(() => this.remove(message.id), delay),
      );
  }

  remove(id: string): void {
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
    this.stack.querySelector(`[data-toast-id="${id}"]`)?.remove();
  }
}
