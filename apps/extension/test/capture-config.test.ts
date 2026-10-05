import { describe, expect, test } from "bun:test";
import { apiHostPermission, resolveCaptureConfig } from "../src/capture-config.ts";

describe("resolveCaptureConfig", () => {
  test("defaults to the local dev stack", () => {
    expect(resolveCaptureConfig({})).toEqual({
      apiBaseUrl: "http://localhost:8787",
      webBaseUrl: "http://localhost:5173",
    });
  });

  test("normalises overrides to origins", () => {
    expect(resolveCaptureConfig({ EZSHOP_API_URL: "https://api.ezshop.test/ignored/path" }).apiBaseUrl).toBe(
      "https://api.ezshop.test",
    );
  });

  test("rejects non-http values with the offending value", () => {
    expect(() => resolveCaptureConfig({ EZSHOP_WEB_URL: "ftp://x" })).toThrow('EZSHOP_WEB_URL is "ftp://x"');
  });
});

describe("apiHostPermission", () => {
  test("grants the API origin", () => {
    expect(apiHostPermission(resolveCaptureConfig({}))).toBe("http://localhost:8787/*");
  });
});
