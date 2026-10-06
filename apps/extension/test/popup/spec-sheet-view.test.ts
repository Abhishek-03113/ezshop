import { describe, expect, test } from "bun:test";
import { COLLAPSED_HIGHLIGHT_COUNT } from "../../src/popup/specs/spec-highlights-view.ts";
import { renderSpecSheetContent, renderSpecSheetView } from "../../src/popup/specs/spec-sheet-view.ts";
import { buildSpecSnapshot } from "../support/build-spec-snapshot.ts";
import { createTestDom } from "./support.ts";

function mount(snapshot = buildSpecSnapshot()) {
  const { dom, root } = createTestDom();
  const view = renderSpecSheetView(dom, snapshot);
  root.append(view);
  return { view, root };
}

function type(view: HTMLElement, query: string): HTMLInputElement {
  const input = view.querySelector("input") as HTMLInputElement;
  input.value = query;
  input.dispatchEvent(new (input.ownerDocument.defaultView as Window & typeof globalThis).Event("input"));
  return input;
}

const rowLabels = (view: HTMLElement): string[] =>
  [...view.querySelectorAll(".spec-row dt")].map((n) => n.textContent ?? "");

describe("renderSpecSheetView", () => {
  test("renders groups, rows, count label and a chip per group", () => {
    const { view } = mount();
    expect(view.querySelectorAll("section.spec-group").length).toBe(3);
    expect(rowLabels(view)).toEqual(["Size", "Type", "Capacity", "Color"]);
    expect(view.querySelector(".spec-sheet-head .subtle")?.textContent).toBe("4 specs in 3 groups");
    expect(view.querySelectorAll(".group-chips button").length).toBe(3);
    expect(view.querySelector("#group-item-details h3")?.textContent).toBe("Item details");
  });

  test("summary shows brand, store chip, title, rating and the first image", () => {
    const { view } = mount();
    expect(view.querySelector(".summary-brand")?.textContent).toBe("Apple");
    expect(view.querySelector(".summary .chip")?.textContent).toBe("Amazon.in");
    expect(view.querySelector("h1")?.textContent).toBe("Apple iPhone 17");
    expect(view.querySelector(".rating-note")?.textContent).toContain("4.4out of 5 · 17,240 ratings");
    expect(view.querySelector(".gallery-main img")?.getAttribute("src")).toBe("https://img.test/a.jpg");
  });

  test("without an image or rating it shows a placeholder and no rating note", () => {
    const { view } = mount(buildSpecSnapshot({ images: [], rating: null }));
    expect(view.querySelector(".gallery-main img")).toBeNull();
    expect(view.querySelector(".gallery-main svg")).not.toBeNull();
    expect(view.querySelector(".rating-note")).toBeNull();
  });

  test("typing filters rows and count, keeps the input node, and only keeps matching chips", () => {
    const { view } = mount();
    const input = view.querySelector("input");
    type(view, "battery");
    expect(view.querySelector("input")).toBe(input);
    expect(rowLabels(view)).toEqual(["Capacity"]);
    expect(view.querySelector(".spec-sheet-head .subtle")?.textContent).toBe("1 matching spec");
    expect(view.querySelectorAll(".group-chips button").length).toBe(1);
  });

  test("no match shows the empty state and Clear search restores everything", () => {
    const { view } = mount();
    const input = type(view, " zzz ");
    expect(view.querySelector(".empty-state strong")?.textContent).toBe("No specs match “zzz”");
    expect(view.querySelector(".group-chips")).toBeNull();
    (view.querySelector(".empty-state button") as HTMLButtonElement).click();
    expect(input.value).toBe("");
    expect(view.querySelector(".empty-state")).toBeNull();
    expect(rowLabels(view).length).toBe(4);
  });

  test("a chip scrolls its group section into view", () => {
    const { view } = mount();
    const scrolled: string[] = [];
    for (const section of view.querySelectorAll("section.spec-group")) {
      (section as HTMLElement).scrollIntoView = () => void scrolled.push(section.id);
    }
    (view.querySelectorAll(".group-chips button")[1] as HTMLButtonElement).click();
    expect(scrolled).toEqual(["group-battery"]);
  });

  test("a chip highlights its group and is marked current; picking another moves the highlight", () => {
    const { view } = mount();
    for (const section of view.querySelectorAll("section.spec-group")) {
      (section as HTMLElement).scrollIntoView = () => {};
    }
    const chips = view.querySelectorAll(".group-chips button");
    (chips[0] as HTMLButtonElement).click();
    expect(view.querySelectorAll(".spec-group.highlighted")).toHaveLength(1);
    expect(chips[0]?.getAttribute("aria-current")).toBe("true");
    (chips[1] as HTMLButtonElement).click();
    expect(view.querySelector(".spec-group.highlighted")?.id).toBe("group-battery");
    expect(chips[0]?.getAttribute("aria-current")).toBeNull();
  });

  // Regression: Quick Look mounts the sheet in a closed shadow root, where document.getElementById
  // found nothing and chips silently did not scroll.
  test("a chip scrolls its group inside a closed shadow root", () => {
    const { dom, root } = createTestDom();
    const shadow = root.attachShadow({ mode: "closed" });
    const view = renderSpecSheetContent(dom, buildSpecSnapshot());
    shadow.append(view);
    const scrolled: string[] = [];
    for (const section of view.querySelectorAll("section.spec-group")) {
      (section as HTMLElement).scrollIntoView = () => void scrolled.push(section.id);
    }
    (view.querySelectorAll(".group-chips button")[1] as HTMLButtonElement).click();
    expect(scrolled).toEqual(["group-battery"]);
  });

  test("page text stays text: a hostile title or spec never becomes markup", () => {
    const hostile = "<img src=x onerror=alert(1)>";
    const snapshot = buildSpecSnapshot({
      title: hostile,
      specGroups: [{ title: hostile, specs: [{ label: hostile, value: hostile }] }],
    });
    const { view } = mount(snapshot);
    expect(view.querySelector("h1")?.textContent).toBe(hostile);
    expect(view.querySelector(".spec-row dd")?.textContent).toBe(hostile);
    expect(view.querySelector("img[onerror]")).toBeNull();
  });
});

