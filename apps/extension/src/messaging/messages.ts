import type { CatalogComparisonSummary, CatalogProduct, ProductSnapshot } from "@picky/catalog";

/** What Quick Look shows: every comparison, the selected one in full. Plain JSON: it crosses worlds. */
export interface QuickLookState {
  comparisons: CatalogComparisonSummary[];
  selectedId: string | null;
  products: CatalogProduct[];
  webBaseUrl: string;
}

/** Content script (Quick Look overlay) → service worker. The worker owns all API access, so page CORS never applies. */
export type QuickLookRequest =
  | { type: "quicklook:init" }
  | { type: "quicklook:select"; comparisonId: string }
  /** `comparisonId: null` creates a comparison (named after the snapshot's category) and adds the page to it. */
  | { type: "quicklook:add"; comparisonId: string | null; snapshot: ProductSnapshot }
  | { type: "quicklook:remove"; comparisonId: string; productId: string };

/** Alt+click on a product link (content script) → service worker. */
export interface LinkAddRequest {
  type: "link:add";
  url: string;
  label: string;
}

/** Web app bridge (content script on the Picky web app) → service worker: import a pasted product link. */
export interface WebImportRequest {
  type: "web:import-link";
  url: string;
}

/** Toast buttons → service worker. */
export type ToastActionRequest =
  { type: "toast:quicklook" } | { type: "toast:undo"; comparisonId: string; productId: string };

export type ExtensionRequest = QuickLookRequest | LinkAddRequest | WebImportRequest | ToastActionRequest;

export type ExtensionResponse<Body> = { ok: true; body: Body } | { ok: false; message: string };

const REQUEST_TYPES: ReadonlySet<string> = new Set([
  "quicklook:init",
  "quicklook:select",
  "quicklook:add",
  "quicklook:remove",
  "link:add",
  "web:import-link",
  "toast:quicklook",
  "toast:undo",
]);

/**
 * Shallow check that an incoming runtime message is one of ours (field shapes are trusted: only our own
 * scripts can message the worker).
 *
 * @example isExtensionRequest({ type: "quicklook:init" }) // true
 */
export function isExtensionRequest(message: unknown): message is ExtensionRequest {
  if (typeof message !== "object" || message === null) return false;
  const type = (message as { type?: unknown }).type;
  return typeof type === "string" && REQUEST_TYPES.has(type);
}
