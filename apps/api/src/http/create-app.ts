import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AuthService } from "../auth/auth-service.ts";
import type { DecisionModel } from "../decisions/decision-model.ts";
import type { ComparisonRepository } from "../comparisons/comparison-repository.ts";
import { createAuthRoutes } from "./auth-routes.ts";
import { createComparisonRoutes } from "./comparison-routes.ts";
import { createDecisionRoutes } from "./decision-routes.ts";
import { toErrorResponse } from "./http-errors.ts";
import { createProductRoutes, type ProductRouteDependencies } from "./product-routes.ts";
import { requireUser, type SessionCookieOptions } from "./session-cookie.ts";

export interface AppDependencies extends ProductRouteDependencies {
  auth: AuthService;
  comparisons: ComparisonRepository;
  sessionCookie: SessionCookieOptions;
  webOrigin: string;
  /** False when no Firecrawl is configured; the web app greys out its paste-a-link form. */
  urlImportEnabled: boolean;
  /** Absent when no Laya model is configured; /api/decisions is then not mounted. */
  decisionModel?: DecisionModel;
}

/**
 * Builds the HTTP app from injected dependencies, so tests can run it against fakes.
 * The extension's service worker calls the API with host permissions, so CORS only needs the web app.
 *
 * Order matters: Hono runs handlers in registration order, so the public routes (health, capabilities,
 * accounts, decisions) answer before `requireUser` runs; everything registered after it needs a session.
 *
 * @example Bun.serve({ port: 8787, fetch: createApp(deps).fetch })
 */
export function createApp(deps: AppDependencies): Hono {
  const app = new Hono();
  app.use("/api/*", cors({ origin: deps.webOrigin, credentials: true }));
  app.get("/health", (c) => c.json({ status: "ok" }));
  app.get("/api/capabilities", (c) => c.json({ urlImport: deps.urlImportEnabled }));
  app.route("/api", createAuthRoutes(deps));
  if (deps.decisionModel) {
    app.route("/api", createDecisionRoutes({ decisionModel: deps.decisionModel, logger: deps.logger }));
  }
  app.use("/api/*", requireUser(deps.auth));
  app.route("/api", createProductRoutes(deps));
  app.route("/api", createComparisonRoutes(deps));
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
