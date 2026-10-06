import { SQL } from "bun";
import { loadApiConfig } from "./config/api-config.ts";
import { composeApi } from "./compose-api.ts";
import { createJsonLogger } from "./logging/json-logger.ts";

// Composition root for Vercel: its Hono preset detects src/index.ts and serves the default export
// as a Fluid compute function. Migrations run at build time (scripts/migrate.ts), not per cold start,
// so concurrent instances never race on schema_migrations.
const config = loadApiConfig(Bun.env);
const logger = createJsonLogger(console.log, () => new Date());

export default await composeApi(config, logger, new SQL(config.databaseUrl));
