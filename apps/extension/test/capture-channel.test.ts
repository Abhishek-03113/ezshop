import { describe, expect, test } from "bun:test";
import type { CaptureEvent, CaptureRequest } from "../src/capture-protocol.ts";
import { serveCaptureRequests } from "../src/serve-capture-requests.ts";
import { PortCaptureService } from "../src/popup/capture-service.ts";
import { FakeDuplexPort } from "./fakes/fake-duplex-port.ts";

const TAB = { id: 7, url: "https://www.amazon.in/dp/B0FQG1YHYR" };
const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe("serveCaptureRequests", () => {
  test("streams progress then the outcome back to the popup", async () => {
    const port = new FakeDuplexPort<CaptureEvent, CaptureRequest>();
    serveCaptureRequests(port, async (_tab, onProgress) => {
      onProgress("reading");
      return { kind: "unsupported" };
    });
    port.deliver({ type: "capture", tab: TAB });
    await flush();
    expect(port.sent).toEqual([
      { type: "progress", phase: "reading" },
      { type: "outcome", outcome: { kind: "unsupported" } },
    ]);
  });

  test("keeps capturing but stops sending once the popup closed", async () => {
    const port = new FakeDuplexPort<CaptureEvent, CaptureRequest>();
    let finished = false;
    serveCaptureRequests(port, async () => {
      port.close();
      finished = true;
      return { kind: "unsupported" };
    });
    port.deliver({ type: "capture", tab: TAB });
    await flush();
    expect(finished).toBe(true);
    expect(port.sent).toEqual([]);
  });
});

describe("PortCaptureService", () => {
  test("sends the request and resolves with the outcome, relaying progress", async () => {
    const port = new FakeDuplexPort<CaptureRequest, CaptureEvent>();
    const phases: string[] = [];
    const pending = new PortCaptureService(() => port).capture(TAB, (phase) => phases.push(phase));
    port.deliver({ type: "progress", phase: "saving" });
    port.deliver({ type: "outcome", outcome: { kind: "failed", message: "boom" } });
    expect(await pending).toEqual({ kind: "failed", message: "boom" });
    expect(port.sent).toEqual([{ type: "capture", tab: TAB }]);
    expect(phases).toEqual(["saving"]);
  });

  test("rejects when the worker disconnects first", async () => {
    const port = new FakeDuplexPort<CaptureRequest, CaptureEvent>();
    const pending = new PortCaptureService(() => port).capture(TAB, () => {});
    port.close();
    await expect(pending).rejects.toThrow("disconnected");
  });
});
