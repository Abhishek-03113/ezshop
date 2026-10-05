import { describe, expect, test } from "bun:test";
import { DecisionError } from "../src/decisions/decision-model.ts";
import { OnnxDecisionModel } from "../src/decisions/onnx-decision-model.ts";
import { FakeInferenceRunner } from "./fakes/fake-inference-runner.ts";
import { FakeTokenizer } from "./fakes/fake-tokenizer.ts";

const config = {
  limits: { maxLen: 512, headMaxLen: 192 },
  calibration: { temperature: [1, 1, 1], temperatureByOptions: {} },
};
const question = {
  kind: "choice" as const,
  instruction: "Which team",
  options: { billing: "", technical: "", other: "" },
};

describe("OnnxDecisionModel", () => {
  test("answers with the top label and a probability per label", async () => {
    const runner = new FakeInferenceRunner([6.85, -2.32, -1.95]);
    const answer = await new OnnxDecisionModel(new FakeTokenizer(), runner, config).decide("billed twice", question);
    expect(answer.label).toBe("billing");
    expect(Object.keys(answer.probabilities)).toEqual(["billing", "technical", "other"]);
    expect(answer.probability).toBe(answer.probabilities["billing"] ?? -1);
  });

  test("passes the question type id and one marker per option to the runner", async () => {
    const runner = new FakeInferenceRunner([0, 1]);
    const model = new OnnxDecisionModel(new FakeTokenizer(), runner, config);
    const answer = await model.decide("s", { kind: "noul", instruction: "Refund?" });
    expect(answer.label).toBe("true");
    expect(runner.calls[0]?.typeId).toBe(2);
    expect(runner.calls[0]?.markers).toHaveLength(2);
  });

  test("fails with the offending counts when options do not fit", async () => {
    const tight = { ...config, limits: { maxLen: 9, headMaxLen: 192 } };
    const model = new OnnxDecisionModel(new FakeTokenizer(), new FakeInferenceRunner([0, 0, 0]), tight);
    await expect(model.decide("s", question)).rejects.toThrow(DecisionError);
    await expect(model.decide("s", question)).rejects.toThrow("of 3 option markers fit in 9 tokens");
  });
});
