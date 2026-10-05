import { describe, expect, test } from "bun:test";
import { parseLayaConfig } from "../src/decisions/laya-config.ts";

const laya = {
  max_len: 512,
  head_max_len: 192,
  temperature: [1.6, 1.25, 1.98],
  temperature_by_options: { "choice:11+": 0.1, "choice:2": 1.9 },
  split_words: false,
};

describe("parseLayaConfig", () => {
  test("reads limits and clamps fitted temperatures", () => {
    const config = parseLayaConfig({ laya });
    expect(config.limits).toEqual({ maxLen: 512, headMaxLen: 192 });
    expect(config.calibration.temperatureByOptions).toEqual({ "choice:11+": 0.5, "choice:2": 1.9 });
  });

  test("names the problem when the laya section is missing", () => {
    expect(() => parseLayaConfig({})).toThrow('expected a "laya" section');
  });

  test("rejects word-split tokenization, which is not implemented", () => {
    expect(() => parseLayaConfig({ laya: { ...laya, split_words: true } })).toThrow("laya.split_words=true");
  });
});
