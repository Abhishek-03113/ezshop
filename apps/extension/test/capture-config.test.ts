import { describe, expect, test } from "bun:test";
import { apiHostPermission, resolveCaptureConfig, webBridgeContentScript } from "../src/capture-config.ts";

describe("resolveCaptureConfig", () => {
  test("defaults to the local web app, which also serves /api (so its session cookie applies)", () => {
    expect(resolveCaptureConfig({})).toEqual({
      apiBaseUrl: "http://localhost:5173",
      webBaseUrl: "http://localhost:5173",
    });
  });

  test("the API follows PICKY_WEB_URL unless PICKY_API_URL is set", () => {
    expect(resolveCaptureConfig({ PICKY_WEB_URL: "https://app.picky.test" }).apiBaseUrl).toBe("https://app.picky.test");
  });

  test("normalises overrides to origins", () => {
    expect(resolveCaptureConfig({ PICKY_API_URL: "https://api.picky.test/ignored/path" }).apiBaseUrl).toBe(
      "https://api.picky.test",
    );
  });

  test("rejects non-http values with the offending value", () => {
    expect(() => resolveCaptureConfig({ PICKY_WEB_URL: "ftp://x" })).toThrow('PICKY_WEB_URL is "ftp://x"');
  });
});

describe("apiHostPermission", () => {
  test("grants the API origin", () => {
    expect(apiHostPermission(resolveCaptureConfig({}))).toBe("http://localhost:5173/*");
  });
});

describe("webBridgeContentScript", () => {
  test("injects the bridge into the web app's origin before it renders", () => {
    const config = resolveCaptureConfig({ PICKY_WEB_URL: "https://picky.test/library" });
    expect(webBridgeContentScript(config)).toEqual({
      matches: ["https://picky.test/*"],
      js: ["web-bridge.js"],
      run_at: "document_start",
    });
  });
});
