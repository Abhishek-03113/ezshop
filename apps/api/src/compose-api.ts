import type { SQL } from "bun";
import type { Hono } from "hono";
import type { ApiConfig } from "./config/api-config.ts";
import type { DecisionModel } from "./decisions/decision-model.ts";
import { createApp } from "./http/create-app.ts";
import type { Logger } from "./logging/json-logger.ts";
import { PostgresComparisonRepository } from "./comparisons/postgres-comparison-repository.ts";
import { PostgresProductRepository } from "./products/postgres-product-repository.ts";
import { ProductIngestion } from "./products/product-ingestion.ts";

/**
 * Wires the real repositories and the optional Laya decision model into the HTTP app.
 * Shared by the long-running server (main.ts) and the Vercel function entry (index.ts).
 *
 * @example const app = await composeApi(loadApiConfig(Bun.env), logger, new SQL(url))
 */
export async function composeApi(config: ApiConfig, logger: Logger, sql: SQL): Promise<Hono> {
  const repository = new PostgresProductRepository(sql);
  const ingestion = new ProductIngestion(repository);
  const decisionModel = await loadDecisionModel(config.decisionModelDir);
  logger.info("decisions.model", { dir: config.decisionModelDir, loaded: decisionModel !== undefined });
  const comparisons = new PostgresComparisonRepository(sql);
  return createApp({
    repository,
    comparisons,
    ingestion,
    logger,
    webOrigin: config.webOrigin,
    decisionModel,
  });
}

// Imported lazily so deployments without a model (Vercel) never load onnxruntime-node's native binary.
async function loadDecisionModel(modelDir: string | null): Promise<DecisionModel | undefined> {
  if (modelDir === null) return undefined;
  const { loadLayaDecisionModel } = await import("./decisions/load-laya-model.ts");
  return loadLayaDecisionModel(modelDir);
}
