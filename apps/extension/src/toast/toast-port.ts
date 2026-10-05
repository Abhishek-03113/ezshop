import type { ToastMessage } from "./toast-message.ts";

/** Shows a toast in a tab; chrome-toast-port.ts implements it with chrome.scripting. Never throws. */
export interface ToastPort {
  show(tabId: number | null, message: ToastMessage): Promise<void>;
}

/**
 * ToastPort over chrome.scripting: injects toast.js (idempotent) then hands it the message. A tab that
 * cannot be scripted just gets no toast; the capture still completes.
 *
 * @example await new ChromeToastPort("toast.js", log).show(7, { kind: "failed", id: "1", reason: "offline" })
 */
export class ChromeToastPort implements ToastPort {
  constructor(
    private readonly toastScriptFile: string,
    private readonly log: (event: string, fields: Record<string, string | number>) => void,
  ) {}

  async show(tabId: number | null, message: ToastMessage): Promise<void> {
    if (tabId === null) return;
    try {
      await chrome.scripting.executeScript({ target: { tabId }, files: [this.toastScriptFile] });
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (toast: ToastMessage) => globalThis.ezshopToast?.(toast),
        args: [message],
      });
    } catch (error) {
      this.log("toast.failed", {
        tabId,
        kind: message.kind,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
