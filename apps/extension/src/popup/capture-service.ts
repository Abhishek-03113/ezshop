import type { ActiveTab } from "../capture-flow.ts";
import type { CaptureEvent, CaptureRequest, DuplexPort } from "../capture-protocol.ts";
import type { CaptureOutcome, CapturePhase } from "../capture-outcome.ts";

/** What the popup needs from the capture machinery; the real one lives in the service worker. */
export interface CaptureService {
  capture(tab: ActiveTab, onProgress: (phase: CapturePhase) => void): Promise<CaptureOutcome>;
}

/**
 * CaptureService that asks the service worker over a fresh port per capture.
 *
 * @example new PortCaptureService(() => adaptChromePort(chrome.runtime.connect({ name: CAPTURE_PORT_NAME })))
 */
export class PortCaptureService implements CaptureService {
  constructor(private readonly connect: () => DuplexPort<CaptureRequest, CaptureEvent>) {}

  capture(tab: ActiveTab, onProgress: (phase: CapturePhase) => void): Promise<CaptureOutcome> {
    return new Promise((resolve, reject) => {
      const port = this.connect();
      port.onReceive((event) => (event.type === "progress" ? onProgress(event.phase) : resolve(event.outcome)));
      port.onClose(() => reject(new Error("ezshop background worker disconnected before the capture finished")));
      port.send({ type: "capture", tab });
    });
  }
}
