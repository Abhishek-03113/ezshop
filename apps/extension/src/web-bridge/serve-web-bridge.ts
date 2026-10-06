import {
  WEB_BRIDGE_READY_ATTRIBUTE,
  isWebBridgeRequest,
  type WebBridgeReply,
  type WebBridgeRequest,
} from "@picky/catalog/web-bridge";
import type { ExtensionResponse } from "../messaging/messages.ts";

/** The slice of the web app's window the bridge uses, so tests can pass a fake. */
export interface BridgeWindow {
  addEventListener(type: "message", listener: (event: MessageEvent) => void): void;
  postMessage(message: WebBridgeReply, targetOrigin: string): void;
  location: { origin: string };
  document: { documentElement: { setAttribute(name: string, value: string): void } };
}

/** Asks the worker to save a product link; the answer's body is the stored product's id. */
export type ImportLinkInWorker = (url: string) => Promise<ExtensionResponse<string> | undefined>;

/**
 * Marks the web app as extension-enabled and relays its "import this link" requests to the worker,
 * posting each answer back under the request's id. Only same-window, same-origin messages are served.
 *
 * @example serveWebBridge(window, (url) => chrome.runtime.sendMessage({ type: "web:import-link", url }))
 */
export function serveWebBridge(win: BridgeWindow, importLink: ImportLinkInWorker): void {
  win.document.documentElement.setAttribute(WEB_BRIDGE_READY_ATTRIBUTE, "ready");
  win.addEventListener("message", (event) => {
    if (event.source !== win || event.origin !== win.location.origin) return;
    if (!isWebBridgeRequest(event.data)) return;
    void answer(win, event.data, importLink);
  });
}

async function answer(win: BridgeWindow, request: WebBridgeRequest, importLink: ImportLinkInWorker): Promise<void> {
  const response = await importLink(request.url).catch((error: unknown) => ({
    ok: false as const,
    message: error instanceof Error ? error.message : String(error),
  }));
  win.postMessage(replyFor(request.requestId, response), win.location.origin);
}

function replyFor(requestId: string, response: ExtensionResponse<string> | undefined): WebBridgeReply {
  const channel = "picky:extension-to-web";
  if (response === undefined) return { channel, requestId, ok: false, message: "The Picky extension did not answer" };
  if (!response.ok) return { channel, requestId, ok: false, message: response.message };
  return { channel, requestId, ok: true, productId: response.body };
}
