/** Thin key-value storage the extension owns; chrome-key-value-storage.ts implements it over chrome.storage.local. */
export interface KeyValueStorage {
  read(key: string): Promise<unknown>;
  write(key: string, value: unknown): Promise<void>;
}

export interface ExtensionSettings {
  /** Open the spec sheet tab as soon as a capture is saved. Off by default: the popup's own "View specs" is the primary path. */
  autoOpenSheet: boolean;
  /** True once the user pressed "Got it" on the first-run screen. */
  firstRunDismissed: boolean;
  /** The comparison Quick Look and "Add to ezshop" offer first; null until the user picks or creates one. */
  lastComparisonId: string | null;
}

const SETTINGS_KEY = "ezshop.settings";
const DEFAULT_SETTINGS: ExtensionSettings = { autoOpenSheet: false, firstRunDismissed: false, lastComparisonId: null };

function parseSettings(stored: unknown): ExtensionSettings {
  if (typeof stored !== "object" || stored === null) return DEFAULT_SETTINGS;
  const fields = stored as Partial<Record<keyof ExtensionSettings, unknown>>;
  return {
    autoOpenSheet: typeof fields.autoOpenSheet === "boolean" ? fields.autoOpenSheet : DEFAULT_SETTINGS.autoOpenSheet,
    firstRunDismissed:
      typeof fields.firstRunDismissed === "boolean" ? fields.firstRunDismissed : DEFAULT_SETTINGS.firstRunDismissed,
    lastComparisonId: typeof fields.lastComparisonId === "string" ? fields.lastComparisonId : null,
  };
}

/**
 * Persisted popup preferences. Unreadable or missing storage falls back to the defaults
 * (auto-open OFF, first run not yet seen).
 *
 * @example await new SettingsStore(storage).setAutoOpenSheet(false)
 */
export class SettingsStore {
  constructor(private readonly storage: KeyValueStorage) {}

  async load(): Promise<ExtensionSettings> {
    return parseSettings(await this.storage.read(SETTINGS_KEY));
  }

  async isAutoOpenEnabled(): Promise<boolean> {
    return (await this.load()).autoOpenSheet;
  }

  async setAutoOpenSheet(autoOpenSheet: boolean): Promise<void> {
    await this.update({ autoOpenSheet });
  }

  async lastComparisonId(): Promise<string | null> {
    return (await this.load()).lastComparisonId;
  }

  async setLastComparisonId(lastComparisonId: string): Promise<void> {
    await this.update({ lastComparisonId });
  }

  async dismissFirstRun(): Promise<void> {
    await this.update({ firstRunDismissed: true });
  }

  private async update(change: Partial<ExtensionSettings>): Promise<void> {
    await this.storage.write(SETTINGS_KEY, { ...(await this.load()), ...change });
  }
}
