import type { CaptureResult } from "../capture-result.ts";

/** Service worker → offscreen document: parse this HTML. `target` keeps other listeners from answering it. */
export interface ParseProductRequest {
  target: "offscreen";
  type: "parse-product";
  html: string;
  url: string;
}

export type ParseProductResponse = CaptureResult;

/**
 * True for a message addressed to the offscreen parser.
 *
 * @example isParseProductRequest({ target: "offscreen", type: "parse-product", html: "", url: "" }) // true
 */
export function isParseProductRequest(message: unknown): message is ParseProductRequest {
  const candidate = message as Partial<ParseProductRequest> | null;
  return candidate?.target === "offscreen" && candidate.type === "parse-product";
}
