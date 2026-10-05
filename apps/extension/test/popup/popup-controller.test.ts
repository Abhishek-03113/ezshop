import { describe, expect, test } from "bun:test";
import { summarizeSnapshot } from "../../src/capture-outcome.ts";
import { hostLabelOf, PopupController } from "../../src/popup/popup-controller.ts";
import { SettingsStore } from "../../src/settings.ts";
import { FakeActiveTabSource } from "../fakes/fake-active-tab-source.ts";
import { FakeCaptureService } from "../fakes/fake-capture-service.ts";
import { FakeKeyValueStorage } from "../fakes/fake-key-value-storage.ts";
import { buildSnapshot } from "../support/build-snapshot.ts";
import { createTestDom } from "./support.ts";

const TAB = { id: 7, url: "https://www.amazon.in/dp/B0FQG1YHYR" };
const SAVED = { kind: "saved", summary: summarizeSnapshot("p1", buildSnapshot()) } as const;
const SEEN_BEFORE = { "ezshop.settings": { firstRunDismissed: true } };

function createController(storage: FakeKeyValueStorage, service: FakeCaptureService, tab: typeof TAB | null = TAB) {
  const { root } = createTestDom();
  const controller = new PopupController({
    root,
    settings: new SettingsStore(storage),
    tabs: new FakeActiveTabSource(tab),
    captureService: service,
    webBaseUrl: "http://web",
  });
  return { root, controller };
}

describe("PopupController", () => {
  test("first run shows the welcome board and does not capture", async () => {
    const service = new FakeCaptureService(SAVED);
    const { root, controller } = createController(new FakeKeyValueStorage(), service);
    await controller.start();
    expect(root.textContent).toContain("You're all set");
    expect(service.requestedTabs).toEqual([]);
  });

  test("Got it persists the dismissal and then captures", async () => {
    const storage = new FakeKeyValueStorage();
    const service = new FakeCaptureService(SAVED);
    const { root, controller } = createController(storage, service);
    await controller.start();
    (root.querySelector("button.button-primary") as HTMLButtonElement).click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect((await new SettingsStore(storage).load()).firstRunDismissed).toBe(true);
    expect(service.requestedTabs).toEqual([TAB]);
    expect(root.textContent).toContain("Saved to your library");
  });

  test("later opens capture straight away", async () => {
    const service = new FakeCaptureService(SAVED);
    const { root, controller } = createController(new FakeKeyValueStorage(SEEN_BEFORE), service);
    await controller.start();
    expect(service.requestedTabs).toEqual([TAB]);
    expect(root.textContent).toContain("Saved to your library");
  });

  test("shows unsupported and failed states", async () => {
    const unsupported = createController(
      new FakeKeyValueStorage(SEEN_BEFORE),
      new FakeCaptureService({ kind: "unsupported" }),
    );
    await unsupported.controller.start();
    expect(unsupported.root.textContent).toContain("No product on this page");
    const failed = createController(
      new FakeKeyValueStorage(SEEN_BEFORE),
      new FakeCaptureService(new Error("worker gone")),
    );
    await failed.controller.start();
    expect(failed.root.textContent).toContain("worker gone");
  });

  test("an unreadable active tab is treated as not a product page", async () => {
    const service = new FakeCaptureService(SAVED);
    const { root, controller } = createController(new FakeKeyValueStorage(SEEN_BEFORE), service, null);
    await controller.start();
    expect(root.textContent).toContain("No product on this page");
    expect(service.requestedTabs).toEqual([]);
  });

  test("the switch saves the auto-open preference", async () => {
    const storage = new FakeKeyValueStorage(SEEN_BEFORE);
    const { root, controller } = createController(storage, new FakeCaptureService(SAVED));
    await controller.start();
    (root.querySelector('[role="switch"]') as HTMLButtonElement).click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(await new SettingsStore(storage).isAutoOpenEnabled()).toBe(false);
  });
});

describe("hostLabelOf", () => {
  test("drops www and tolerates garbage", () => {
    expect(hostLabelOf("https://www.amazon.in/dp/X")).toBe("amazon.in");
    expect(hostLabelOf("not a url")).toBeNull();
  });
});
