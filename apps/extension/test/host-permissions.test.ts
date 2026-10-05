import { describe, expect, test } from "bun:test";
import { mergeHostPermissions } from "../src/host-permissions.ts";

describe("mergeHostPermissions", () => {
  test("keeps declared hosts and appends the API host", () => {
    expect(mergeHostPermissions(["https://www.amazon.in/*"], "http://localhost:8787/*")).toEqual([
      "https://www.amazon.in/*",
      "http://localhost:8787/*",
    ]);
  });
  test("does not duplicate a host already declared", () => {
    expect(mergeHostPermissions(["http://a/*"], "http://a/*")).toEqual(["http://a/*"]);
  });
});
