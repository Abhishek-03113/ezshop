import { describe, expect, test } from "bun:test";
import { loadApiConfig } from "../src/config/api-config.ts";

describe("loadApiConfig", () => {
  test("applies defaults around the required DATABASE_URL", () => {
    expect(loadApiConfig({ DATABASE_URL: "postgres://x" })).toEqual({
      databaseUrl: "postgres://x",
      decisionModelDir: null,
      firecrawlApiKey: null,
      firecrawlUrl: null,
      port: 8787,
      webOrigin: "http://localhost:5173",
    });
  });

  test("reads the optional Laya model directory", () => {
    const config = loadApiConfig({ DATABASE_URL: "postgres://x", DECISION_MODEL_DIR: "/models/laya" });
    expect(config.decisionModelDir).toBe("/models/laya");
  });

  test("an API key alone points at hosted Firecrawl", () => {
    const config = loadApiConfig({ DATABASE_URL: "postgres://x", FIRECRAWL_API_KEY: "fc-123" });
    expect(config).toMatchObject({ firecrawlApiKey: "fc-123", firecrawlUrl: "https://api.firecrawl.dev" });
  });

  test("an explicit FIRECRAWL_URL selects a self-hosted instance", () => {
    const config = loadApiConfig({ DATABASE_URL: "postgres://x", FIRECRAWL_URL: "http://localhost:3002" });
    expect(config).toMatchObject({ firecrawlApiKey: null, firecrawlUrl: "http://localhost:3002" });
  });

  test("names the missing variable", () => {
    expect(() => loadApiConfig({})).toThrow(
      "Environment variable DATABASE_URL is undefined; expected a non-empty string",
    );
  });

  test("rejects a non-numeric port with the offending value", () => {
    expect(() => loadApiConfig({ DATABASE_URL: "postgres://x", API_PORT: "http" })).toThrow('API_PORT is "http"');
  });
});
