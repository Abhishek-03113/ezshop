import { describe, expect, test } from "bun:test";
import type { CatalogProduct } from "@ezshop/catalog";
import { QuickLookController } from "../../src/quicklook/quicklook-controller.ts";
import { FakeQuickLookApi } from "../fakes/fake-quicklook-api.ts";
import { createTestDom } from "../popup/support.ts";
import { buildCatalogProduct, buildSnapshot } from "../support/build-snapshot.ts";

const MONITOR_A = buildCatalogProduct("p1", {
  externalId: "A1",
  title: "LG 27UP850N",
  price: { amount: 29999, currency: "INR" },
  specGroups: [
    {
      title: "Display",
      specs: [
        { label: "Brightness", value: "400 nits" },
        { label: "Panel", value: "IPS" },
      ],
    },
  ],
});
const MONITOR_B = buildCatalogProduct("p2", {
  externalId: "B1",
  title: "Dell S2722QC",
  price: { amount: 27490, currency: "INR" },
  specGroups: [
    {
      title: "Display",
      specs: [
        { label: "Brightness", value: "350 nits" },
        { label: "Panel", value: "IPS" },
      ],
    },
  ],
});
const THIS_PAGE = buildSnapshot();

function setup(options: { page?: typeof THIS_PAGE | null; comparisons?: number; fail?: Error } = {}) {
  const { dom, root } = createTestDom();
  const summaries = [
    { id: "c1", name: "Monitors", productIds: [], updatedAt: "t" },
    { id: "c2", name: "Phones", productIds: [], updatedAt: "t" },
  ];
  const api = new FakeQuickLookApi(summaries.slice(0, options.comparisons ?? 2), {
    c1: [MONITOR_A, MONITOR_B] as CatalogProduct[],
    c2: [],
  });
  if (options.fail) api.failNext = options.fail;
  const closed = { count: 0 };
  const controller = new QuickLookController({
    container: root,
    api,
    readPage: () => (options.page === undefined ? THIS_PAGE : options.page),
    onClose: () => void (closed.count += 1),
    activeElement: () => root.ownerDocument.activeElement,
  });
  return { root, api, controller, closed, dom };
}

const text = (root: HTMLElement, selector: string): string[] =>
  Array.from(root.querySelectorAll(selector), (node) => node.textContent ?? "");

describe("QuickLookController", () => {
  test("renders saved products, a highlighted This page column and Add", async () => {
    const { root, controller } = setup();
    await controller.open("compare");
    expect(text(root, ".head-name")).toEqual(["LG 27UP850N", "Dell S2722QC", "Apple iPhone 17"]);
    expect(text(root, ".page-pill")).toEqual(["This page"]);
    expect(root.querySelector(".add")?.textContent).toContain("Add");
    expect(root.querySelector('[role="dialog"]')?.getAttribute("aria-modal")).toBe("true");
  });

  test("labels the best value with a text pill and the lowest price", async () => {
    const { root, controller } = setup();
    await controller.open("compare");
    expect(text(root, ".pill")).toEqual(["Lowest", "Best"]);
  });

  test("Differences hides identical rows with a count; All specs shows them", async () => {
    const { root, controller } = setup({ page: null });
    await controller.open("compare");
    expect(root.querySelector(".identical-note")?.textContent).toBe("1 identical spec hidden");
    expect(text(root, ".label")).not.toContain("Panel");
    controller.setDifferencesOnly(false);
    expect(text(root, ".label")).toContain("Panel");
    expect(root.querySelector(".identical-note")).toBeNull();
  });

  test("on a non-product page there is no This page column", async () => {
    const { root, controller } = setup({ page: null });
    await controller.open("compare");
    expect(root.querySelector(".page-pill")).toBeNull();
    expect(text(root, ".head-name")).toEqual(["LG 27UP850N", "Dell S2722QC"]);
  });

  test("Add saves the page into the selected comparison and turns it into a normal column", async () => {
    const { root, api, controller } = setup();
    await controller.open("compare");
    controller.addPage();
    await Bun.sleep(0);
    expect(api.calls).toContain("add c1 B0FQG1YHYR");
    expect(root.querySelector(".page-pill")).toBeNull();
    expect(text(root, ".head-name")).toContain("Apple iPhone 17");
  });

  test("remove drops a product", async () => {
    const { root, api, controller } = setup();
    await controller.open("compare");
    controller.removeProduct("p1");
    await Bun.sleep(0);
    expect(api.calls).toContain("remove c1 p1");
    expect(text(root, ".head-name")).not.toContain("LG 27UP850N");
  });

  test("the picker lists comparisons and switching selects one", async () => {
    const { root, api, controller } = setup();
    await controller.open("compare");
    expect(text(root, ".picker option")).toEqual(["Monitors", "Phones"]);
    controller.select("c2");
    await Bun.sleep(0);
    expect(api.calls).toContain("select c2");
  });

  test("footer links to the web compare page", async () => {
    const { root, controller } = setup();
    await controller.open("compare");
    expect(root.querySelector(".open-link")?.getAttribute("href")).toBe("http://web/comparisons/c1");
  });

  test("with no comparisons, offers to start one from this page", async () => {
    const { root, api, controller } = setup({ comparisons: 0 });
    await controller.open("compare");
    expect(root.textContent).toContain("Add this page to start a comparison");
    controller.addPage();
    await Bun.sleep(0);
    expect(api.calls).toContain("add created B0FQG1YHYR");
  });

  test("with no comparisons on a non-product page there is nothing to add", async () => {
    const { root, controller } = setup({ comparisons: 0, page: null });
    await controller.open("compare");
    expect(root.textContent).not.toContain("Add this page to start");
  });

  test("a failed first load shows the reason and Try again recovers", async () => {
    const { root, api, controller } = setup({ fail: new Error("API down") });
    await controller.open("compare");
    expect(root.textContent).toContain("API down");
    controller.retry();
    await Bun.sleep(0);
    expect(api.calls.filter((call) => call === "init")).toHaveLength(2);
    expect(text(root, ".head-name")).toContain("LG 27UP850N");
  });

  test("a failed action keeps the matrix and shows an alert", async () => {
    const { root, api, controller } = setup();
    await controller.open("compare");
    api.failNext = new Error("could not remove");
    controller.removeProduct("p1");
    await Bun.sleep(0);
    expect(root.querySelector('[role="alert"]')?.textContent).toBe("could not remove");
    expect(text(root, ".head-name")).toContain("LG 27UP850N");
  });

  test("close asks the host to dismiss", async () => {
    const { controller, closed } = setup();
    await controller.open("compare");
    controller.close();
    expect(closed.count).toBe(1);
  });
});

