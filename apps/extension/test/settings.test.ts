import { describe, expect, test } from "bun:test";
import { SettingsStore } from "../src/settings.ts";
import { FakeKeyValueStorage } from "./fakes/fake-key-value-storage.ts";

describe("SettingsStore", () => {
  test("defaults to auto-open OFF and first run not dismissed", async () => {
    const store = new SettingsStore(new FakeKeyValueStorage());
    expect(await store.load()).toEqual({ autoOpenSheet: false, firstRunDismissed: false, lastComparisonId: null });
    expect(await store.isAutoOpenEnabled()).toBe(false);
  });

  test("persists each change without losing the other setting", async () => {
    const storage = new FakeKeyValueStorage();
    await new SettingsStore(storage).setAutoOpenSheet(true);
    await new SettingsStore(storage).dismissFirstRun();
    expect(await new SettingsStore(storage).load()).toEqual({
      autoOpenSheet: true,
      firstRunDismissed: true,
      lastComparisonId: null,
    });
  });

  test("ignores corrupt stored values", async () => {
    const store = new SettingsStore(new FakeKeyValueStorage({ "ezshop.settings": { autoOpenSheet: "no" } }));
    expect(await store.load()).toEqual({ autoOpenSheet: false, firstRunDismissed: false, lastComparisonId: null });
    expect(await new SettingsStore(new FakeKeyValueStorage({ "ezshop.settings": 7 })).load()).toEqual({
      autoOpenSheet: false,
      firstRunDismissed: false,
      lastComparisonId: null,
    });
  });

  test("remembers the last-used comparison alongside the other settings", async () => {
    const storage = new FakeKeyValueStorage();
    await new SettingsStore(storage).dismissFirstRun();
    await new SettingsStore(storage).setLastComparisonId("cmp-1");
    const store = new SettingsStore(storage);
    expect(await store.lastComparisonId()).toBe("cmp-1");
    expect((await store.load()).firstRunDismissed).toBe(true);
  });
});
