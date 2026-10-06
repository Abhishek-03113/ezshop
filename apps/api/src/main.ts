import { SQL } from "bun";
import { join } from "node:path";
import { AuthService } from "./auth/auth-service.ts";
import { bunPasswordHasher } from "./auth/password-hasher.ts";
import { PostgresAccountRepository } from "./auth/postgres-account-repository.ts";
import { loadLayaDecisionModel } from "./decisions/load-laya-model.ts";
import { loadApiConfig } from "./config/api-config.ts";
import { applyMigrations, loadMigrationFiles } from "./db/migrate.ts";
import { createApp } from "./http/create-app.ts";
import { createJsonLogger } from "./logging/json-logger.ts";
import { PostgresComparisonRepository } from "./comparisons/postgres-comparison-repository.ts";
import { PostgresProductRepository } from "./products/postgres-product-repository.ts";
import { ProductIngestion } from "./products/product-ingestion.ts";
import { FirecrawlHtmlFetcher } from "./scraping/firecrawl-html-fetcher.ts";

// Composition root: the only place that touches env, the real database and the real network.
const config = loadApiConfig(Bun.env);
const logger = createJsonLogger(console.log, () => new Date());
const sql = new SQL(config.databaseUrl);

const applied = await applyMigrations(sql, await loadMigrationFiles(join(import.meta.dir, "db/migrations")));
logger.info("db.migrated", { applied: applied.join(",") || "none" });

const auth = new AuthService(new PostgresAccountRepository(sql), bunPasswordHasher, () => new Date());
const repository = new PostgresProductRepository(sql);
const comparisons = new PostgresComparisonRepository(sql);
const ingestion = new ProductIngestion(
  repository,
  new FirecrawlHtmlFetcher(config.firecrawlUrl, fetch),
  () => new Date(),
);
const decisionModel = config.decisionModelDir ? await loadLayaDecisionModel(config.decisionModelDir) : undefined;
logger.info("decisions.model", { dir: config.decisionModelDir, loaded: decisionModel !== undefined });
// Secure cookies need https; local dev serves the web app over plain http://localhost.
const sessionCookie = { secure: new URL(config.webOrigin).protocol === "https:" };
const app = createApp({
  auth,
  repository,
  comparisons,
  ingestion,
  logger,
  sessionCookie,
  webOrigin: config.webOrigin,
  decisionModel,
});

// Firecrawl scrapes of Amazon take ~5 s; Bun's default 10 s idle timeout is too tight under load.
Bun.serve({ port: config.port, fetch: app.fetch, idleTimeout: 120 });
logger.info("api.started", { port: config.port, firecrawlUrl: config.firecrawlUrl });
