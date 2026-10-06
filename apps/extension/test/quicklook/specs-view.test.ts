import { describe, expect, test } from "bun:test";
import type { ProductSnapshot } from "@ezshop/catalog";
import { headerView } from "../../src/quicklook/header-view.ts";
import { footerView } from "../../src/quicklook/footer-view.ts";
import type { OverlayActions } from "../../src/quicklook/overlay-actions.ts";
import { overlayView } from "../../src/quicklook/overlay-view.ts";
import { QuickLookController } from "../../src/quicklook/quicklook-controller.ts";
import { INITIAL_MODEL, showsSpecs, type QuickLookModel } from "../../src/quicklook/quicklook-model.ts";
import { FakeQuickLookApi } from "../fakes/fake-quicklook-api.ts";
import { createTestDom } from "../popup/support.ts";
import { buildSpecSnapshot } from "../support/build-spec-snapshot.ts";
import { stateWith } from "../support/quicklook-state.ts";

const PAGE = buildSpecSnapshot();
const KEY = { shiftKey: false };

function setup(page: ProductSnapshot | null = PAGE) {
  const { root } = createTestDom();
  const api = new FakeQuickLookApi([{ id: "c1", name: "Monitors", productIds: [], updatedAt: "t" }], { c1: [] });
  const closed = { count: 0 };
  const controller = new QuickLookController({
    container: root,
    api,
    readPage: () => page,
    onClose: () => void (closed.count += 1),
    activeElement: () => root.ownerDocument.activeElement,
  });
  return { root, api, controller, closed };
}

function modelWith(overrides: Partial<QuickLookModel>): QuickLookModel {
  return { ...INITIAL_MODEL, status: "ready", state: stateWith("c1", []), pageSnapshot: PAGE, ...overrides };
}

/** An OverlayActions whose calls are recorded by name, for view tests. */
class RecordingActions implements OverlayActions {
  readonly calls: string[] = [];
  close(): void {
    this.calls.push("close");
  }
  select(comparisonId: string): void {
    this.calls.push(`select ${comparisonId}`);
  }
  setView(view: string): void {
    this.calls.push(`view ${view}`);
  }
  removeProduct(productId: string): void {
    this.calls.push(`remove ${productId}`);
  }
  addPage(): void {
    this.calls.push("add");
  }
  retry(): void {
    this.calls.push("retry");
  }
}

function typeInto(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new (input.ownerDocument.defaultView as Window & typeof globalThis).Event("input"));
}

const footerHints = (footer: HTMLElement): string[] =>
  [...footer.querySelectorAll(".hint")].map((node) => (node.textContent ?? "").replace(/\s+/g, " ").trim());

const labels = (root: HTMLElement): string[] =>
  [...root.querySelectorAll(".spec-row dt")].map((node) => node.textContent ?? "");

describe("showsSpecs", () => {
  test("needs both the specs view and a page snapshot", () => {
    expect(showsSpecs(modelWith({ view: "specs" }))).toBe(true);
    expect(showsSpecs(modelWith({ view: "compare" }))).toBe(false);
    expect(showsSpecs(modelWith({ view: "specs", pageSnapshot: null }))).toBe(false);
  });
  test("a fresh model starts on specs", () => {
    expect(INITIAL_MODEL.view).toBe("specs");
  });
});

describe("QuickLookController.open", () => {
  test("starts on specs by default and on the requested view otherwise", async () => {
    const first = setup();
    await first.controller.open();
    expect(first.controller.currentView()).toBe("specs");
    const second = setup();
    await second.controller.open("compare");
    expect(second.controller.currentView()).toBe("compare");
    expect(second.root.querySelector(".matrix")).not.toBeNull();
  });

  test("falls back to compare when the tab is not a product page", async () => {
    const { root, controller } = setup(null);
    await controller.open("specs");
    expect(controller.currentView()).toBe("compare");
    expect(root.querySelector(".spec-view")).toBeNull();
  });
});

