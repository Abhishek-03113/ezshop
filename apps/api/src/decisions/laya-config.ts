import { z } from "zod";
import { clampTemperature, type LayaCalibration } from "./calibration.ts";
import type { SequenceLimits } from "./sequence-builder.ts";

export interface LayaConfig {
  limits: SequenceLimits;
  calibration: LayaCalibration;
}

const LayaSectionSchema = z.object({
  max_len: z.number().int().positive(),
  head_max_len: z.number().int().positive(),
  temperature: z.array(z.number()).length(3),
  temperature_by_options: z.record(z.string(), z.number()),
  split_words: z.boolean(),
});

const ConfigFileSchema = z.object({ laya: LayaSectionSchema });

/**
 * Reads the `laya` section of the ONNX export's config.json (limits + fitted temperatures).
 *
 * @example parseLayaConfig(await Bun.file("model/config.json").json()).limits.maxLen // 512
 */
export function parseLayaConfig(raw: unknown): LayaConfig {
  const parsed = ConfigFileSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Laya config.json is invalid (${parsed.error.message}); expected a "laya" section with limits and temperatures`,
    );
  }
  const section = parsed.data.laya;
  if (section.split_words) {
    throw new Error(
      "Laya config.json has laya.split_words=true; word-by-word tokenization is not supported, expected false",
    );
  }
  return {
    limits: { maxLen: section.max_len, headMaxLen: section.head_max_len },
    calibration: {
      temperature: section.temperature.map(clampTemperature),
      temperatureByOptions: Object.fromEntries(
        Object.entries(section.temperature_by_options).map(([bucket, value]) => [bucket, clampTemperature(value)]),
      ),
    },
  };
}
