import { describe, expect, test } from "bun:test";
import { createJsonLogger } from "../src/logging/json-logger.ts";

describe("createJsonLogger", () => {
  test("writes one JSON line per entry with time, level and fields", () => {
    const lines: string[] = [];
    const logger = createJsonLogger(
      (line) => lines.push(line),
      () => new Date("2026-10-05T00:00:00Z"),
    );
    logger.info("product.saved", { id: "p1" });
    logger.error("request.failed");
    expect(lines.map((line) => JSON.parse(line))).toEqual([
      { time: "2026-10-05T00:00:00.000Z", level: "info", event: "product.saved", id: "p1" },
      { time: "2026-10-05T00:00:00.000Z", level: "error", event: "request.failed" },
    ]);
  });
});
