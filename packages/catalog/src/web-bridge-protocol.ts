// window.postMessage protocol between the Picky web app and the extension's bridge content script.
// The web app cannot fetch Amazon/Flipkart itself (CORS, bot checks), so it asks the extension to
// download a product link with the user's cookies, parse it and save it. Exported as "@picky/catalog/web-bridge"
// (not from the index) so the bridge content script stays tiny: no zod or extractors.

/** Set on <html> by the bridge at document_start, so the web app knows the extension is there before it renders. */
export const WEB_BRIDGE_READY_ATTRIBUTE = "data-picky-extension";

/** Web app → extension: import this product link into the library. */
export interface WebBridgeRequest {
  channel: "picky:web-to-extension";
  requestId: string;
  type: "import-link";
  url: string;
}

/** Extension → web app: the answer to the request with the same `requestId`; `productId` is the saved product. */
export type WebBridgeReply = { channel: "picky:extension-to-web"; requestId: string } & (
  { ok: true; productId: string } | { ok: false; message: string }
);

/**
 * True for a well-formed web app request (anything on the page can post messages, so every field is checked).
 *
 * @example isWebBridgeRequest({ channel: "picky:web-to-extension", requestId: "r1", type: "import-link", url: "https://…" }) // true
 */
export function isWebBridgeRequest(message: unknown): message is WebBridgeRequest {
  const candidate = message as Partial<WebBridgeRequest> | null;
  return (
    candidate?.channel === "picky:web-to-extension" &&
    candidate.type === "import-link" &&
    typeof candidate.requestId === "string" &&
    typeof candidate.url === "string"
  );
}

/**
 * True for an extension reply to a web app request.
 *
 * @example isWebBridgeReply({ channel: "picky:extension-to-web", requestId: "r1", ok: false, message: "…" }) // true
 */
export function isWebBridgeReply(message: unknown): message is WebBridgeReply {
  const candidate = message as Partial<WebBridgeReply> | null;
  return candidate?.channel === "picky:extension-to-web" && typeof candidate.requestId === "string";
}
