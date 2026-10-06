import type { QuickLookView } from "./quicklook-model.ts";
import { installQuickLook } from "./overlay-host.ts";

// Injected into the active tab by the service worker (classic IIFE, like page-capture.js). Replaced at build time
// by build.ts (Bun.build `define`): tokens + quicklook.css as one string for the closed shadow root.
declare const __PICKY_QUICKLOOK_CSS__: string;

declare global {
  var pickyQuickLookToggle: ((view: QuickLookView) => void) | undefined;
}

// A second injection (the user clicked again after the first) must not stack a second overlay.
globalThis.pickyQuickLookToggle ??= installQuickLook(document, __PICKY_QUICKLOOK_CSS__);
