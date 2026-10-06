import { describe, expect, test } from "bun:test";
import type { ProductSnapshot } from "@picky/catalog";
import type { CaptureResult } from "../src/capture-result.ts";
import { runCaptureFlow } from "../src/capture-flow.ts";
import { SettingsStore } from "../src/settings.ts";
import { FakeBrowserPort } from "./fakes/fake-browser-port.ts";
import { FakeKeyValueStorage } from "./fakes/fake-key-value-storage.ts";
import { buildSnapshot } from "./support/build-snapshot.ts";

const PRODUCT_TAB = { id: 7, url: "https://www.amazon.in/dp/B0FQG1YHYR" };
const CONFIG = { apiBaseUrl: "http://api", webBaseUrl: "http://web" };

function createDeps(
  captureResult: CaptureResult,
  sendSnapshot: (snapshot: ProductSnapshot) => Promise<string>,
  storage: FakeKeyValueStorage = new FakeKeyValueStorage(),
) {
  const browser = new FakeBrowserPort(captureResult);
  const events: string[] = [];
  return {
    browser,
    events,
    deps: {
      browser,
      config: CONFIG,
      sendSnapshot,
      settings: new SettingsStore(storage),
      log: (event: string) => void events.push(event),
    },
  };
}

describe("runCaptureFlow", () => {
  test("captures, sends and opens the spec sheet when auto-open is on", async () => {
    const storage = new FakeKeyValueStorage({ "picky.settings": { autoOpenSheet: true } });
    const { browser, events, deps } = createDeps({ ok: true, snapshot: buildSnapshot() }, async () => "p1", storage);
    const outcome = await runCaptureFlow(PRODUCT_TAB, deps);
    expect(outcome.kind).toBe("saved");
    expect(browser.openedUrls).toEqual(["http://web/products/p1"]);
    expect(browser.badges).toEqual(["working", "done"]);
    expect(events).toEqual(["capture.sent"]);
  });

  test("saves without opening the sheet by default, reporting progress", async () => {
    const { browser, deps } = createDeps({ ok: true, snapshot: buildSnapshot() }, async () => "p1");
    const phases: string[] = [];
    const outcome = await runCaptureFlow(PRODUCT_TAB, deps, (phase) => phases.push(phase));
    expect(outcome).toMatchObject({ kind: "saved", summary: { productId: "p1" } });
    expect(browser.openedUrls).toEqual([]);
    expect(browser.badges).toEqual(["working", "done"]);
    expect(phases).toEqual(["reading", "saving"]);
  });

  test("marks unsupported pages without capturing", async () => {
    const { browser, deps } = createDeps({ ok: true, snapshot: buildSnapshot() }, async () => "p1");
    const outcome = await runCaptureFlow({ id: 7, url: "https://www.amazon.in/s?k=iphone" }, deps);
    expect(outcome).toEqual({ kind: "unsupported" });
    expect(browser.badges).toEqual(["unsupported"]);
    expect(browser.openedUrls).toEqual([]);
  });

  test("shows a failure badge when the page cannot be read or the API refuses", async () => {
    const unreadable = createDeps({ ok: false, message: "no title" }, async () => "p1");
    const unreadableOutcome = await runCaptureFlow(PRODUCT_TAB, unreadable.deps);
    expect(unreadableOutcome).toEqual({ kind: "failed", message: "no title" });
    expect(unreadable.browser.badges).toEqual(["working", "failed"]);
    const refused = createDeps({ ok: true, snapshot: buildSnapshot() }, async () =>
      Promise.reject(new Error("HTTP 500")),
    );
    await runCaptureFlow(PRODUCT_TAB, refused.deps);
    expect(refused.events).toEqual(["capture.failed"]);
  });
});
