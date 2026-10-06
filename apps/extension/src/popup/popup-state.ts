import type { CaptureOutcome, CapturePhase, SavedSummary } from "../capture-outcome.ts";

export type PopupState =
  | { kind: "welcome" }
  | { kind: "capturing"; phase: CapturePhase }
  | { kind: "saved"; summary: SavedSummary }
  | { kind: "specs"; summary: SavedSummary }
  | { kind: "unsupported" }
  | { kind: "failed"; message: string };

/**
 * Maps the capture result onto the popup screen to show. Mirrors the toolbar badge:
 * saved = check, unsupported = "?", failed = "!".
 *
 * @example stateFromOutcome({ kind: "unsupported" }) // { kind: "unsupported" }
 */
export function stateFromOutcome(outcome: CaptureOutcome): PopupState {
  if (outcome.kind === "saved") return { kind: "saved", summary: outcome.summary };
  if (outcome.kind === "failed") return { kind: "failed", message: outcome.message };
  return { kind: "unsupported" };
}
