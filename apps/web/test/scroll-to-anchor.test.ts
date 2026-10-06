import { describe, expect, test } from "bun:test";
import { scrollBehaviorFor } from "../src/components/scroll-to-anchor.ts";

describe("scrollBehaviorFor", () => {
  test("is instant for reduced motion and smooth otherwise", () => {
    expect(scrollBehaviorFor(true)).toBe("auto");
    expect(scrollBehaviorFor(false)).toBe("smooth");
  });
});
