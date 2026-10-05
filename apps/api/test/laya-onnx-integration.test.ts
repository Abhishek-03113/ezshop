import { describe, expect, test } from "bun:test";
import { loadLayaDecisionModel } from "../src/decisions/load-laya-model.ts";

// Needs the 850 MB export from onnx-community/laya-ONNX: DECISION_MODEL_DIR=<dir> bun run test
const modelDir = Bun.env.DECISION_MODEL_DIR;

describe.skipIf(!modelDir)("real Laya ONNX model", () => {
  test("routes a double-billing complaint to billing", async () => {
    const model = await loadLayaDecisionModel(modelDir ?? "");
    const answer = await model.decide("Hi, we were billed twice for March. Please refund the duplicate.", {
      kind: "choice",
      instruction: "Which department should handle this?",
      options: { billing: "invoices, payments, refunds", technical: "bugs, outages, system errors", other: "" },
    });
    expect(answer.label).toBe("billing");
    expect(answer.probability).toBeGreaterThan(0.5);
  }, 60_000);
});
