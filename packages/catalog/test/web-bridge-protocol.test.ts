import { describe, expect, test } from "bun:test";
import { isWebBridgeReply, isWebBridgeRequest } from "../src/web-bridge-protocol.ts";

describe("isWebBridgeRequest", () => {
  test("accepts a complete import-link request", () => {
    const request = { channel: "picky:web-to-extension", requestId: "r1", type: "import-link", url: "https://x" };
    expect(isWebBridgeRequest(request)).toBe(true);
  });
  test("rejects other channels, types and missing fields", () => {
    expect(isWebBridgeRequest({ channel: "picky:web-to-extension", requestId: "r1", type: "import-link" })).toBe(false);
    expect(isWebBridgeRequest({ channel: "other", requestId: "r1", type: "import-link", url: "u" })).toBe(false);
    expect(isWebBridgeRequest({ channel: "picky:web-to-extension", requestId: "r1", type: "delete", url: "u" })).toBe(
      false,
    );
    expect(isWebBridgeRequest(null)).toBe(false);
  });
});

describe("isWebBridgeReply", () => {
  test("accepts extension replies only", () => {
    expect(isWebBridgeReply({ channel: "picky:extension-to-web", requestId: "r1", ok: false, message: "x" })).toBe(
      true,
    );
    expect(isWebBridgeReply({ channel: "picky:web-to-extension", requestId: "r1" })).toBe(false);
    expect(isWebBridgeReply("hello")).toBe(false);
  });
});
