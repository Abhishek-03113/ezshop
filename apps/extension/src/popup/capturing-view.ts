import type { CapturePhase } from "../capture-outcome.ts";
import type { Dom } from "./dom.ts";
import type { IconName } from "./icons.ts";

export interface CapturingModel {
  phase: CapturePhase;
  autoOpen: boolean;
}

export type StepState = "done" | "active" | "pending";

const STEP_LABELS = ["Title, brand and price", "Spec tables", "Saving to your library"] as const;

const STEP_ICONS: Readonly<Record<StepState, { icon: IconName; className: string }>> = {
  done: { icon: "check", className: "icon-sm icon-done" },
  active: { icon: "spinner", className: "icon-sm icon-spin" },
  pending: { icon: "pending", className: "icon-sm icon-pending" },
};

/**
 * Which of the three progress steps is done / active / pending. The page read covers the first
 * two steps in one go, so "reading" shows spec tables as the active step.
 *
 * @example stepStates("saving") // ["done", "done", "active"]
 */
export function stepStates(phase: CapturePhase): readonly StepState[] {
  return phase === "reading" ? ["done", "active", "pending"] : ["done", "done", "active"];
}

/**
 * Capturing body: spinner headline in a status region, skeleton card and the three steps.
 *
 * @example renderCapturingView(dom, { phase: "reading", autoOpen: true })
 */
export function renderCapturingView(dom: Dom, model: CapturingModel): HTMLElement {
  const footer = model.autoOpen
    ? "You can close this. The sheet opens in a new tab when it's ready."
    : "You can close this. Your product is saved to the library.";
  return dom.el("main", { className: "body" }, [
    renderStatus(dom),
    renderSkeletonCard(dom),
    renderSteps(dom, model.phase),
    dom.el("p", { className: "footnote", text: footer }),
  ]);
}

function renderStatus(dom: Dom): HTMLElement {
  return dom.el("div", { className: "status", attrs: { role: "status" } }, [
    dom.icon("spinner", "icon-lg icon-spin"),
    dom.el("span", { className: "status-copy" }, [
      dom.el("span", { className: "title-md", text: "Reading this page…" }),
      dom.el("span", { className: "muted-sm", text: "Usually under two seconds" }),
    ]),
  ]);
}

function renderSkeletonCard(dom: Dom): HTMLElement {
  const line = (width: string) => dom.el("div", { className: "skeleton-line", attrs: { style: `width: ${width}` } });
  return dom.el("div", { className: "card card-skeleton", attrs: { "aria-hidden": "true" } }, [
    dom.el("div", { className: "thumb thumb-skeleton" }),
    dom.el("div", { className: "skeleton-lines" }, [line("40%"), line("95%"), line("70%")]),
  ]);
}

function renderSteps(dom: Dom, phase: CapturePhase): HTMLElement {
  const states = stepStates(phase);
  const items = STEP_LABELS.map((label, index) => renderProgressStep(dom, label, states[index] ?? "pending"));
  return dom.el("ul", { className: "progress" }, items);
}

function renderProgressStep(dom: Dom, label: string, state: StepState): HTMLElement {
  const { icon, className } = STEP_ICONS[state];
  return dom.el("li", { className: `progress-step progress-${state}` }, [
    dom.icon(icon, className),
    dom.el("span", { text: label }),
  ]);
}
