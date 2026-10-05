import { extractProductSnapshot } from "@ezshop/catalog";
import { wrapDomDocument } from "@ezshop/catalog/dom";
import type { CaptureResult } from "./capture-result.ts";

/**
 * Reads the live product page into a snapshot. Never throws: failures come back as a message,
 * because an exception inside an injected script reaches the service worker as an opaque error.
 *
 * @example capturePage(document, location.href, new Date())
 */
export function capturePage(document: Document, pageUrl: string, capturedAt: Date): CaptureResult {
  try {
    return { ok: true, snapshot: extractProductSnapshot(wrapDomDocument(document), pageUrl, capturedAt) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}
