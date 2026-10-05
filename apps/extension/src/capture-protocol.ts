import type { ActiveTab } from "./capture-flow.ts";
import type { CaptureOutcome, CapturePhase } from "./capture-outcome.ts";

/** Name of the long-lived runtime port the popup opens to the service worker. */
export const CAPTURE_PORT_NAME = "ezshop-capture";

/** Popup → worker. */
export interface CaptureRequest {
  type: "capture";
  tab: ActiveTab;
}

/** Worker → popup: zero or more progress events, then exactly one outcome. */
export type CaptureEvent = { type: "progress"; phase: CapturePhase } | { type: "outcome"; outcome: CaptureOutcome };

/** Typed two-way message channel; chrome-duplex-port.ts adapts chrome.runtime.Port to it. */
export interface DuplexPort<Sent, Received> {
  send(message: Sent): void;
  onReceive(listener: (message: Received) => void): void;
  onClose(listener: () => void): void;
}
