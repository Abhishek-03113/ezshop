import { SQL } from "bun";
import type { Hono } from "hono";
import { loadApiConfig } from "./config/api-config.ts";
import { composeApi } from "./compose-api.ts";
import { createJsonLogger } from "./logging/json-logger.ts";

// Composition root for Vercel, bundled to dist/ by `bun run build:vercel` and re-exported by index.ts.
// Migrations run at build time (scripts/migrate.ts), not per cold start,
// so concurrent instances never race on schema_migrations.
const config = loadApiConfig(Bun.env);
const logger = createJsonLogger(console.log, () => new Date());
const app: Hono = await composeApi(config, logger, new SQL(config.databaseUrl));

export default app;