describe("QuickLookController.setView", () => {
  test("switches to the spec sheet and back, with no API call", async () => {
    const { root, api, controller } = setup();
    await controller.open("compare");
    const calls = api.calls.length;
    controller.setView("specs");
    expect(root.querySelector(".spec-view")).not.toBeNull();
    expect(root.querySelector(".matrix")).toBeNull();
    controller.setView("compare");
    expect(root.querySelector(".spec-view")).toBeNull();
    expect(api.calls.length).toBe(calls);
  });

  test("stays on compare when the tab is not a product page", async () => {
    const { root, controller } = setup(null);
    await controller.open("compare");
    controller.setView("specs");
    expect(root.querySelector(".spec-view")).toBeNull();
    expect(root.querySelector('[aria-label="View"]')).toBeNull();
  });

  test("keeps focus on the View segment that was activated", async () => {
    const { root, controller } = setup();
    await controller.open("compare");
    root.querySelector<HTMLElement>('[data-focus="view-Specs"]')?.click();
    root.querySelector<HTMLElement>('[data-focus="view-Specs"]')?.focus();
    controller.setView("specs");
    expect(root.ownerDocument.activeElement?.getAttribute("data-focus")).toBe("view-Specs");
  });

  test("falls back to the dialog when the focused control disappears", async () => {
    const { root, controller } = setup();
    await controller.open("compare");
    root.querySelector<HTMLElement>('[data-focus="picker"]')?.focus();
    controller.setView("specs");
    expect(root.ownerDocument.activeElement?.getAttribute("data-focus")).toBe("dialog");
  });
});

describe("headerView", () => {
  test("shows the View switch on a product page, even with no comparisons yet", () => {
    const { dom } = createTestDom();
    const noComparisons = modelWith({ state: { ...stateWith("c1", []), comparisons: [], selectedId: null } });
    const header = headerView(dom, noComparisons, new RecordingActions());
    expect([...header.querySelectorAll('[aria-label="View"] .segment')].map((n) => n.textContent)).toEqual([
      "Specs",
      "Compare",
    ]);
  });

  test("has no View switch off a product page", () => {
    const { dom } = createTestDom();
    const header = headerView(dom, modelWith({ pageSnapshot: null }), new RecordingActions());
    expect(header.querySelector('[aria-label="View"]')).toBeNull();
    expect(header.querySelector(".picker")).not.toBeNull();
  });

  test("hides the picker, subtitle and row switch in the specs view but keeps close", () => {
    const { dom } = createTestDom();
    const header = headerView(dom, modelWith({ view: "specs" }), new RecordingActions());
    expect(header.querySelector(".picker")).toBeNull();
    expect(header.querySelector(".subtitle")).toBeNull();
    expect(header.querySelector('[aria-label="Rows"]')).toBeNull();
    expect(header.querySelector(".close")).not.toBeNull();
    expect(header.querySelector('[aria-label="View"] [aria-checked="true"]')?.textContent).toBe("Specs");
  });

  test("clicking a segment asks for that view", () => {
    const { dom } = createTestDom();
    const actions = new RecordingActions();
    const header = headerView(dom, modelWith({}), actions);
    header.querySelector<HTMLElement>('[data-focus="view-Specs"]')?.click();
    expect(actions.calls).toEqual(["view specs"]);
  });
});

