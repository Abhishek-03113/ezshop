import { describe, expect, test } from "bun:test";
import { loadApiConfig } from "../src/config/api-config.ts";

describe("loadApiConfig", () => {
  test("applies defaults around the required DATABASE_URL", () => {
    expect(loadApiConfig({ DATABASE_URL: "postgres://x" })).toEqual({
      databaseUrl: "postgres://x",
      firecrawlUrl: "http://localhost:3002",
      port: 8787,
      webOrigin: "http://localhost:5173",
    });
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
