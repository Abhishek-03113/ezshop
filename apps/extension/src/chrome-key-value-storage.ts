import type { KeyValueStorage } from "./settings.ts";

/**
 * KeyValueStorage over chrome.storage.local.
 *
 * @example new SettingsStore(new ChromeKeyValueStorage())
 */
export class ChromeKeyValueStorage implements KeyValueStorage {
  async read(key: string): Promise<unknown> {
    const stored = await chrome.storage.local.get(key);
    return stored[key];
  }

  async write(key: string, value: unknown): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  }
}
