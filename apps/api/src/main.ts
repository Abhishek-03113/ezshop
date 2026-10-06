import { SQL } from "bun";
import { join } from "node:path";
import { loadApiConfig } from "./config/api-config.ts";
import { composeApi } from "./compose-api.ts";
import { applyMigrations, loadMigrationFiles } from "./db/migrate.ts";
import { createJsonLogger } from "./logging/json-logger.ts";

// Composition root for the long-running server (local dev, Docker). Vercel uses index.ts instead.
const config = loadApiConfig(Bun.env);
const logger = createJsonLogger(console.log, () => new Date());
const sql = new SQL(config.databaseUrl);

const applied = await applyMigrations(sql, await loadMigrationFiles(join(import.meta.dir, "db/migrations")));
logger.info("db.migrated", { applied: applied.join(",") || "none" });

const app = await composeApi(config, logger, sql);

Bun.serve({ port: config.port, fetch: app.fetch });
logger.info("api.started", { port: config.port });
