import { describe, expect, test } from "bun:test";
import { availabilityTone } from "../src/present/availability-tone.ts";

describe("availabilityTone", () => {
  test("reads stock state from the store's wording", () => {
    expect(availabilityTone("In stock")).toBe("in-stock");
    expect(availabilityTone("Currently unavailable.")).toBe("out-of-stock");
    expect(availabilityTone("Ships in 2 weeks")).toBe("unknown");
  });
});
