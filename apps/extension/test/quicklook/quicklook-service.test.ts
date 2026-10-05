import { describe, expect, test } from "bun:test";
import { QuickLookService } from "../../src/quicklook/quicklook-service.ts";
import { SettingsStore } from "../../src/settings.ts";
import { FakeComparisonsClient } from "../fakes/fake-comparisons-client.ts";
import { FakeKeyValueStorage } from "../fakes/fake-key-value-storage.ts";
import { buildCatalogProduct } from "../support/build-snapshot.ts";
import { buildSnapshot } from "../support/build-snapshot.ts";

function setup(options: { lastUsed?: string } = {}) {
  const p1 = buildCatalogProduct("p1");
  const client = new FakeComparisonsClient(
    [
      { id: "c1", name: "Monitors", productIds: ["p1"] },
      { id: "c2", name: "Phones", productIds: [] },
    ],
    { p1 },
  );
  const settings = new SettingsStore(
    new FakeKeyValueStorage(options.lastUsed ? { "ezshop.settings": { lastComparisonId: options.lastUsed } } : {}),
  );
  const changes = { count: 0 };
  const service = new QuickLookService({
    comparisons: client,
    settings,
    sendSnapshot: async () => "p-new",
    webBaseUrl: "http://web",
    onComparisonsChanged: () => void (changes.count += 1),
  });
  return { client, settings, service, changes };
}

describe("QuickLookService", () => {
  test("init selects the last-used comparison", async () => {
    const state = await setup({ lastUsed: "c2" }).service.init();
    expect(state.selectedId).toBe("c2");
    expect(state.comparisons.map((comparison) => comparison.id)).toEqual(["c1", "c2"]);
    expect(state.webBaseUrl).toBe("http://web");
  });

  test("init falls back to the first comparison when the remembered one is gone", async () => {
    const state = await setup({ lastUsed: "deleted" }).service.init();
    expect(state.selectedId).toBe("c1");
    expect(state.products.map((product) => product.id)).toEqual(["p1"]);
  });

  test("init with no comparisons selects nothing", async () => {
    const service = new QuickLookService({
      comparisons: new FakeComparisonsClient(),
      settings: new SettingsStore(new FakeKeyValueStorage()),
      sendSnapshot: async () => "x",
      webBaseUrl: "http://web",
      onComparisonsChanged: () => {},
    });
    expect(await service.init()).toMatchObject({ selectedId: null, products: [], comparisons: [] });
  });

  test("select remembers the comparison", async () => {
    const { service, settings } = setup();
    expect((await service.select("c2")).selectedId).toBe("c2");
    expect(await settings.lastComparisonId()).toBe("c2");
  });

  test("add stores the snapshot, adds it to the comparison and remembers it", async () => {
    const { service, client, settings, changes } = setup();
    const state = await service.add("c2", buildSnapshot());
    expect(client.calls).toContain("add c2 p-new");
    expect(state.selectedId).toBe("c2");
    expect(await settings.lastComparisonId()).toBe("c2");
    expect(changes.count).toBe(1);
  });

  test("add without a comparison creates one named after the category", async () => {
    const { service, client } = setup();
    const state = await service.add(null, { ...buildSnapshot(), category: "Monitors" });
    expect(client.calls).toContain("create Monitors [p-new]");
    expect(state.selectedId).toBe("new-1");
  });

  test("add without a comparison or category uses the generic name", async () => {
    const { service, client } = setup();
    await service.add(null, buildSnapshot());
    expect(client.calls).toContain("create My comparison [p-new]");
  });

  test("remove drops the product", async () => {
    const { service, client } = setup();
    const state = await service.remove("c1", "p1");
    expect(client.calls).toContain("remove c1 p1");
    expect(state.products).toEqual([]);
  });
});
