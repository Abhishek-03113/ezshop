import type { ProductSnapshot } from "@ezshop/catalog";

/** What the injected page script hands back to the service worker. Plain JSON: it crosses worlds. */
export type CaptureResult = { ok: true; snapshot: ProductSnapshot } | { ok: false; message: string };

// Set in the tab's isolated world by page-capture-entry.ts, called by ChromeBrowserPort.
declare global {
  var ezshopCapturePage: (() => CaptureResult) | undefined;
}