describe("QuickLookController keys", () => {
  test("Escape closes", async () => {
    const { controller, closed } = setup();
    await controller.open("compare");
    expect(controller.handleKey({ key: "Escape", shiftKey: false })).toBe(true);
    expect(closed.count).toBe(1);
  });

  test("Enter adds this page unless a button has focus", async () => {
    const { root, api, controller } = setup();
    await controller.open("compare");
    root.querySelector<HTMLElement>('[data-focus="close"]')?.focus();
    expect(controller.handleKey({ key: "Enter", shiftKey: false })).toBe(false);
    root.ownerDocument.body.focus();
    (root.ownerDocument.activeElement as HTMLElement | null)?.blur();
    expect(controller.handleKey({ key: "Enter", shiftKey: false })).toBe(true);
    await Bun.sleep(0);
    expect(api.calls).toContain("add c1 B0FQG1YHYR");
  });

  test("Return right after opening adds this page (focus starts on the dialog, not the close button)", async () => {
    const { api, controller } = setup();
    await controller.open("compare");
    expect(controller.handleKey({ key: "Enter", shiftKey: false })).toBe(true);
    await Bun.sleep(0);
    expect(api.calls).toContain("add c1 B0FQG1YHYR");
  });

  test("arrow keys switch comparison", async () => {
    const { api, controller } = setup();
    await controller.open("compare");
    (controller as unknown as { deps: { activeElement: () => null } }).deps.activeElement = () => null;
    expect(controller.handleKey({ key: "ArrowRight", shiftKey: false })).toBe(true);
    await Bun.sleep(0);
    expect(api.calls).toContain("select c2");
  });

  test("other keys are left to the page", async () => {
    const { controller } = setup();
    await controller.open("compare");
    expect(controller.handleKey({ key: "a", shiftKey: false })).toBe(false);
  });

  test("Tab from the last control wraps to the first", async () => {
    const { root, controller } = setup({ page: null });
    await controller.open("compare");
    const all = Array.from(root.querySelectorAll<HTMLElement>("button, a[href], select"));
    all[all.length - 1]?.focus();
    expect(controller.handleKey({ key: "Tab", shiftKey: false })).toBe(true);
    expect(root.ownerDocument.activeElement).toBe(all[0] ?? null);
  });
});

describe("open animation", () => {
  test("only the first render animates, so adding a page does not flash the dialog", async () => {
    const { root, controller } = setup();
    await controller.open("compare");
    expect(root.querySelector(".layer")?.classList.contains("entering")).toBe(false);
    controller.addPage();
    expect(root.querySelector(".layer")?.classList.contains("entering")).toBe(false);
  });
});