describe("overlayView in the specs view", () => {
  test("renders this page's spec sheet inside the scroll body, with sticky tools", () => {
    const { dom } = createTestDom();
    const view = overlayView(dom, modelWith({ view: "specs" }), new RecordingActions());
    expect(view.querySelector(".body > .spec-view .spec-sheet-tools")).not.toBeNull();
    expect(labels(view as HTMLElement)).toEqual(["Size", "Type", "Capacity", "Color"]);
  });

  test("works while the comparison API is still loading", () => {
    const { dom } = createTestDom();
    const view = overlayView(dom, modelWith({ view: "specs", status: "loading", state: null }), new RecordingActions());
    expect(view.querySelector(".spec-view")).not.toBeNull();
  });

  test("no element besides the dialog carries the dialog's .card class", () => {
    const { dom } = createTestDom();
    const view = overlayView(dom, modelWith({ view: "specs" }), new RecordingActions());
    expect(view.querySelectorAll(".card").length).toBe(1);
    expect(view.querySelector(".card")?.getAttribute("role")).toBe("dialog");
    expect(view.querySelectorAll(".spec-card").length).toBeGreaterThan(0);
  });

  test("footer keeps only the Esc and compare-shortcut hints and no comparison link", () => {
    const { dom } = createTestDom();
    const footer = footerView(dom, modelWith({ view: "specs" }));
    expect(footerHints(footer)).toEqual(["Esc close", "Alt+Shift+V compare"]);
    expect(footer.querySelector(".open-link")).toBeNull();
  });

  test("compare footer ends its hints with the specs shortcut", () => {
    const { dom } = createTestDom();
    const footer = footerView(dom, modelWith({ view: "compare" }));
    expect(footerHints(footer)).toEqual([
      "Esc close",
      "Return add this page",
      "← → switch comparison",
      "Alt+Shift+S specs",
    ]);
  });

  test("a non-product page shows the compare footer even when specs was requested", () => {
    const { dom } = createTestDom();
    const footer = footerView(dom, modelWith({ view: "specs", pageSnapshot: null }));
    expect(footerHints(footer)).toContain("Alt+Shift+S specs");
  });

  test("an action-failure banner is not shown over the spec sheet", () => {
    const { dom } = createTestDom();
    const view = overlayView(dom, modelWith({ view: "specs", message: "boom" }), new RecordingActions());
    expect(view.querySelector(".banner")).toBeNull();
  });
});

describe("keys in the specs view", () => {
  async function openSpecs() {
    const context = setup();
    await context.controller.open("compare");
    context.controller.setView("specs");
    const input = context.root.querySelector<HTMLInputElement>("#spec-search");
    input?.focus();
    return { ...context, input: input as HTMLInputElement };
  }

  test("typing, arrows, Return and Backspace in the search box are left alone", async () => {
    const { api, controller, input } = await openSpecs();
    expect(input.ownerDocument.activeElement).toBe(input);
    for (const key of ["b", "a", "ArrowLeft", "ArrowRight", "Enter", "Backspace"]) {
      expect(controller.handleKey({ key, ...KEY })).toBe(false);
    }
    expect(api.calls).toEqual(["init"]);
  });

  test("Return and arrows do nothing even outside the input in the specs view", async () => {
    const { api, controller, input } = await openSpecs();
    input.blur();
    expect(controller.handleKey({ key: "Enter", ...KEY })).toBe(false);
    expect(controller.handleKey({ key: "ArrowRight", ...KEY })).toBe(false);
    expect(api.calls).toEqual(["init"]);
  });

  test("Escape still closes from the search box", async () => {
    const { controller, closed } = await openSpecs();
    expect(controller.handleKey({ key: "Escape", ...KEY })).toBe(true);
    expect(closed.count).toBe(1);
  });

  test("filtering keeps focus in the search box", async () => {
    const { root, input } = await openSpecs();
    typeInto(input, "batt");
    expect(labels(root)).toEqual(["Capacity"]);
    expect(root.ownerDocument.activeElement).toBe(input);
  });

  test("Tab from the search box moves on normally instead of being yanked back to the first control", async () => {
    const { root, controller, input } = await openSpecs();
    expect(controller.handleKey({ key: "Tab", ...KEY })).toBe(false);
    expect(root.ownerDocument.activeElement).toBe(input);
  });
});

describe("overlayView entering", () => {
  test("adds the open-animation class only when asked", () => {
    const { dom } = createTestDom();
    const model = modelWith({ view: "specs" });
    expect(overlayView(dom, model, new RecordingActions(), true).className).toBe("layer entering");
    expect(overlayView(dom, model, new RecordingActions()).className).toBe("layer");
  });
});
