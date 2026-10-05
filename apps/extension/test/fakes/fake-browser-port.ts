import type { BadgeState, BrowserPort } from "../../src/browser-port.ts";
import type { CaptureResult } from "../../src/capture-result.ts";

/** BrowserPort that returns a canned capture and records tabs opened and badges shown. */
export class FakeBrowserPort implements BrowserPort {
  readonly openedUrls: string[] = [];
  readonly badges: BadgeState[] = [];

  constructor(private readonly captureResult: CaptureResult) {}

  async capturePageInTab(): Promise<CaptureResult> {
    return this.captureResult;
  }

  async openTab(url: string): Promise<void> {
    this.openedUrls.push(url);
  }

  async showBadge(_tabId: number, state: BadgeState): Promise<void> {
    this.badges.push(state);
  }
}