describe("price card", () => {
  test("shows price, struck M.R.P., discount chip, availability and capture note", () => {
    const { view } = mount();
    expect(view.querySelector(".price")?.textContent).toBe("₹28,926");
    expect(view.querySelector(".list-price s")?.textContent).toBe("₹34,990");
    expect(view.querySelector(".discount-chip")?.textContent).toBe("17% off · save ₹6,064");
    expect(view.querySelector(".availability-dot")?.classList.contains("in-stock")).toBe(true);
    expect(view.querySelector(".price-card-note")?.textContent).toContain("Captured");
  });

  test("no discount chip without a real discount", () => {
    const { view } = mount(buildSpecSnapshot({ listPrice: { amount: 28926, currency: "INR" }, availability: null }));
    expect(view.querySelector(".discount-chip")).toBeNull();
    expect(view.querySelector(".list-price")).toBeNull();
    expect(view.querySelector(".availability")).toBeNull();
  });

  test("a missing price says so", () => {
    const { view } = mount(buildSpecSnapshot({ price: null, listPrice: null }));
    expect(view.querySelector(".price-missing")?.textContent).toBe("Price not shown on the page");
    expect(view.querySelector(".price")).toBeNull();
  });
});

describe("highlights", () => {
  test("collapse to the first few and expand with Show all", () => {
    const { view } = mount();
    const items = (): number => view.querySelectorAll(".highlights li").length;
    expect(items()).toBe(COLLAPSED_HIGHLIGHT_COUNT);
    const toggle = view.querySelector(".highlights button") as HTMLButtonElement;
    expect(toggle.textContent).toBe("Show all 4");
    toggle.click();
    expect(items()).toBe(4);
    expect(toggle.textContent).toBe("Show fewer");
    toggle.click();
    expect(items()).toBe(COLLAPSED_HIGHLIGHT_COUNT);
  });

  test("a short list has no toggle and an empty list renders no card", () => {
    const short = mount(buildSpecSnapshot({ highlights: [{ heading: null, text: "One" }] }));
    expect(short.view.querySelector(".highlights button")).toBeNull();
    expect(mount(buildSpecSnapshot({ highlights: [] })).view.querySelector(".highlights")).toBeNull();
  });
});

describe("renderSpecSheetContent", () => {
  test("is a .spec-view size container with no scroll wrapper, and spec cards never use .card", () => {
    const { dom } = createTestDom();
    const content = renderSpecSheetContent(dom, buildSpecSnapshot());
    expect(content.className).toBe("spec-view");
    expect(content.querySelector(".spec-content .spec-sheet-tools")).not.toBeNull();
    expect(content.querySelector(".card")).toBeNull();
    expect(content.querySelectorAll(".spec-card").length).toBeGreaterThan(0);
  });

  test("the popup wrapper is a scrolling <main> around the same content", () => {
    const { view } = mount();
    expect(view.matches("main.body.spec-body")).toBe(true);
    expect(view.querySelector(":scope > .spec-view")).not.toBeNull();
  });
});
