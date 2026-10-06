import type { Dom } from "./dom.ts";

export interface WelcomeHandlers {
  onDismiss: () => void;
}

const STEPS = [
  { title: "Pin ezshop", body: "Click the puzzle icon in Chrome's toolbar, then the pin next to ezshop." },
  { title: "Open any product page", body: "On Amazon.in or Flipkart, click ezshop. That's it." },
] as const;

const SHORTCUT_KEYS = ["Alt", "Shift", "S"] as const;

/**
 * First-run body: two setup steps, the shortcut and a "Got it" button.
 *
 * @example renderWelcomeView(dom, { onDismiss: () => void controller.dismissWelcome() })
 */
export function renderWelcomeView(dom: Dom, handlers: WelcomeHandlers): HTMLElement {
  const gotIt = dom.el("button", { className: "button button-primary", attrs: { type: "button" }, text: "Got it" });
  gotIt.addEventListener("click", handlers.onDismiss);
  return dom.el("main", { className: "body body-welcome" }, [
    renderIntro(dom),
    dom.el(
      "ol",
      { className: "steps" },
      STEPS.map((step, index) => renderStep(dom, index + 1, step)),
    ),
    renderShortcut(dom),
    dom.el("div", { className: "actions" }, [gotIt]),
  ]);
}

function renderIntro(dom: Dom): HTMLElement {
  return dom.el("div", { className: "intro" }, [
    dom.el("h1", { className: "title-lg", text: "You're all set" }),
    dom.el("p", { className: "muted", text: "Two quick things and you'll never dig for specs again." }),
  ]);
}

function renderStep(dom: Dom, position: number, step: (typeof STEPS)[number]): HTMLElement {
  return dom.el("li", { className: "step" }, [
    dom.el("span", { className: "step-number", text: String(position) }),
    dom.el("span", { className: "step-copy" }, [
      dom.el("span", { className: "step-title", text: step.title }),
      dom.el("span", { className: "step-body", text: step.body }),
    ]),
  ]);
}

function renderShortcut(dom: Dom): HTMLElement {
  const keys = SHORTCUT_KEYS.map((key) => dom.el("kbd", { className: "key", text: key }));
  return dom.el("div", { className: "shortcut" }, [
    dom.el("span", { text: "Shortcut" }),
    dom.el("span", { className: "keys" }, keys),
  ]);
}
