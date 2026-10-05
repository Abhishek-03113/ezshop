import { loadHfTokenizer } from "./hf-tokenizer.ts";
import { parseLayaConfig } from "./laya-config.ts";
import { OnnxDecisionModel } from "./onnx-decision-model.ts";
import { OrtInferenceRunner } from "./ort-inference-runner.ts";

const MODEL_FILE = "onnx/model_fp16.onnx";

/**
 * Loads Laya from a directory holding config.json, tokenizer.json and onnx/model_fp16.onnx
 * (the layout of the Hugging Face repo onnx-community/laya-ONNX).
 *
 * @example const model = await loadLayaDecisionModel("/models/laya-ONNX")
 */
export async function loadLayaDecisionModel(modelDir: string): Promise<OnnxDecisionModel> {
  const config = parseLayaConfig(await Bun.file(`${modelDir}/config.json`).json());
  const [tokenizer, runner] = await Promise.all([
    loadHfTokenizer(modelDir),
    OrtInferenceRunner.load(`${modelDir}/${MODEL_FILE}`),
  ]);
  return new OnnxDecisionModel(tokenizer, runner, config);
}
