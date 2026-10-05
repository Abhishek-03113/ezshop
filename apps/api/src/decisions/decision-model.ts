import type { DecisionQuestion } from "./decision-question.ts";

export interface DecisionAnswer {
  /** The most probable answer label. */
  label: string;
  /** Calibrated probability of `label`. */
  probability: number;
  /** Calibrated probability per answer label; sums to 1. */
  probabilities: Readonly<Record<string, number>>;
}

/** ezshop's interface over the Laya decision model; the HTTP layer and tests only see this. */
export interface DecisionModel {
  decide(state: string, question: DecisionQuestion): Promise<DecisionAnswer>;
}

/** The model could not score the question (bad input shape, runtime failure). */
export class DecisionError extends Error {
  override readonly name = "DecisionError";
}
