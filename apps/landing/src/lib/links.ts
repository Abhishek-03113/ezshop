/** Where the landing page sends people. Built once, passed down as props. */
export interface LandingLinks {
  readonly webUrl: string;
  readonly extensionUrl: string;
}

/** The slice of `import.meta.env` this app reads, so tests can pass a plain object. */
export interface LandingEnv {
  readonly VITE_PICKY_WEB_URL?: string;
  readonly VITE_PICKY_EXTENSION_URL?: string;
}

export const DEFAULT_WEB_URL = "http://localhost:5173";
export const DEFAULT_EXTENSION_URL = "#how";

function stripTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, "");
}

function orDefault(value: string | undefined, fallback: string): string {
  return value && value.trim() !== "" ? value.trim() : fallback;
}

/**
 * The single place env vars become links.
 * @example buildLandingLinks({ VITE_PICKY_WEB_URL: "https://app.picky.in/" }).webUrl // "https://app.picky.in"
 */
export function buildLandingLinks(env: LandingEnv): LandingLinks {
  return {
    webUrl: stripTrailingSlashes(orDefault(env.VITE_PICKY_WEB_URL, DEFAULT_WEB_URL)),
    extensionUrl: orDefault(env.VITE_PICKY_EXTENSION_URL, DEFAULT_EXTENSION_URL),
  };
}

/** "Open app" target. @example appHomeUrl({ webUrl: "http://x", extensionUrl: "#how" }) // "http://x/" */
export function appHomeUrl(links: LandingLinks): string {
  return `${links.webUrl}/`;
}
