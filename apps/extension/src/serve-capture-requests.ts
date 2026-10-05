import type { ActiveTab } from "./capture-flow.ts";
import type { CaptureEvent, CaptureRequest, DuplexPort } from "./capture-protocol.ts";
import type { CaptureOutcome, CapturePhase } from "./capture-outcome.ts";

export type RunCapture = (tab: ActiveTab, onProgress: (phase: CapturePhase) => void) => Promise<CaptureOutcome>;

/**
 * Service-worker side of the popup channel: runs each requested capture and streams progress back.
 * The capture keeps running if the popup closes mid-way (users may close it, per the design),
 * so sends after a disconnect are skipped rather than treated as failures.
 *
 * @example chrome.runtime.onConnect.addListener((port) => serveCaptureRequests(adaptChromePort(port), runCapture))
 */
export function serveCaptureRequests(port: DuplexPort<CaptureEvent, CaptureRequest>, run: RunCapture): void {
  let popupOpen = true;
  port.onClose(() => {
    popupOpen = false;
  });
  const send = (event: CaptureEvent): void => {
    if (popupOpen) port.send(event);
  };
  port.onReceive((request) => {
    void run(request.tab, (phase) => send({ type: "progress", phase })).then((outcome) =>
      send({ type: "outcome", outcome }),
    );
  });
}
