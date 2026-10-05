import { calibratedProbabilities } from "./calibration.ts";
import { DecisionError, type DecisionAnswer, type DecisionModel } from "./decision-model.ts";
import { MODEL_TYPE_ID, answerLabels, type DecisionQuestion } from "./decision-question.ts";
import type { InferenceRunner } from "./inference-runner.ts";
import type { LayaConfig } from "./laya-config.ts";
import { buildSequence } from "./sequence-builder.ts";
import type { TokenizerPort } from "./tokenizer-port.ts";

/**
 * Laya served from its ONNX export: build the input sequence, run one forward pass, calibrate.
 *
 * @example await model.decide("charged twice", { kind: "noul", instruction: "Does the user want a refund?" })
 */
export class OnnxDecisionModel implements DecisionModel {
  constructor(
    private readonly tokenizer: TokenizerPort,
    private readonly runner: InferenceRunner,
    private readonly config: LayaConfig,
  ) {}

  async decide(state: string, question: DecisionQuestion): Promise<DecisionAnswer> {
    const labels = answerLabels(question);
    const { ids, markers } = buildSequence(this.tokenizer, state, question, this.config.limits);
    if (markers.length !== labels.length) {
      throw new DecisionError(
        `Only ${markers.length} of ${labels.length} option markers fit in ${this.config.limits.maxLen} tokens for ${question.kind} question "${question.instruction}"; shorten the options`,
      );
    }
    const logits = await this.runner.markerLogits({ ids, markers, typeId: MODEL_TYPE_ID[question.kind] });
    return toAnswer(labels, calibratedProbabilities(logits, question.kind, this.config.calibration));
  }
}

function toAnswer(labels: readonly string[], probabilities: readonly number[]): DecisionAnswer {
  const best = probabilities.indexOf(Math.max(...probabilities));
  return {
    label: labels[best] ?? "",
    probability: probabilities[best] ?? 0,
    probabilities: Object.fromEntries(labels.map((label, index) => [label, probabilities[index] ?? 0])),
  };
}
