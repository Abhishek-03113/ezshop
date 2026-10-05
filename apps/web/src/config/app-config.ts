/** Deployment-time settings, read once at the composition root and injected through router context. */
export interface AppConfig {
  /** Where "Add to Chrome" points: the Chrome Web Store listing once published. */
  extensionUrl: string;
}

/** Used until a store listing exists, so the link always lands somewhere useful. */
export const DEFAULT_EXTENSION_URL = "https://chromewebstore.google.com/search/ezshop";

/**
 * Builds the app config from Vite's env; a blank or missing value falls back to the default.
 *
 * @example readAppConfig(import.meta.env) // { extensionUrl: "https://chromewebstore.google.com/..." }
 */
export function readAppConfig(env: Readonly<Record<string, unknown>>): AppConfig {
  const raw = env["VITE_EZSHOP_EXTENSION_URL"];
  const configured = typeof raw === "string" ? raw.trim() : "";
  return { extensionUrl: configured === "" ? DEFAULT_EXTENSION_URL : configured };
}
