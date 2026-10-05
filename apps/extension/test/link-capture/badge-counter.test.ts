import { describe, expect, test } from "bun:test";
import { BadgeCounter } from "../../src/link-capture/badge-counter.ts";
import { FakeBadgeText } from "../fakes/fake-link-capture-ports.ts";

describe("BadgeCounter", () => {
  test("shows the number in flight and clears at zero", async () => {
    const badge = new FakeBadgeText();
    const counter = new BadgeCounter(badge);
    await counter.begin();
    await counter.begin();
    await counter.end();
    await counter.end();
    expect(badge.texts).toEqual(["1", "2", "1", ""]);
  });
  test("never goes below zero", async () => {
    const badge = new FakeBadgeText();
    await new BadgeCounter(badge).end();
    expect(badge.texts).toEqual([""]);
  });
});
