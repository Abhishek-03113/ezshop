import type { DecisionInputs, InferenceRunner } from "../../src/decisions/inference-runner.ts";

/** InferenceRunner returning canned logits and recording every call. */
export class FakeInferenceRunner implements InferenceRunner {
  readonly calls: DecisionInputs[] = [];

  constructor(private readonly logits: readonly number[]) {}

  async markerLogits(inputs: DecisionInputs): Promise<number[]> {
    this.calls.push(inputs);
    return [...this.logits];
  }
}
