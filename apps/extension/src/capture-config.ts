/** Where the Picky stack runs. Baked in at build time (build.ts), which also derives host_permissions. */
export interface CaptureConfig {
  /**
   * Origin the extension sends /api requests to. Defaults to the web app's origin, which serves /api
   * (Vite proxy in dev, a rewrite when deployed): the session cookie lives there, so requests through it
   * are signed in exactly when the web app is.
   */
  apiBaseUrl: string;
  webBaseUrl: string;
}

type EnvSource = Readonly<Record<string, string | undefined>>;

const LOCAL_WEB_URL = "http://localhost:5173";

/**
 * Reads PICKY_WEB_URL (default: the local dev web app) and PICKY_API_URL (default: the web app's origin).
 *
 * @example resolveCaptureConfig({ PICKY_WEB_URL: "https://app.picky.test" }).apiBaseUrl // "https://app.picky.test"
 */
export function resolveCaptureConfig(env: EnvSource): CaptureConfig {
  const webBaseUrl = requireOrigin("PICKY_WEB_URL", env.PICKY_WEB_URL ?? LOCAL_WEB_URL);
  return { apiBaseUrl: requireOrigin("PICKY_API_URL", env.PICKY_API_URL ?? webBaseUrl), webBaseUrl };
}

/**
 * The manifest host permission that lets the service worker call the API.
 *
 * @example apiHostPermission({ apiBaseUrl: "http://localhost:5173", webBaseUrl: "…" }) // "http://localhost:5173/*"
 */
export function apiHostPermission(config: CaptureConfig): string {
  return `${new URL(config.apiBaseUrl).origin}/*`;
}

function requireOrigin(name: string, raw: string): string {
  const url = URL.parse(raw);
  if (url !== null && (url.protocol === "http:" || url.protocol === "https:")) return url.origin;
  throw new Error(`${name} is "${raw}"; expected an http(s) origin like http://localhost:8787`);
}
