import { describe, expect, test } from "bun:test";
import { formatCaptureTime } from "../src/present/capture-time.ts";

describe("formatCaptureTime", () => {
  test("formats in the given time zone", () => {
    expect(formatCaptureTime("2026-10-05T05:59:30Z", "Asia/Kolkata")).toBe("5 Oct 2026, 11:29");
  });
});
