import type { SQL } from "bun";
import type { Hono } from "hono";
import { AuthService } from "./auth/auth-service.ts";
import { bunPasswordHasher } from "./auth/password-hasher.ts";
import { PostgresAccountRepository } from "./auth/postgres-account-repository.ts";
import type { ApiConfig } from "./config/api-config.ts";
import type { DecisionModel } from "./decisions/decision-model.ts";
import { createApp } from "./http/create-app.ts";
import type { Logger } from "./logging/json-logger.ts";
import { PostgresComparisonRepository } from "./comparisons/postgres-comparison-repository.ts";
import { PostgresProductRepository } from "./products/postgres-product-repository.ts";
import { ProductIngestion } from "./products/product-ingestion.ts";
import { DisabledHtmlFetcher } from "./scraping/disabled-html-fetcher.ts";
import { FirecrawlHtmlFetcher } from "./scraping/firecrawl-html-fetcher.ts";
import type { HtmlFetcher } from "./scraping/html-fetcher.ts";

/**
 * Wires the real repositories and the optional add-ons (Firecrawl URL import, Laya) into the HTTP app.
 * Shared by the long-running server (main.ts) and the Vercel function entry (index.ts).
 *
 * @example const app = await composeApi(loadApiConfig(Bun.env), logger, new SQL(url))
 */
export async function composeApi(config: ApiConfig, logger: Logger, sql: SQL): Promise<Hono> {
  const auth = new AuthService(new PostgresAccountRepository(sql), bunPasswordHasher, () => new Date());
  const repository = new PostgresProductRepository(sql);
  const ingestion = new ProductIngestion(repository, createHtmlFetcher(config), () => new Date());
  const decisionModel = await loadDecisionModel(config.decisionModelDir);
  logger.info("decisions.model", { dir: config.decisionModelDir, loaded: decisionModel !== undefined });
  const comparisons = new PostgresComparisonRepository(sql);
  const urlImportEnabled = config.firecrawlUrl !== null;
  // Secure cookies need https; local dev serves the web app over plain http://localhost.
  const sessionCookie = { secure: new URL(config.webOrigin).protocol === "https:" };
  return createApp({
    auth,
    sessionCookie,
    repository,
    comparisons,
    ingestion,
    logger,
    webOrigin: config.webOrigin,
    urlImportEnabled,
    decisionModel,
  });
}

// DOM capture by the extension is the default; Firecrawl URL import is an opt-in add-on.
function createHtmlFetcher(config: ApiConfig): HtmlFetcher {
  if (config.firecrawlUrl === null) return new DisabledHtmlFetcher();
  return new FirecrawlHtmlFetcher(config.firecrawlUrl, fetch, config.firecrawlApiKey);
}

// Imported lazily so deployments without a model (Vercel) never load onnxruntime-node's native binary.
async function loadDecisionModel(modelDir: string | null): Promise<DecisionModel | undefined> {
  if (modelDir === null) return undefined;
  const { loadLayaDecisionModel } = await import("./decisions/load-laya-model.ts");
  return loadLayaDecisionModel(modelDir);
}
