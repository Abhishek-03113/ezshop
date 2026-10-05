import { describe, expect, test } from "bun:test";
import { SettingsStore } from "../src/settings.ts";
import { FakeKeyValueStorage } from "./fakes/fake-key-value-storage.ts";

describe("SettingsStore", () => {
  test("defaults to auto-open ON and first run not dismissed", async () => {
    const store = new SettingsStore(new FakeKeyValueStorage());
    expect(await store.load()).toEqual({ autoOpenSheet: true, firstRunDismissed: false });
    expect(await store.isAutoOpenEnabled()).toBe(true);
  });

  test("persists each change without losing the other setting", async () => {
    const storage = new FakeKeyValueStorage();
    await new SettingsStore(storage).setAutoOpenSheet(false);
    await new SettingsStore(storage).dismissFirstRun();
    expect(await new SettingsStore(storage).load()).toEqual({ autoOpenSheet: false, firstRunDismissed: true });
  });

  test("ignores corrupt stored values", async () => {
    const store = new SettingsStore(new FakeKeyValueStorage({ "ezshop.settings": { autoOpenSheet: "no" } }));
    expect(await store.load()).toEqual({ autoOpenSheet: true, firstRunDismissed: false });
    expect(await new SettingsStore(new FakeKeyValueStorage({ "ezshop.settings": 7 })).load()).toEqual({
      autoOpenSheet: true,
      firstRunDismissed: false,
    });
  });
});
