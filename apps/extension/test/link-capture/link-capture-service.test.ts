import { describe, expect, test } from "bun:test";
import { BadgeCounter } from "../../src/link-capture/badge-counter.ts";
import { LinkCaptureService } from "../../src/link-capture/link-capture-service.ts";
import { SettingsStore } from "../../src/settings.ts";
import { FakeComparisonsClient } from "../fakes/fake-comparisons-client.ts";
import { FakeKeyValueStorage } from "../fakes/fake-key-value-storage.ts";
import { FakeBadgeText, FakeHtmlFetcher, FakeProductReader, FakeToastPort } from "../fakes/fake-link-capture-ports.ts";
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

function setup(options: { reader?: FakeProductReader; lastUsed?: string; seed?: boolean } = {}) {
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
  const reader = options.reader ?? new FakeProductReader(SNAPSHOT);
  const sentSnapshots: string[] = [];
  const quickLooks: { tabId: number; externalId: string }[] = [];
  const service = new LinkCaptureService({
    fetcher,
    reader,
    capturePage: reader.capturePage,
    sendSnapshot: async (snapshot) => {
      sentSnapshots.push(snapshot.externalId);
      return "p-new";
    },
    showQuickLook: async (tabId, snapshot) => void quickLooks.push({ tabId, externalId: snapshot.externalId }),
    comparisons: client,
    settings,
    toasts,
    badge: new BadgeCounter(badge),
    newToastId: () => "t1",
    onComparisonsChanged: () => void (changes.count += 1),
    log: () => {},
  });
  return { service, client, toasts, badge, settings, fetcher, reader, sentSnapshots, quickLooks, changes };
}

type AddJob = Parameters<LinkCaptureService["add"]>[0];

const job = (target: AddJob["target"], url = URL_OK, source: AddJob["source"] = "link"): AddJob => ({
  url,
  label: "",
  target,
  tabId: 7,
  source,
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

  test("a link is downloaded, parsed here and sent as a snapshot, never captured from the tab", async () => {
    const { service, fetcher, reader, sentSnapshots } = setup();
    await service.add(job({ kind: "library" }));
    expect(fetcher.fetched).toEqual([URL_OK]);
    expect(reader.parsed).toEqual([{ url: URL_OK, html: "<html></html>" }]);
    expect(reader.capturedTabs).toEqual([]);
    expect(sentSnapshots).toEqual([SNAPSHOT.externalId]);
  });

  test("the open product page is read from its DOM and sent as a snapshot, without fetching", async () => {
    const { service, fetcher, reader, sentSnapshots, client } = setup();
    await service.add(job({ kind: "comparison", comparisonId: "c1" }, URL_OK, "page"));
    expect(reader.capturedTabs).toEqual([7]);
    expect(fetcher.fetched).toEqual([]);
    expect(sentSnapshots).toEqual([SNAPSHOT.externalId]);
    expect(client.calls).toContain("add c1 p-new");
  });

  test("a failed DOM capture ends in an error toast with its message", async () => {
    const { service, toasts } = setup({ reader: new FakeProductReader(SNAPSHOT, new Error("No #productTitle")) });
    await service.add(job({ kind: "library" }, URL_OK, "page"));
    expect(toasts.shown[1]?.message).toEqual({ kind: "failed", id: "t1", reason: "No #productTitle" });
  });

  test("importLink saves to the library only, without toasts or badge", async () => {
    const { service, client, toasts, badge } = setup();
    expect(await service.importLink(URL_OK)).toBe("p-new");
    expect(client.calls).toEqual([]);
    expect(toasts.shown).toEqual([]);
    expect(badge.texts).toEqual([]);
  });

  test("importLink refuses unsupported links before fetching", async () => {
    const { service, fetcher } = setup();
    await expect(service.importLink("https://evil.example/dp/B0FQG1YHYR")).rejects.toThrow("is not a product link");
    expect(fetcher.fetched).toEqual([]);
  });

  test("Quick Look on a link parses it and shows it in the tab without saving or toasting", async () => {
    const { service, fetcher, sentSnapshots, quickLooks, client, toasts, badge } = setup();
    await service.quickLook(URL_OK, 7);
    expect(fetcher.fetched).toEqual([URL_OK]);
    expect(quickLooks).toEqual([{ tabId: 7, externalId: SNAPSHOT.externalId }]);
    expect(sentSnapshots).toEqual([]);
    expect(client.calls).toEqual([]);
    expect(toasts.shown).toEqual([]);
    expect(badge.texts).toEqual(["1", ""]);
  });

  test("a failed Quick Look ends in an error toast", async () => {
    const { service, quickLooks, toasts } = setup({
      reader: new FakeProductReader(SNAPSHOT, new Error("No #productTitle")),
    });
    await service.quickLook(URL_OK, 7);
    expect(quickLooks).toEqual([]);
    expect(toasts.shown[0]?.message).toEqual({ kind: "failed", id: "t1", reason: "No #productTitle" });
  });

  test("Quick Look refuses unsupported links before fetching", async () => {
    const { service, fetcher, toasts } = setup();
    await service.quickLook("https://evil.example/dp/B0FQG1YHYR", 7);
    expect(fetcher.fetched).toEqual([]);
    expect(toasts.kinds).toEqual(["failed"]);
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
    const { service, client } = setup({ reader: new FakeProductReader({ ...SNAPSHOT, category: "Monitors" }) });
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
      reader: new FakeProductReader(SNAPSHOT, new Error("not a product page")),
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
