import { capturePage } from "../capture-page.ts";
import type { CaptureResult } from "../capture-result.ts";

/** The slice of DOMParser we use, so tests can pass a happy-dom parser. */
export interface HtmlDocumentParser {
  parseFromString(html: string, mimeType: "text/html"): Document;
}

/**
 * Parses fetched HTML into a DOM (scripts never run, nothing is loaded) and extracts the product snapshot
 * with the same extractor the live-page capture uses.
 *
 * @example parseProductHtml(new DOMParser(), html, "https://www.amazon.in/dp/B0FQG1YHYR", new Date())
 */
export function parseProductHtml(
  parser: HtmlDocumentParser,
  html: string,
  url: string,
  capturedAt: Date,
): CaptureResult {
  return capturePage(parser.parseFromString(html, "text/html"), url, capturedAt);
}
