import { describe, expect, test } from "bun:test";
import { formatMoney } from "@picky/catalog";
import { summarizeSnapshot } from "../src/capture-outcome.ts";
import { stateFromOutcome } from "../src/popup/popup-state.ts";
import { buildSnapshot } from "./support/build-snapshot.ts";

describe("summarizeSnapshot", () => {
  test("formats prices in the product currency and counts specs and groups", () => {
    const snapshot = {
      ...buildSnapshot(),
      price: { amount: 28926, currency: "INR" },
      listPrice: { amount: 34990.5, currency: "INR" },
      images: ["https://img.test/a.jpg"],
      specGroups: [
        {
          title: "A",
          specs: [
            { label: "x", value: "1" },
            { label: "y", value: "2" },
          ],
        },
        { title: "B", specs: [{ label: "z", value: "3" }] },
      ],
    };
    const summary = summarizeSnapshot("p1", snapshot);
    expect(summary.priceText).toMatch(/28,926/);
    expect(summary.listPriceText).toBe(formatMoney(snapshot.listPrice));
    expect(summary.snapshot).toEqual(snapshot);
    expect(summary).toMatchObject({ productId: "p1", imageUrl: "https://img.test/a.jpg", specCount: 3, groupCount: 2 });
  });

  test("leaves missing price and image as null", () => {
    expect(summarizeSnapshot("p1", buildSnapshot())).toMatchObject({
      priceText: null,
      listPriceText: null,
      imageUrl: null,
    });
  });
});

describe("stateFromOutcome", () => {
  test("maps each capture outcome to its popup state", () => {
    const summary = summarizeSnapshot("p1", buildSnapshot());
    expect(stateFromOutcome({ kind: "saved", summary })).toEqual({ kind: "saved", summary });
    expect(stateFromOutcome({ kind: "unsupported" })).toEqual({ kind: "unsupported" });
    expect(stateFromOutcome({ kind: "failed", message: "boom" })).toEqual({ kind: "failed", message: "boom" });
  });
});
