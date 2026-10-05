import type { CaptureResult } from "./capture-result.ts";

export type BadgeState = "working" | "done" | "failed" | "unsupported";

/** The browser features the capture flow needs; chrome-browser-port.ts implements them over chrome.*. */
export interface BrowserPort {
  capturePageInTab(tabId: number): Promise<CaptureResult>;
  openTab(url: string): Promise<void>;
  showBadge(tabId: number, state: BadgeState): Promise<void>;
}
