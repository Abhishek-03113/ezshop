import { Hono } from "hono";
import { cors } from "hono/cors";
import type { DecisionModel } from "../decisions/decision-model.ts";
import type { ComparisonRepository } from "../comparisons/comparison-repository.ts";
import { createComparisonRoutes } from "./comparison-routes.ts";
import { createDecisionRoutes } from "./decision-routes.ts";
import { toErrorResponse } from "./http-errors.ts";
import { createProductRoutes, type ProductRouteDependencies } from "./product-routes.ts";

export interface AppDependencies extends ProductRouteDependencies {
  comparisons: ComparisonRepository;
  webOrigin: string;
  /** Absent when no Laya model is configured; /api/decisions is then not mounted. */
  decisionModel?: DecisionModel;
}

/**
 * Builds the HTTP app from injected dependencies, so tests can run it against fakes.
 * The extension's service worker calls the API with host permissions, so CORS only needs the web app.
 *
 * @example Bun.serve({ port: 8787, fetch: createApp(deps).fetch })
 */
export function createApp(deps: AppDependencies): Hono {
  const app = new Hono();
  app.use("/api/*", cors({ origin: deps.webOrigin }));
  app.get("/health", (c) => c.json({ status: "ok" }));
  app.route("/api", createProductRoutes(deps));
  app.route("/api", createComparisonRoutes(deps));
  if (deps.decisionModel) {
    app.route("/api", createDecisionRoutes({ decisionModel: deps.decisionModel, logger: deps.logger }));
  }
  app.notFound((c) => c.json({ error: "NotFound", message: `No route for ${c.req.method} ${c.req.path}` }, 404));
  app.onError((error, c) => {
    const response = toErrorResponse(error);
    deps.logger.error("request.failed", {
      path: c.req.path,
      status: response.status,
      error: error.name,
      message: error.message,
    });
    return c.json(response.body, response.status);
  });
  return app;
}
