import { describe, expect, test } from "bun:test";
import type { WebBridgeReply } from "@picky/catalog/web-bridge";
import type { ExtensionResponse } from "../../src/messaging/messages.ts";
import { serveWebBridge, type BridgeWindow } from "../../src/web-bridge/serve-web-bridge.ts";

const ORIGIN = "http://web.test";

class FakeBridgeWindow implements BridgeWindow {
  readonly attributes = new Map<string, string>();
  readonly posted: { message: WebBridgeReply; targetOrigin: string }[] = [];
  readonly location = { origin: ORIGIN };
  readonly document = {
    documentElement: { setAttribute: (name: string, value: string) => this.attributes.set(name, value) },
  };
  private listener: ((event: MessageEvent) => void) | null = null;

  addEventListener(_type: "message", listener: (event: MessageEvent) => void): void {
    this.listener = listener;
  }

  postMessage(message: WebBridgeReply, targetOrigin: string): void {
    this.posted.push({ message, targetOrigin });
  }

  /** Delivers a message as if posted by `source` from `origin`, then lets the async answer settle. */
  async receive(data: unknown, options: { source?: unknown; origin?: string } = {}): Promise<void> {
    const event = { data, source: options.source ?? this, origin: options.origin ?? ORIGIN } as MessageEvent;
    this.listener?.(event);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

const request = (url = "https://www.amazon.in/dp/B0FQG1YHYR") => ({
  channel: "picky:web-to-extension",
  requestId: "r1",
  type: "import-link",
  url,
});

function setup(answer: (url: string) => Promise<ExtensionResponse<string> | undefined>) {
  const win = new FakeBridgeWindow();
  const asked: string[] = [];
  serveWebBridge(win, (url) => {
    asked.push(url);
    return answer(url);
  });
  return { win, asked };
}

describe("serveWebBridge", () => {
  test("marks the page as extension-enabled", () => {
    const { win } = setup(async () => undefined);
    expect(win.attributes.get("data-picky-extension")).toBe("ready");
  });

  test("relays an import and posts the product back to the same origin", async () => {
    const { win, asked } = setup(async () => ({ ok: true, body: "p1" }));
    await win.receive(request());
    expect(asked).toEqual(["https://www.amazon.in/dp/B0FQG1YHYR"]);
    expect(win.posted).toEqual([
      {
        message: { channel: "picky:extension-to-web", requestId: "r1", ok: true, productId: "p1" },
        targetOrigin: ORIGIN,
      },
    ]);
  });

  test("passes the worker's failure message through", async () => {
    const { win } = setup(async () => ({ ok: false, message: "HTTP 503" }));
    await win.receive(request());
    expect(win.posted[0]?.message).toEqual({
      channel: "picky:extension-to-web",
      requestId: "r1",
      ok: false,
      message: "HTTP 503",
    });
  });

  test("reports a worker that never answered or threw", async () => {
    const silent = setup(async () => undefined);
    await silent.win.receive(request());
    expect(silent.win.posted[0]?.message).toMatchObject({ ok: false, message: "The Picky extension did not answer" });
    const broken = setup(async () => Promise.reject(new Error("Extension context invalidated")));
    await broken.win.receive(request());
    expect(broken.win.posted[0]?.message).toMatchObject({ ok: false, message: "Extension context invalidated" });
  });

  test("ignores frames, other origins and foreign messages", async () => {
    const { win, asked } = setup(async () => ({ ok: true, body: "p1" }));
    await win.receive(request(), { source: {} });
    await win.receive(request(), { origin: "https://evil.test" });
    await win.receive({ type: "import-link", url: "x" });
    expect(asked).toEqual([]);
    expect(win.posted).toEqual([]);
  });
});
