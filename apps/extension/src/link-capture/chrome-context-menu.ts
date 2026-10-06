import { PRODUCT_LINK_PATTERNS } from "./product-link.ts";
import type { MenuEntry } from "./context-menu-model.ts";

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

const CONTEXT_TYPES: Record<MenuEntry["context"], [chrome.contextMenus.ContextType]> = {
  link: [chrome.contextMenus.ContextType.LINK],
  page: [chrome.contextMenus.ContextType.PAGE],
};

// Only top-level items carry patterns (children show only under their root): link items match the
// link's target, the page root matches the open page. Separators too, or they would show on any link.
function rootPatternsFor(entry: MenuEntry): { targetUrlPatterns?: string[]; documentUrlPatterns?: string[] } {
  if (entry.parentId !== undefined) return {};
  const patterns = [...PRODUCT_LINK_PATTERNS];
  return entry.context === "link" ? { targetUrlPatterns: patterns } : { documentUrlPatterns: patterns };
}

function propertiesFor(entry: MenuEntry): chrome.contextMenus.CreateProperties {
  const base = { id: entry.id, contexts: CONTEXT_TYPES[entry.context], parentId: entry.parentId };
  if (entry.kind === "separator") return { ...base, ...rootPatternsFor(entry), type: "separator" };
  return { ...base, ...rootPatternsFor(entry), title: entry.title };
}

/**
 * ContextMenuPort over chrome.contextMenus, shown only on supported product links and product pages. Rebuilds are queued
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
