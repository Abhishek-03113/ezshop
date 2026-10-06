import { describe, expect, test } from "bun:test";
import { BadgeCounter } from "../../src/link-capture/badge-counter.ts";
import { LinkCaptureService } from "../../src/link-capture/link-capture-service.ts";
import { SettingsStore } from "../../src/settings.ts";
import { FakeComparisonsClient } from "../fakes/fake-comparisons-client.ts";
import { FakeKeyValueStorage } from "../fakes/fake-key-value-storage.ts";
import { FakeBadgeText, FakeHtmlFetcher, FakeSnapshotReader, FakeToastPort } from "../fakes/fake-link-capture-ports.ts";
import { buildSnapshot } from "../support/build-snapshot.ts";

const URL_OK = "https://www.amazon.in/dp/B0FQG1YHYR";
const SNAPSHOT = {
  ...buildSnapshot(),
  specGroups: [
    {
      title: "G",
      specs: [
        { label: "a", value: "1" },
        { label: "b", value: "2" },
      ],
    },
  ],
};

function setup(options: { reader?: FakeSnapshotReader; lastUsed?: string; seed?: boolean } = {}) {
  const client = new FakeComparisonsClient(
    options.seed === false
      ? []
      : [
          { id: "c1", name: "Monitors", productIds: ["x"] },
          { id: "c2", name: "Phones", productIds: [] },
        ],
  );
  const toasts = new FakeToastPort();
  const badge = new FakeBadgeText();
  const settings = new SettingsStore(
    new FakeKeyValueStorage(options.lastUsed ? { "picky.settings": { lastComparisonId: options.lastUsed } } : {}),
  );
  const fetcher = new FakeHtmlFetcher({ [URL_OK]: "<html></html>" });
  const changes = { count: 0 };
  const service = new LinkCaptureService({
    fetcher,
    reader: options.reader ?? new FakeSnapshotReader(SNAPSHOT),
    sendSnapshot: async () => "p-new",
    comparisons: client,
    settings,
    toasts,
    badge: new BadgeCounter(badge),
    newToastId: () => "t1",
    onComparisonsChanged: () => void (changes.count += 1),
    log: () => {},
  });
  return { service, client, toasts, badge, settings, fetcher, changes };
}

const job = (target: Parameters<LinkCaptureService["add"]>[0]["target"], url = URL_OK) => ({
  url,
  label: "",
  target,
  tabId: 7,
});

describe("LinkCaptureService", () => {
  test("reads, adds to the chosen comparison and toasts reading then added", async () => {
    const { service, client, toasts, settings } = setup();
    await service.add(job({ kind: "comparison", comparisonId: "c2" }));
    expect(client.calls).toContain("add c2 p-new");
    expect(toasts.kinds).toEqual(["reading", "added"]);
    expect(toasts.shown[0]?.message).toMatchObject({ title: "product", destination: "your comparison" });
    expect(toasts.shown[1]?.message).toMatchObject({
      title: "Apple iPhone 17",
      specCount: 2,
      placement: { comparisonName: "Phones", count: 0 },
      undo: { comparisonId: "c2", productId: "p-new" },
    });
    expect(toasts.shown.every((entry) => entry.tabId === 7)).toBe(true);
    expect(await settings.lastComparisonId()).toBe("c2");
  });

  test("badge counts while in flight and clears afterwards", async () => {
    const { service, badge } = setup();
    await service.add(job({ kind: "library" }));
    expect(badge.texts).toEqual(["1", ""]);
  });

  test("Alt+click target uses the last-used comparison", async () => {
    const { service, client } = setup({ lastUsed: "c2" });
    await service.add(job({ kind: "last" }));
    expect(client.calls).toContain("add c2 p-new");
  });

  test("last target falls back to the first comparison, then to creating one", async () => {
    const first = setup({ lastUsed: "gone" });
    await first.service.add(job({ kind: "last" }));
    expect(first.client.calls).toContain("add c1 p-new");
    const none = setup({ seed: false });
    await none.service.add(job({ kind: "last" }));
    expect(none.client.calls).toContain("create New comparison [p-new]");
  });

  test("Library only saves without touching comparisons and offers no undo", async () => {
    const { service, client, toasts } = setup();
    await service.add(job({ kind: "library" }));
    expect(client.calls).toEqual([]);
    expect(toasts.shown[1]?.message).toMatchObject({ placement: null, undo: null });
  });

  test("New comparison is named after the category", async () => {
    const { service, client } = setup({ reader: new FakeSnapshotReader({ ...SNAPSHOT, category: "Monitors" }) });
    await service.add(job({ kind: "new" }));
    expect(client.calls).toContain("create Monitors [p-new]");
  });

  test("refreshes the context menu after a placement", async () => {
    const { service, changes } = setup();
    await service.add(job({ kind: "comparison", comparisonId: "c1" }));
    expect(changes.count).toBe(1);
  });

  test("a parse failure ends in an error toast with the reason and a cleared badge", async () => {
    const { service, toasts, badge } = setup({
      reader: new FakeSnapshotReader(SNAPSHOT, new Error("not a product page")),
    });
    await service.add(job({ kind: "last" }));
    expect(toasts.shown[1]?.message).toEqual({ kind: "failed", id: "t1", reason: "not a product page" });
    expect(badge.texts.at(-1)).toBe("");
  });

  test("a fetch failure becomes an error toast", async () => {
    const { service, toasts } = setup();
    await service.add(job({ kind: "last" }, "https://www.amazon.in/dp/B000000000"));
    expect(toasts.kinds).toEqual(["reading", "failed"]);
  });

  test("an unsupported link is rejected before any fetch", async () => {
    const { service, fetcher, toasts, badge } = setup();
    await service.add(job({ kind: "last" }, "https://evil.example/dp/B0FQG1YHYR"));
    expect(fetcher.fetched).toEqual([]);
    expect(toasts.kinds).toEqual(["failed"]);
    expect(badge.texts).toEqual([]);
  });

  test("undo removes the product and refreshes the menu", async () => {
    const { service, client, changes } = setup();
    await service.undo("c1", "x");
    expect(client.calls).toContain("remove c1 x");
    expect(changes.count).toBe(1);
  });
});
