/** Where the ezshop stack runs. Baked in at build time (build.ts), which also derives host_permissions. */
export interface CaptureConfig {
  apiBaseUrl: string;
  webBaseUrl: string;
}

type EnvSource = Readonly<Record<string, string | undefined>>;

const LOCAL_DEFAULTS: CaptureConfig = { apiBaseUrl: "http://localhost:8787", webBaseUrl: "http://localhost:5173" };

/**
 * Reads EZSHOP_API_URL / EZSHOP_WEB_URL, defaulting to the local dev stack.
 *
 * @example resolveCaptureConfig({ EZSHOP_API_URL: "https://api.ezshop.test" }).apiBaseUrl // "https://api.ezshop.test"
 */
export function resolveCaptureConfig(env: EnvSource): CaptureConfig {
  return {
    apiBaseUrl: requireOrigin("EZSHOP_API_URL", env.EZSHOP_API_URL ?? LOCAL_DEFAULTS.apiBaseUrl),
    webBaseUrl: requireOrigin("EZSHOP_WEB_URL", env.EZSHOP_WEB_URL ?? LOCAL_DEFAULTS.webBaseUrl),
  };
}

/**
 * The manifest host permission that lets the service worker call the API.
 *
 * @example apiHostPermission({ apiBaseUrl: "http://localhost:8787", webBaseUrl: "…" }) // "http://localhost:8787/*"
 */
export function apiHostPermission(config: CaptureConfig): string {
  return `${new URL(config.apiBaseUrl).origin}/*`;
}

function requireOrigin(name: string, raw: string): string {
  const url = URL.parse(raw);
  if (url !== null && (url.protocol === "http:" || url.protocol === "https:")) return url.origin;
  throw new Error(`${name} is "${raw}"; expected an http(s) origin like http://localhost:8787`);
}
