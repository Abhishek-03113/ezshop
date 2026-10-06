import type { ContentfulStatusCode } from "hono/utils/http-status";
import { DecisionError } from "../decisions/decision-model.ts";
import { InvalidSnapshotError } from "../products/product-ingestion.ts";

/** The request body is missing, not JSON, or the wrong shape. */
export class BadRequestError extends Error {
  override readonly name = "BadRequestError";
}

export interface ErrorResponse {
  status: ContentfulStatusCode;
  body: { error: string; message: string; issues?: readonly string[] };
}

// Ordered: first matching class wins. Anything unmatched is a 500 with a generic message.
const STATUS_BY_ERROR: readonly [new (...args: never[]) => Error, ContentfulStatusCode][] = [
  [BadRequestError, 400],
  [InvalidSnapshotError, 400],
  [DecisionError, 422],
];

/**
 * Maps a thrown error to the HTTP response clients see. Unknown errors never leak their message.
 *
 * @example toErrorResponse(new BadRequestError("no body")).status // 400
 */
export function toErrorResponse(error: Error): ErrorResponse {
  const status = STATUS_BY_ERROR.find(([errorClass]) => error instanceof errorClass)?.[1];
  if (status === undefined) {
    return { status: 500, body: { error: "InternalError", message: "Unexpected server error" } };
  }
  const issues = error instanceof InvalidSnapshotError ? error.issues : undefined;
  return { status, body: { error: error.name, message: error.message, issues } };
}
