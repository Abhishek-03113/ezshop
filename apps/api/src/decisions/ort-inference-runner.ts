import * as ort from "onnxruntime-node";
import type { DecisionInputs, InferenceRunner } from "./inference-runner.ts";

const toInt64 = (values: readonly number[]): BigInt64Array => BigInt64Array.from(values, BigInt);

/** InferenceRunner over onnxruntime-node (CPU), for the single-graph export with input_ids/marker_pos/qtype. */
export class OrtInferenceRunner implements InferenceRunner {
  private constructor(private readonly session: ort.InferenceSession) {}

  static async load(modelPath: string): Promise<OrtInferenceRunner> {
    return new OrtInferenceRunner(await ort.InferenceSession.create(modelPath, { executionProviders: ["cpu"] }));
  }

  async markerLogits(inputs: DecisionInputs): Promise<number[]> {
    const { ids, markers, typeId } = inputs;
    const output = await this.session.run({
      input_ids: new ort.Tensor("int64", toInt64(ids), [1, ids.length]),
      attention_mask: new ort.Tensor("int64", toInt64(ids.map(() => 1)), [1, ids.length]),
      marker_pos: new ort.Tensor("int64", toInt64(markers), [1, markers.length]),
      marker_mask: new ort.Tensor(
        "bool",
        Uint8Array.from(markers, () => 1),
        [1, markers.length],
      ),
      qtype: new ort.Tensor("int64", toInt64([typeId]), [1]),
    });
    return Array.from(output["logits"]?.data as Float32Array);
  }
}
