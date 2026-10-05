import { describe, expect, test } from "bun:test";
import type { ProductSnapshot } from "@ezshop/catalog";
import type { CaptureResult } from "../src/capture-result.ts";
import { runCaptureFlow } from "../src/capture-flow.ts";
import { FakeBrowserPort } from "./fakes/fake-browser-port.ts";
import { buildSnapshot } from "./support/build-snapshot.ts";

const PRODUCT_TAB = { id: 7, url: "https://www.amazon.in/dp/B0FQG1YHYR" };
const CONFIG = { apiBaseUrl: "http://api", webBaseUrl: "http://web" };

function createDeps(captureResult: CaptureResult, sendSnapshot: (snapshot: ProductSnapshot) => Promise<string>) {
  const browser = new FakeBrowserPort(captureResult);
  const events: string[] = [];
  return {
    browser,
    events,
    deps: { browser, config: CONFIG, sendSnapshot, log: (event: string) => void events.push(event) },
  };
}

describe("runCaptureFlow", () => {
  test("captures, sends and opens the spec sheet", async () => {
    const { browser, events, deps } = createDeps({ ok: true, snapshot: buildSnapshot() }, async () => "p1");
    await runCaptureFlow(PRODUCT_TAB, deps);
    expect(browser.openedUrls).toEqual(["http://web/products/p1"]);
    expect(browser.badges).toEqual(["working", "done"]);
    expect(events).toEqual(["capture.sent"]);
  });

  test("marks unsupported pages without capturing", async () => {
    const { browser, deps } = createDeps({ ok: true, snapshot: buildSnapshot() }, async () => "p1");
    await runCaptureFlow({ id: 7, url: "https://www.amazon.in/s?k=iphone" }, deps);
    expect(browser.badges).toEqual(["unsupported"]);
    expect(browser.openedUrls).toEqual([]);
  });

  test("shows a failure badge when the page cannot be read or the API refuses", async () => {
    const unreadable = createDeps({ ok: false, message: "no title" }, async () => "p1");
    await runCaptureFlow(PRODUCT_TAB, unreadable.deps);
    expect(unreadable.browser.badges).toEqual(["working", "failed"]);
    const refused = createDeps({ ok: true, snapshot: buildSnapshot() }, async () =>
      Promise.reject(new Error("HTTP 500")),
    );
    await runCaptureFlow(PRODUCT_TAB, refused.deps);
    expect(refused.events).toEqual(["capture.failed"]);
  });
});
