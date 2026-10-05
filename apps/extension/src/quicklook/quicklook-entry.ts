import { installQuickLook } from "./overlay-host.ts";

// Injected into the active tab by the service worker (classic IIFE, like page-capture.js). Replaced at build time
// by build.ts (Bun.build `define`): tokens + quicklook.css as one string for the closed shadow root.
declare const __EZSHOP_QUICKLOOK_CSS__: string;

declare global {
  var ezshopQuickLookToggle: (() => void) | undefined;
}

// A second injection (the user clicked again after the first) must not stack a second overlay.
globalThis.ezshopQuickLookToggle ??= installQuickLook(document, __EZSHOP_QUICKLOOK_CSS__);
