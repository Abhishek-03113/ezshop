export interface ApiConfig {
  databaseUrl: string;
  /** Directory of the Laya ONNX export; null disables /api/decisions. */
  decisionModelDir: string | null;
  /** Bearer token for hosted Firecrawl (api.firecrawl.dev); null for a self-hosted instance. */
  firecrawlApiKey: string | null;
  /** Firecrawl base URL; null disables URL import, leaving only the extension's DOM capture. */
  firecrawlUrl: string | null;
  port: number;
  webOrigin: string;
}

const HOSTED_FIRECRAWL_URL = "https://api.firecrawl.dev";

type EnvSource = Readonly<Record<string, string | undefined>>;

/**
 * Reads API settings from environment variables, failing fast on missing or malformed values.
 *
 * @example loadApiConfig(Bun.env).port // 8787
 */
export function loadApiConfig(env: EnvSource): ApiConfig {
  return {
    databaseUrl: requireEnv(env, "DATABASE_URL"),
    decisionModelDir: env.DECISION_MODEL_DIR || null,
    firecrawlApiKey: env.FIRECRAWL_API_KEY || null,
    firecrawlUrl: resolveFirecrawlUrl(env),
    port: parsePort(env.API_PORT ?? "8787"),
    webOrigin: env.WEB_ORIGIN ?? "http://localhost:5173",
  };
}

// Firecrawl is opt-in: an explicit FIRECRAWL_URL (self-hosted) wins, an API key alone means hosted Firecrawl.
function resolveFirecrawlUrl(env: EnvSource): string | null {
  if (env.FIRECRAWL_URL) return env.FIRECRAWL_URL;
  return env.FIRECRAWL_API_KEY ? HOSTED_FIRECRAWL_URL : null;
}

function requireEnv(env: EnvSource, name: string): string {
  const value = env[name];
  if (value !== undefined && value !== "") return value;
  throw new Error(`Environment variable ${name} is ${JSON.stringify(value)}; expected a non-empty string`);
}

function parsePort(raw: string): number {
  const port = Number(raw);
  if (Number.isInteger(port) && port > 0 && port < 65536) return port;
  throw new Error(`API_PORT is "${raw}"; expected an integer between 1 and 65535`);
}
