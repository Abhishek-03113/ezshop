import { describe, expect, test } from "bun:test";
import { summarizeSnapshot, type SavedSummary } from "../../src/capture-outcome.ts";
import { stepStates } from "../../src/popup/capturing-view.ts";
import { renderPopupView } from "../../src/popup/popup-view.ts";
import { describeSpecCount } from "../../src/popup/saved-view.ts";
import { buildSnapshot } from "../support/build-snapshot.ts";
import { createTestContext, createTestDom } from "./support.ts";

const SUMMARY: SavedSummary = {
  ...summarizeSnapshot("p1", buildSnapshot()),
  title: "<img src=x onerror=alert(1)>",
  priceText: "₹28,926",
  listPriceText: "₹34,990",
  specCount: 54,
  groupCount: 10,
};

describe("renderPopupView", () => {
  test("welcome: shows steps and the Got it button", () => {
    const { dom } = createTestDom();
    const { context, clicks } = createTestContext();
    const view = renderPopupView(dom, { kind: "welcome" }, context);
    expect(view.textContent).toContain("You're all set");
    expect(view.querySelectorAll(".step").length).toBe(2);
    (view.querySelector("button.button-primary") as HTMLButtonElement).click();
    expect(clicks.dismissed).toBe(1);
  });

  test("capturing: has a status region and the host label", () => {
    const { dom } = createTestDom();
    const view = renderPopupView(dom, { kind: "capturing", phase: "saving" }, createTestContext().context);
    expect(view.querySelector('[role="status"]')?.textContent).toContain("Reading this page");
    expect(view.querySelector(".header-host")?.textContent).toBe("amazon.in");
    expect(view.querySelectorAll(".progress-done").length).toBe(2);
  });

  test("saved: card, struck list price, sheet and library links, no HTML injection", () => {
    const { dom } = createTestDom();
    const view = renderPopupView(dom, { kind: "saved", summary: SUMMARY }, createTestContext().context);
    const hrefs = [...view.querySelectorAll("a")].map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual(["http://web/", "http://web/products/p1", "http://web/products/p1"]);
    expect(view.querySelector(".list-price")?.tagName).toBe("S");
    expect(view.querySelector(".product-title")?.textContent).toBe(SUMMARY.title);
    expect(view.querySelector("img.thumb-image")).toBeNull();
    expect(view.textContent).toContain("54 specs in 10 groups");
  });

  test("saved: uses the product image when the snapshot has one", () => {
    const { dom } = createTestDom();
    const summary = { ...SUMMARY, imageUrl: "https://img.test/a.jpg", brand: null, listPriceText: null };
    const view = renderPopupView(dom, { kind: "saved", summary }, createTestContext().context);
    expect(view.querySelector("img.thumb-image")?.getAttribute("src")).toBe("https://img.test/a.jpg");
    expect(view.querySelector(".list-price")).toBeNull();
    expect(view.querySelector(".product-brand")).toBeNull();
  });

  test("saved: the switch reflects the setting and reports changes", () => {
    const { dom } = createTestDom();
    const { context, clicks } = createTestContext();
    const view = renderPopupView(dom, { kind: "saved", summary: SUMMARY }, context);
    const toggle = view.querySelector('[role="switch"]') as HTMLButtonElement;
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    toggle.click();
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    expect(clicks.autoOpenChanges).toEqual([false]);
  });

  test("unsupported: explains and links to the library", () => {
    const { dom } = createTestDom();
    const view = renderPopupView(dom, { kind: "unsupported" }, createTestContext().context);
    expect(view.textContent).toContain("No product on this page");
    expect(view.textContent).toContain("Flipkart");
  });

  test("failed: shows the message and retries", () => {
    const { dom } = createTestDom();
    const { context, clicks } = createTestContext();
    const view = renderPopupView(dom, { kind: "failed", message: "HTTP 500" }, context);
    expect(view.querySelector(".detail")?.textContent).toBe("HTTP 500");
    (view.querySelector("button.button-primary") as HTMLButtonElement).click();
    expect(clicks.retried).toBe(1);
  });
});

describe("view helpers", () => {
  test("stepStates and describeSpecCount", () => {
    expect(stepStates("reading")).toEqual(["done", "active", "pending"]);
    expect(stepStates("saving")).toEqual(["done", "done", "active"]);
    expect(describeSpecCount(1, 1)).toBe("1 spec in 1 group");
    expect(describeSpecCount(54, 10)).toBe("54 specs in 10 groups");
  });
});
