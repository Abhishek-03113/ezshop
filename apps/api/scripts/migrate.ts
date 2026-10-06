import { SQL } from "bun";
import { join } from "node:path";
import { loadApiConfig } from "../src/config/api-config.ts";
import { applyMigrations, loadMigrationFiles } from "../src/db/migrate.ts";
import { createJsonLogger } from "../src/logging/json-logger.ts";

// Applies pending migrations and exits. Vercel runs it as the API's build command (apps/api/vercel.json).
const config = loadApiConfig(Bun.env);
const logger = createJsonLogger(console.log, () => new Date());
const sql = new SQL(config.databaseUrl);

const applied = await applyMigrations(sql, await loadMigrationFiles(join(import.meta.dir, "../src/db/migrations")));
logger.info("db.migrated", { applied: applied.join(",") || "none" });
await sql.close();
