import { capturePage } from "./capture-page.ts";

// Injected into the product tab by the service worker. It only registers the capture function;
// the worker then calls it with a second executeScript in the same isolated world.
globalThis.pickyCapturePage = () => capturePage(document, location.href, new Date());
