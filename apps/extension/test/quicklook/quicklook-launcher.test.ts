import { describe, expect, test } from "bun:test";
import { toggleQuickLook } from "../../src/quicklook/quicklook-launcher.ts";
import { FakeQuickLookTabPort } from "../fakes/fake-quicklook-tab-port.ts";

const logs: string[] = [];
const log = (event: string) => void logs.push(event);

describe("toggleQuickLook", () => {
  test("injects and toggles on a scriptable tab", async () => {
    const port = new FakeQuickLookTabPort(false);
    await toggleQuickLook({ id: 7, url: "https://www.amazon.in/dp/B0FQG1YHYR" }, port, log);
    expect(port.toggled).toEqual([7]);
    expect(port.popups).toEqual([]);
  });

  test("falls back to the popup when injection is impossible", async () => {
    const port = new FakeQuickLookTabPort(true);
    await toggleQuickLook({ id: 3, url: "chrome://extensions" }, port, log);
    expect(port.popups).toEqual([3]);
    expect(logs).toContain("quicklook.fallback_popup");
  });

  test("never throws when the popup fallback fails too", async () => {
    await toggleQuickLook({ id: 3 }, new FakeQuickLookTabPort(true, true), log);
    expect(logs).toContain("quicklook.popup_failed");
  });

  test("does nothing without a tab id", async () => {
    const port = new FakeQuickLookTabPort(false);
    await toggleQuickLook({}, port, log);
    expect(port.toggled).toEqual([]);
    expect(logs).toContain("quicklook.no_tab");
  });
});
