import { describe, expect, test } from "bun:test";
import { pluralize } from "../src/present/pluralize.ts";

describe("pluralize", () => {
  test("adds an s except for exactly one", () => {
    expect([pluralize(0, "spec"), pluralize(1, "spec"), pluralize(2, "spec")]).toEqual([
      "0 specs",
      "1 spec",
      "2 specs",
    ]);
  });
});
