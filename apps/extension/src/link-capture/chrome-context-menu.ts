import { PRODUCT_LINK_PATTERNS } from "./product-link.ts";
import { ROOT_MENU_ID, type MenuEntry } from "./context-menu-model.ts";

/** Replaces the whole link menu; chrome-context-menu.ts implements it over chrome.contextMenus. */
export interface ContextMenuPort {
  replaceAll(entries: readonly MenuEntry[]): Promise<void>;
}

function createItem(properties: chrome.contextMenus.CreateProperties): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.contextMenus.create(properties, () => {
      const failure = chrome.runtime.lastError;
      if (failure === undefined) resolve();
      else reject(new Error(`contextMenus.create "${properties.id}" failed: ${failure.message}`));
    });
  });
}

const LINK_CONTEXT: [chrome.contextMenus.ContextType] = [chrome.contextMenus.ContextType.LINK];

function propertiesFor(entry: MenuEntry): chrome.contextMenus.CreateProperties {
  const base = { id: entry.id, contexts: LINK_CONTEXT, parentId: entry.parentId };
  if (entry.kind === "separator") return { ...base, type: "separator" };
  const patterns = entry.id === ROOT_MENU_ID ? { targetUrlPatterns: [...PRODUCT_LINK_PATTERNS] } : {};
  return { ...base, ...patterns, title: entry.title };
}

/**
 * ContextMenuPort over chrome.contextMenus, shown only on supported product links. Rebuilds are queued
 * so two quick changes cannot interleave and create duplicate ids.
 *
 * @example await new ChromeContextMenu().replaceAll(buildMenuEntries(comparisons, lastUsedId))
 */
export class ChromeContextMenu implements ContextMenuPort {
  private queue: Promise<void> = Promise.resolve();

  replaceAll(entries: readonly MenuEntry[]): Promise<void> {
    this.queue = this.queue.then(() => this.rebuild(entries));
    return this.queue.catch(() => undefined);
  }

  private async rebuild(entries: readonly MenuEntry[]): Promise<void> {
    await chrome.contextMenus.removeAll();
    for (const entry of entries) await createItem(propertiesFor(entry));
  }
}
