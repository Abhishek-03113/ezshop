import { describe, expect, test } from "bun:test";
import { calibratedProbabilities, clampTemperature, temperatureBucket } from "../src/decisions/calibration.ts";

const calibration = { temperature: [2, 1, 1], temperatureByOptions: { "choice:3-5": 1 } };

describe("temperatureBucket", () => {
  test("classes option counts like laya.common.temp_bucket", () => {
    expect([2, 3, 5, 6, 10, 11].map((count) => temperatureBucket("choice", count))).toEqual([
      "choice:2",
      "choice:3-5",
      "choice:3-5",
      "choice:6-10",
      "choice:6-10",
      "choice:11+",
    ]);
  });
});

describe("clampTemperature", () => {
  test("refuses temperatures that sharpen or flatten too hard", () => {
    expect([clampTemperature(0.1), clampTemperature(1.5), clampTemperature(9)]).toEqual([0.5, 1.5, 5]);
  });
});

describe("calibratedProbabilities", () => {
  test("sums to one and keeps the logit order", () => {
    const probabilities = calibratedProbabilities([6.85, -2.32, -1.95], "choice", calibration);
    expect(probabilities.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    expect(probabilities[0]).toBeGreaterThan(0.99);
    expect(probabilities[2]).toBeGreaterThan(probabilities[1] ?? 1);
  });

  test("uses the bucket temperature when fitted, else the type temperature", () => {
    const flat = calibratedProbabilities([2, 0], "noul", { temperature: [1, 1, 4], temperatureByOptions: {} });
    const sharp = calibratedProbabilities([2, 0], "noul", { temperature: [1, 1, 1], temperatureByOptions: {} });
    expect(flat[0]).toBeLessThan(sharp[0] ?? 0);
  });
});
