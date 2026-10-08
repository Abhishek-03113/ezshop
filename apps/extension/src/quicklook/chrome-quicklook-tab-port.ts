import type { ProductSnapshot } from "@picky/catalog";
import type { QuickLookTabPort } from "./quicklook-launcher.ts";
import type { QuickLookView } from "./quicklook-model.ts";

/**
 * QuickLookTabPort over chrome.scripting and chrome.action. The overlay bundle is a classic script
 * (executeScript `files` cannot load ES modules); the toggle runs in the same isolated world afterwards.
 *
 * @example await new ChromeQuickLookTabPort("quicklook.js", "popup.html").injectAndToggle(7, "specs")
 */
export class ChromeQuickLookTabPort implements QuickLookTabPort {
  constructor(
    private readonly overlayScriptFile: string,
    private readonly popupPage: string,
  ) {}

  async injectAndToggle(tabId: number, view: QuickLookView): Promise<void> {
    await chrome.scripting.executeScript({ target: { tabId }, files: [this.overlayScriptFile] });
    const [injection] = await chrome.scripting.executeScript({
      target: { tabId },
      // The page-side function receives the view as an argument: executeScript cannot close over `view`.
      args: [view],
      func: (requested: QuickLookView): boolean => {
        globalThis.pickyQuickLook?.toggle(requested);
        return globalThis.pickyQuickLook !== undefined;
      },
    });
    if (injection?.result !== true) throw new Error(`Picky Quick Look script did not load in tab ${tabId}`);
  }

  /** Opens Quick Look on the specs of `snapshot`, a product that is not this tab's page. */
  async injectAndShowProduct(tabId: number, snapshot: ProductSnapshot): Promise<void> {
    await chrome.scripting.executeScript({ target: { tabId }, files: [this.overlayScriptFile] });
    const [injection] = await chrome.scripting.executeScript({
      target: { tabId },
      // As JSON text: executeScript drops null-valued properties from object args (heading: null → missing).
      args: [JSON.stringify(snapshot)],
      func: (productJson: string): boolean => {
        globalThis.pickyQuickLook?.showProduct(JSON.parse(productJson) as ProductSnapshot);
        return globalThis.pickyQuickLook !== undefined;
      },
    });
    if (injection?.result !== true) throw new Error(`Picky Quick Look script did not load in tab ${tabId}`);
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
