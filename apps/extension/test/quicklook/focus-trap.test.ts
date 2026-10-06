import { describe, expect, test } from "bun:test";
import { focusableControls, nextFocusTarget } from "../../src/quicklook/focus-trap.ts";
import { createTestDom } from "../popup/support.ts";

function controls(): { buttons: HTMLElement[]; root: HTMLElement } {
  const { dom, root } = createTestDom();
  const buttons = ["a", "b", "c"].map((name) => dom.el("button", { text: name }));
  root.append(...buttons, dom.el("button", { attrs: { disabled: "" }, text: "off" }));
  return { buttons, root };
}

describe("nextFocusTarget", () => {
  test("wraps forwards from the last control and backwards from the first", () => {
    const { buttons } = controls();
    expect(nextFocusTarget(buttons, buttons[2] ?? null, false)).toBe(buttons[0] ?? null);
    expect(nextFocusTarget(buttons, buttons[0] ?? null, true)).toBe(buttons[2] ?? null);
  });
  test("lets the browser move focus inside the dialog", () => {
    const { buttons } = controls();
    expect(nextFocusTarget(buttons, buttons[1] ?? null, false)).toBeNull();
  });
  test("pulls focus in when it is outside the controls", () => {
    const { buttons } = controls();
    expect(nextFocusTarget(buttons, null, false)).toBe(buttons[0] ?? null);
    expect(nextFocusTarget(buttons, null, true)).toBe(buttons[2] ?? null);
  });
  test("returns null with no controls", () => {
    expect(nextFocusTarget([], null, false)).toBeNull();
  });
});

describe("focusableControls", () => {
  test("lists enabled controls in DOM order", () => {
    const { root } = controls();
    expect(focusableControls(root).map((node) => node.textContent)).toEqual(["a", "b", "c"]);
  });
});

describe("focusableControls with a text field", () => {
  test("includes enabled inputs (the spec search box) but not disabled ones", () => {
    const { dom, root } = createTestDom();
    root.append(dom.el("input"), dom.el("input", { attrs: { disabled: "" } }));
    expect(focusableControls(root).length).toBe(1);
  });
});
