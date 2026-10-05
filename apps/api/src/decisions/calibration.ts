import { MODEL_TYPE_ID, type QuestionKind } from "./decision-question.ts";

export interface LayaCalibration {
  /** Fallback temperature per question type, indexed by MODEL_TYPE_ID. */
  temperature: readonly number[];
  /** Fitted temperature per `temperatureBucket`, e.g. "choice:3-5". */
  temperatureByOptions: Readonly<Record<string, number>>;
}

// laya.common.TEMP_MIN/TEMP_MAX: the shipped choice:11+ fit (0.10) would sharpen a 0.24 top
// probability to 0.99, so Laya itself refuses temperatures that sharpen this hard.
const TEMPERATURE_MIN = 0.5;
const TEMPERATURE_MAX = 5;

export function clampTemperature(temperature: number): number {
  return Math.min(TEMPERATURE_MAX, Math.max(TEMPERATURE_MIN, temperature));
}

/** Mirrors laya.common.temp_bucket: question type plus a size class of its option count. */
export function temperatureBucket(kind: QuestionKind, optionCount: number): string {
  const size = optionCount <= 2 ? "2" : optionCount <= 5 ? "3-5" : optionCount <= 10 ? "6-10" : "11+";
  return `${kind}:${size}`;
}

/**
 * Softmax of `logits / T`, with T picked by question kind and option count.
 *
 * @example calibratedProbabilities([6.8, -2.3, -1.9], "choice", calibration) // [0.98, ...]
 */
export function calibratedProbabilities(
  logits: readonly number[],
  kind: QuestionKind,
  calibration: LayaCalibration,
): number[] {
  const fitted = calibration.temperatureByOptions[temperatureBucket(kind, logits.length)];
  const scale = clampTemperature(fitted ?? calibration.temperature[MODEL_TYPE_ID[kind]] ?? 1);
  const scaled = logits.map((logit) => logit / scale);
  const peak = Math.max(...scaled);
  const exponentials = scaled.map((value) => Math.exp(value - peak));
  const total = exponentials.reduce((sum, value) => sum + value, 0);
  return exponentials.map((value) => value / total);
}
