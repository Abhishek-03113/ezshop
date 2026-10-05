import type { Dom } from "./dom.ts";

export interface SwitchOptions {
  /** id of the element that labels the switch. */
  labelId: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * An iOS-style on/off switch: a real button with role="switch" that flips aria-checked itself.
 *
 * @example renderSwitch(dom, { labelId: "auto-open-label", checked: true, onChange: save })
 */
export function renderSwitch(dom: Dom, options: SwitchOptions): HTMLButtonElement {
  const attrs = { type: "button", role: "switch", "aria-labelledby": options.labelId };
  const toggle = dom.el("button", { className: "switch", attrs }, [dom.el("span", { className: "switch-knob" })]);
  toggle.setAttribute("aria-checked", String(options.checked));
  toggle.addEventListener("click", () => {
    const next = toggle.getAttribute("aria-checked") !== "true";
    toggle.setAttribute("aria-checked", String(next));
    options.onChange(next);
  });
  return toggle;
}
