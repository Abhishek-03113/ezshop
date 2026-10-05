import { describe, expect, test } from "bun:test";
import type { ExtensionResponse, QuickLookRequest, QuickLookState } from "../../src/messaging/messages.ts";
import { ChromeQuickLookApi } from "../../src/quicklook/chrome-quicklook-api.ts";
import { FakeRuntimeMessenger } from "../fakes/fake-runtime-messenger.ts";
import { buildSnapshot } from "../support/build-snapshot.ts";
import { stateWith } from "../support/quicklook-state.ts";

type Reply = ExtensionResponse<QuickLookState>;

describe("ChromeQuickLookApi", () => {
  test("sends typed requests and returns the state", async () => {
    const state = stateWith("c1", []);
    const messenger = new FakeRuntimeMessenger<QuickLookRequest, Reply>({ ok: true, body: state });
    const api = new ChromeQuickLookApi(messenger.send);
    expect(await api.init()).toBe(state);
    await api.select("c2");
    await api.add(null, buildSnapshot());
    await api.remove("c1", "p1");
    expect(messenger.sent.map((request) => request.type)).toEqual([
      "quicklook:init",
      "quicklook:select",
      "quicklook:add",
      "quicklook:remove",
    ]);
  });
  test("throws the worker's reason on ok:false", async () => {
    const api = new ChromeQuickLookApi(
      new FakeRuntimeMessenger<QuickLookRequest, Reply>({ ok: false, message: "API down" }).send,
    );
    await expect(api.init()).rejects.toThrow("API down");
  });
  test("throws when the worker does not answer", async () => {
    const api = new ChromeQuickLookApi(new FakeRuntimeMessenger<QuickLookRequest, Reply>(undefined).send);
    await expect(api.select("c1")).rejects.toThrow("did not answer quicklook:select");
  });
});
