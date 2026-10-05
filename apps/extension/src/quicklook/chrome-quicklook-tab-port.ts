import type { QuickLookTabPort } from "./quicklook-launcher.ts";

/**
 * QuickLookTabPort over chrome.scripting and chrome.action. The overlay bundle is a classic script
 * (executeScript `files` cannot load ES modules); the toggle runs in the same isolated world afterwards.
 *
 * @example await new ChromeQuickLookTabPort("quicklook.js", "popup.html").injectAndToggle(7)
 */
export class ChromeQuickLookTabPort implements QuickLookTabPort {
  constructor(
    private readonly overlayScriptFile: string,
    private readonly popupPage: string,
  ) {}

  async injectAndToggle(tabId: number): Promise<void> {
    await chrome.scripting.executeScript({ target: { tabId }, files: [this.overlayScriptFile] });
    const [injection] = await chrome.scripting.executeScript({
      target: { tabId },
      func: (): boolean => {
        globalThis.ezshopQuickLookToggle?.();
        return globalThis.ezshopQuickLookToggle !== undefined;
      },
    });
    if (injection?.result !== true) throw new Error(`ezshop Quick Look script did not load in tab ${tabId}`);
  }

  async openPopupFor(tabId: number): Promise<void> {
    await chrome.action.setPopup({ tabId, popup: this.popupPage });
    await chrome.action.openPopup();
  }

  /** Back to "click toggles Quick Look" once the tab navigates away from a page that needed the popup. */
  async clearPopupFor(tabId: number): Promise<void> {
    await chrome.action.setPopup({ tabId, popup: "" });
  }
}
