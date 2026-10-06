import type { ProductSnapshot } from "@picky/catalog";

/** What the injected page script hands back to the service worker. Plain JSON: it crosses worlds. */
export type CaptureResult = { ok: true; snapshot: ProductSnapshot } | { ok: false; message: string };

// Set in the tab's isolated world by page-capture-entry.ts, called by ChromeBrowserPort.
declare global {
  var pickyCapturePage: (() => CaptureResult) | undefined;
}
