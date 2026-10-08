import {
  WEB_BRIDGE_READY_ATTRIBUTE,
  isWebBridgeReply,
  type WebBridgeReply,
  type WebBridgeRequest,
} from "@picky/catalog/web-bridge";

/**
 * Adds products by link through the Picky extension: the page cannot fetch Amazon/Flipkart itself,
 * so the extension downloads the link with the user's cookies, parses it and saves it.
 */
export interface ExtensionBridge {
  /** True when the extension's bridge script is running on this page. */
  isAvailable(): boolean;
  /** Saves a product link to the library and returns the product's id. Throws with the extension's reason. */
  importLink(url: string): Promise<string>;
}

/** The slice of window the bridge uses, so tests can pass a fake. */
export interface BridgeHostWindow {
  addEventListener(type: "message", listener: (event: MessageEvent) => void): void;
  removeEventListener(type: "message", listener: (event: MessageEvent) => void): void;
  postMessage(message: WebBridgeRequest, targetOrigin: string): void;
  location: { origin: string };
  document: { documentElement: { hasAttribute(name: string): boolean } };
}

// Downloading and parsing a product page takes a few seconds; this only catches a dead extension.
const IMPORT_TIMEOUT_MS = 60_000;

/**
 * ExtensionBridge over window.postMessage, answered by the extension's content script on this origin.
 *
 * @example const productId = await createWindowExtensionBridge(window, () => crypto.randomUUID()).importLink(url)
 */
export function createWindowExtensionBridge(
  win: BridgeHostWindow,
  newRequestId: () => string,
  timeoutMs = IMPORT_TIMEOUT_MS,
): ExtensionBridge {
  return {
    isAvailable: () => win.document.documentElement.hasAttribute(WEB_BRIDGE_READY_ATTRIBUTE),
    importLink: (url) => {
      const requestId = newRequestId();
      const reply = awaitReply(win, requestId, timeoutMs);
      win.postMessage({ channel: "picky:web-to-extension", requestId, type: "import-link", url }, win.location.origin);
      return reply;
    },
  };
}

function awaitReply(win: BridgeHostWindow, requestId: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const finish = (settle: () => void) => {
      clearTimeout(timer);
      win.removeEventListener("message", listener);
      settle();
    };
    const listener = (event: MessageEvent) => {
      if (event.source !== win || !isWebBridgeReply(event.data) || event.data.requestId !== requestId) return;
      const reply: WebBridgeReply = event.data;
      finish(() => (reply.ok ? resolve(reply.productId) : reject(new Error(reply.message))));
    };
    const timer = setTimeout(
      () => finish(() => reject(new Error(`The Picky extension did not answer within ${timeoutMs / 1000} s`))),
      timeoutMs,
    );
    win.addEventListener("message", listener);
  });
}
