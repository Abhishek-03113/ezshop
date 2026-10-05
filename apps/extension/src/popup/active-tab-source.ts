import type { ActiveTab } from "../capture-flow.ts";

/** Finds the tab the popup was opened on. */
export interface ActiveTabSource {
  getActiveTab(): Promise<ActiveTab | null>;
}

/**
 * ActiveTabSource over chrome.tabs. Returns null when the tab has no readable URL
 * (e.g. a blank or restricted tab).
 *
 * @example const tab = await new ChromeActiveTabSource().getActiveTab()
 */
export class ChromeActiveTabSource implements ActiveTabSource {
  async getActiveTab(): Promise<ActiveTab | null> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id === undefined || tab.url === undefined) return null;
    return { id: tab.id, url: tab.url };
  }
}
