/** Where the Picky stack runs. Baked in at build time (build.ts), which also derives host_permissions. */
export interface CaptureConfig {
  apiBaseUrl: string;
  webBaseUrl: string;
}

type EnvSource = Readonly<Record<string, string | undefined>>;

const LOCAL_DEFAULTS: CaptureConfig = { apiBaseUrl: "http://localhost:8787", webBaseUrl: "http://localhost:5173" };

/**
 * Reads PICKY_API_URL / PICKY_WEB_URL, defaulting to the local dev stack.
 *
 * @example resolveCaptureConfig({ PICKY_API_URL: "https://api.picky.test" }).apiBaseUrl // "https://api.picky.test"
 */
export function resolveCaptureConfig(env: EnvSource): CaptureConfig {
  return {
    apiBaseUrl: requireOrigin("PICKY_API_URL", env.PICKY_API_URL ?? LOCAL_DEFAULTS.apiBaseUrl),
    webBaseUrl: requireOrigin("PICKY_WEB_URL", env.PICKY_WEB_URL ?? LOCAL_DEFAULTS.webBaseUrl),
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
