import type { QuickLookView } from "./quicklook-model.ts";

/** The browser calls Quick Look needs; chrome-quicklook-tab-port.ts implements them over chrome.scripting / chrome.action. */
export interface QuickLookTabPort {
  /** Injects the overlay bundle and toggles it on `view`. Rejects when the tab cannot be scripted (chrome://, web store...). */
  injectAndToggle(tabId: number, view: QuickLookView): Promise<void>;
  /** Opens the classic capture popup for this tab only. */
  openPopupFor(tabId: number): Promise<void>;
}

export interface ToggleTab {
  id?: number;
  url?: string;
}

type Logger = (event: string, fields: Record<string, string | number>) => void;

/**
 * Toolbar click / Alt+Shift+S (specs) or Alt+Shift+V (compare): toggle the in-page Quick Look on `view`, or fall back to the existing popup when the
 * page cannot be scripted. Never throws: a failed fallback is only logged.
 *
 * @example await toggleQuickLook({ id: 7, url: "https://www.amazon.in/dp/B0FQG1YHYR" }, port, log, "specs")
 */
export async function toggleQuickLook(
  tab: ToggleTab,
  port: QuickLookTabPort,
  log: Logger,
  view: QuickLookView,
): Promise<void> {
  if (tab.id === undefined) {
    log("quicklook.no_tab", {});
    return;
  }
  try {
    await port.injectAndToggle(tab.id, view);
  } catch (error) {
    log("quicklook.fallback_popup", { tabId: tab.id, url: tab.url ?? "", reason: describe(error) });
    await port.openPopupFor(tab.id).catch((popupError: unknown) => {
      log("quicklook.popup_failed", { tabId: tab.id ?? -1, reason: describe(popupError) });
    });
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
