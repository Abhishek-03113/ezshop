import type { BadgeState, BrowserPort } from "./browser-port.ts";
import type { CaptureResult } from "./capture-result.ts";

const BADGES: Readonly<Record<BadgeState, { text: string; color: string }>> = {
  working: { text: "…", color: "#5f6b66" },
  done: { text: "✓", color: "#0f6b5c" },
  failed: { text: "!", color: "#b0302a" },
  unsupported: { text: "?", color: "#9a5b00" },
};

/**
 * BrowserPort over the chrome.* extension APIs.
 *
 * @example runCaptureFlow(tab, { browser: new ChromeBrowserPort("page-capture.js"), … })
 */
export class ChromeBrowserPort implements BrowserPort {
  constructor(private readonly captureScriptFile: string) {}

  async capturePageInTab(tabId: number): Promise<CaptureResult> {
    await chrome.scripting.executeScript({ target: { tabId }, files: [this.captureScriptFile] });
    const [injection] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => globalThis.ezshopCapturePage?.() ?? { ok: false, message: "ezshop capture script did not load" },
    });
    return (
      (injection?.result as CaptureResult | undefined) ?? { ok: false, message: `No capture result from tab ${tabId}` }
    );
  }

  async openTab(url: string): Promise<void> {
    await chrome.tabs.create({ url });
  }

  async showBadge(tabId: number, state: BadgeState): Promise<void> {
    await chrome.action.setBadgeText({ tabId, text: BADGES[state].text });
    await chrome.action.setBadgeBackgroundColor({ tabId, color: BADGES[state].color });
  }
}
