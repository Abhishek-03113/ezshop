import { describe, expect, test } from "bun:test";
import { GroupHighlighter } from "../../src/popup/specs/group-highlight.ts";
import { FakeHighlightClock } from "../fakes/fake-highlight-clock.ts";
import { createTestDom } from "./support.ts";

function pair(): { chip: HTMLElement; section: HTMLElement } {
  const { root } = createTestDom();
  const chip = root.ownerDocument.createElement("button");
  const section = root.ownerDocument.createElement("section");
  root.append(chip, section);
  return { chip, section };
}

describe("GroupHighlighter", () => {
  test("marks the chip and section, then clears both when the time is up", () => {
    const clock = new FakeHighlightClock();
    const highlighter = new GroupHighlighter(clock, 2000);
    const { chip, section } = pair();
    highlighter.show(chip, section);
    expect(section.classList.contains("highlighted")).toBe(true);
    expect(chip.getAttribute("aria-current")).toBe("true");
    clock.advance(1999);
    expect(section.classList.contains("highlighted")).toBe(true);
    clock.advance(1);
    expect(section.classList.contains("highlighted")).toBe(false);
    expect(chip.getAttribute("aria-current")).toBeNull();
  });

  test("showing another pair unmarks the first and restarts the timer", () => {
    const clock = new FakeHighlightClock();
    const highlighter = new GroupHighlighter(clock, 2000);
    const first = pair();
    const second = pair();
    highlighter.show(first.chip, first.section);
    clock.advance(1500);
    highlighter.show(second.chip, second.section);
    expect(first.section.classList.contains("highlighted")).toBe(false);
    clock.advance(1500);
    expect(second.section.classList.contains("highlighted")).toBe(true);
  });
});
