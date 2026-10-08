import { describe, expect, test } from "bun:test";
import type { WebBridgeRequest } from "@picky/catalog/web-bridge";
import { createWindowExtensionBridge, type BridgeHostWindow } from "../src/api/extension-bridge.ts";

const ORIGIN = "http://web.test";

class FakeHostWindow implements BridgeHostWindow {
  readonly posted: { message: WebBridgeRequest; targetOrigin: string }[] = [];
  readonly location = { origin: ORIGIN };
  readonly document: BridgeHostWindow["document"];
  private readonly listeners = new Set<(event: MessageEvent) => void>();

  constructor(installed: boolean) {
    this.document = { documentElement: { hasAttribute: (name) => installed && name === "data-picky-extension" } };
  }

  addEventListener(_type: "message", listener: (event: MessageEvent) => void): void {
    this.listeners.add(listener);
  }

  removeEventListener(_type: "message", listener: (event: MessageEvent) => void): void {
    this.listeners.delete(listener);
  }

  postMessage(message: WebBridgeRequest, targetOrigin: string): void {
    this.posted.push({ message, targetOrigin });
  }

  get listenerCount(): number {
    return this.listeners.size;
  }

  /** Delivers a message to the page as the extension's content script would (same window). */
  deliver(data: unknown, source: unknown = this): void {
    for (const listener of [...this.listeners]) listener({ data, source } as MessageEvent);
  }
}

const URL_OK = "https://www.amazon.in/dp/B0FQG1YHYR";
const reply = (fields: Record<string, unknown>) => ({ channel: "picky:extension-to-web", requestId: "r1", ...fields });

describe("createWindowExtensionBridge", () => {
  test("is available only when the extension marked the page", () => {
    expect(createWindowExtensionBridge(new FakeHostWindow(true), () => "r1").isAvailable()).toBe(true);
    expect(createWindowExtensionBridge(new FakeHostWindow(false), () => "r1").isAvailable()).toBe(false);
  });

  test("posts the request to its own origin and resolves with the product id of the matching reply", async () => {
    const win = new FakeHostWindow(true);
    const pending = createWindowExtensionBridge(win, () => "r1").importLink(URL_OK);
    expect(win.posted).toEqual([
      {
        message: { channel: "picky:web-to-extension", requestId: "r1", type: "import-link", url: URL_OK },
        targetOrigin: ORIGIN,
      },
    ]);
    win.deliver(reply({ requestId: "other", ok: false, message: "not mine" }));
    win.deliver(reply({ ok: false, message: "from a frame" }), {});
    win.deliver(reply({ ok: true, productId: "p1" }));
    expect(await pending).toBe("p1");
    expect(win.listenerCount).toBe(0);
  });

  test("rejects with the extension's reason", async () => {
    const win = new FakeHostWindow(true);
    const pending = createWindowExtensionBridge(win, () => "r1").importLink(URL_OK);
    win.deliver(reply({ ok: false, message: "Fetching returned HTTP 503" }));
    await expect(pending).rejects.toThrow("Fetching returned HTTP 503");
  });

  test("gives up when the extension never answers", async () => {
    const win = new FakeHostWindow(true);
    await expect(createWindowExtensionBridge(win, () => "r1", 5).importLink(URL_OK)).rejects.toThrow(
      "did not answer within",
    );
    expect(win.listenerCount).toBe(0);
  });
});
