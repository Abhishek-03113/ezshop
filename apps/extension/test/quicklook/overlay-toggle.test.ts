import { describe, expect, test } from "bun:test";
import { Window } from "happy-dom";
import { QuickLookOverlay } from "../../src/quicklook/overlay-host.ts";
import type { QuickLookView } from "../../src/quicklook/quicklook-model.ts";
import { FakeQuickLookApi } from "../fakes/fake-quicklook-api.ts";
import { buildSpecSnapshot } from "../support/build-spec-snapshot.ts";

function setup(onProductPage = true) {
  const document = new Window().document as unknown as Document;
  const api = new FakeQuickLookApi([{ id: "c1", name: "Monitors", productIds: [], updatedAt: "t" }], { c1: [] });
  const page = onProductPage ? buildSpecSnapshot() : null;
  const overlay = new QuickLookOverlay({ document, stylesheet: "", api, readPage: () => page });
  return { document, overlay };
}

/** Lets the controller's initial load finish; rendering into a closed (detached) root trips happy-dom only. */
const settle = (): Promise<void> => Bun.sleep(0);

const isOpen = (document: Document): boolean => document.querySelector("picky-quick-look") !== null;

/** Opens a fresh overlay on `view`; the shadow root is closed, so tests observe open/closed via the host element. */
function openOn(view: QuickLookView, onProductPage = true) {
  const context = setup(onProductPage);
  context.overlay.toggle(view);
  return context;
}

describe("QuickLookOverlay.toggle", () => {
  test("opens when closed", async () => {
    const { document } = openOn("specs");
    await settle();
    expect(isOpen(document)).toBe(true);
  });

  test("the same view closes it", async () => {
    const { document, overlay } = openOn("compare");
    await settle();
    overlay.toggle("compare");
    expect(isOpen(document)).toBe(false);
  });

  test("the other view switches and stays open, then its own shortcut closes", async () => {
    const { document, overlay } = openOn("specs");
    await settle();
    overlay.toggle("compare");
    expect(isOpen(document)).toBe(true);
    overlay.toggle("compare");
    expect(isOpen(document)).toBe(false);
  });

  test("specs requested off a product page shows compare, so the compare shortcut closes", async () => {
    const { document, overlay } = openOn("specs", false);
    await settle();
    overlay.toggle("compare");
    expect(isOpen(document)).toBe(false);
  });

  // Regression: off a product page the specs shortcut opens compare; pressing it again must still close.
  test("specs shortcut twice off a product page closes", async () => {
    const { document, overlay } = openOn("specs", false);
    await settle();
    overlay.toggle("specs");
    expect(isOpen(document)).toBe(false);
  });

  test("can reopen after closing", async () => {
    const { document, overlay } = openOn("specs");
    await settle();
    overlay.toggle("specs");
    overlay.toggle("compare");
    expect(isOpen(document)).toBe(true);
  });
});

describe("QuickLookOverlay.showProduct", () => {
  test("opens on a linked product's specs even off a product page", async () => {
    const { document, overlay } = setup(false);
    overlay.showProduct(buildSpecSnapshot());
    await settle();
    expect(isOpen(document)).toBe(true);
    // Specs are on screen, so the compare shortcut switches (stays open) instead of closing.
    overlay.toggle("compare");
    expect(isOpen(document)).toBe(true);
  });

  test("replaces an open overlay instead of stacking a second one", async () => {
    const { document, overlay } = openOn("compare");
    await settle();
    overlay.showProduct(buildSpecSnapshot());
    await settle();
    expect(document.querySelectorAll("picky-quick-look")).toHaveLength(1);
  });
});
