import { Hono, type Context } from "hono";
import { z } from "zod";
import type { ComparisonRepository } from "../comparisons/comparison-repository.ts";
import type { Logger } from "../logging/json-logger.ts";
import type { ProductRepository } from "../products/product-repository.ts";
import { BadRequestError } from "./http-errors.ts";
import { readJsonBody } from "./read-json-body.ts";

export interface ComparisonRouteDependencies {
  comparisons: ComparisonRepository;
  repository: ProductRepository;
  logger: Logger;
}

const NameSchema = z.string().trim().min(1).max(120);
const CreateBodySchema = z.object({ name: NameSchema, productIds: z.array(z.string().min(1)).optional() });
const RenameBodySchema = z.object({ name: NameSchema });

/**
 * Comparison endpoints, mounted under /api (contract shared with the extension's Quick Look):
 * GET|POST /comparisons, GET|PATCH|DELETE /comparisons/:id,
 * PUT|DELETE /comparisons/:id/products/:productId, GET /products/:id/comparisons.
 *
 * @example app.route("/api", createComparisonRoutes({ comparisons, repository, logger }))
 */
export function createComparisonRoutes(deps: ComparisonRouteDependencies): Hono {
  return new Hono()
    .get("/comparisons", async (c) => c.json({ comparisons: await deps.comparisons.listComparisons() }))
    .post("/comparisons", (c) => createComparison(c, deps))
    .get("/comparisons/:id", (c) => showComparison(c, deps))
    .patch("/comparisons/:id", (c) => renameComparison(c, deps))
    .delete("/comparisons/:id", (c) => deleteComparison(c, deps))
    .put("/comparisons/:id/products/:productId", (c) => addProduct(c, deps))
    .delete("/comparisons/:id/products/:productId", (c) => removeProduct(c, deps))
    .get("/products/:id/comparisons", (c) => listForProduct(c, deps));
}

async function createComparison(c: Context, deps: ComparisonRouteDependencies): Promise<Response> {
  const body = parseBody(CreateBodySchema, await readJsonBody(c), '{"name": "<text>", "productIds"?: ["<id>", ...]}');
  const productIds = body.productIds ?? [];
  const missing = await findMissingProductIds(deps.repository, productIds);
  if (missing.length > 0) {
    throw new BadRequestError(
      `Unknown product ids ${JSON.stringify(missing)}; expected ids of products in the library`,
    );
  }
  const comparison = await deps.comparisons.createComparison(body.name, productIds);
  deps.logger.info("comparison.created", { id: comparison.id, products: productIds.length });
  return c.json({ comparison }, 201);
}

async function showComparison(c: Context, deps: ComparisonRouteDependencies): Promise<Response> {
  const id = c.req.param("id") ?? "";
  const comparison = await deps.comparisons.findComparison(id);
  return comparison === null ? comparisonNotFound(c, id) : c.json({ comparison });
}

async function renameComparison(c: Context, deps: ComparisonRouteDependencies): Promise<Response> {
  const id = c.req.param("id") ?? "";
  const body = parseBody(RenameBodySchema, await readJsonBody(c), '{"name": "<text>"}');
  const comparison = await deps.comparisons.renameComparison(id, body.name);
  return comparison === null ? comparisonNotFound(c, id) : c.json({ comparison });
}

async function deleteComparison(c: Context, deps: ComparisonRouteDependencies): Promise<Response> {
  const id = c.req.param("id") ?? "";
  if (!(await deps.comparisons.deleteComparison(id))) return comparisonNotFound(c, id);
  deps.logger.info("comparison.deleted", { id });
  return c.body(null, 204);
}

async function addProduct(c: Context, deps: ComparisonRouteDependencies): Promise<Response> {
  const id = c.req.param("id") ?? "";
  const productId = c.req.param("productId") ?? "";
  if ((await deps.repository.findProductById(productId)) === null) return productNotFound(c, productId);
  const comparison = await deps.comparisons.addProduct(id, productId);
  return comparison === null ? comparisonNotFound(c, id) : c.json({ comparison });
}

async function removeProduct(c: Context, deps: ComparisonRouteDependencies): Promise<Response> {
  const id = c.req.param("id") ?? "";
  const comparison = await deps.comparisons.removeProduct(id, c.req.param("productId") ?? "");
  return comparison === null ? comparisonNotFound(c, id) : c.json({ comparison });
}

async function listForProduct(c: Context, deps: ComparisonRouteDependencies): Promise<Response> {
  const comparisons = await deps.comparisons.listComparisonsForProduct(c.req.param("id") ?? "");
  return c.json({ comparisons });
}

async function findMissingProductIds(repository: ProductRepository, productIds: readonly string[]): Promise<string[]> {
  const found = await Promise.all(productIds.map((productId) => repository.findProductById(productId)));
  return productIds.filter((_productId, index) => found[index] === null);
}

function parseBody<T>(schema: z.ZodType<T>, body: unknown, expected: string): T {
  const parsed = schema.safeParse(body);
  if (parsed.success) return parsed.data;
  throw new BadRequestError(`Comparison body ${JSON.stringify(body)} is invalid; expected ${expected}`);
}

function comparisonNotFound(c: Context, id: string): Response {
  return c.json({ error: "NotFound", message: `No comparison with id "${id}"` }, 404);
}

function productNotFound(c: Context, id: string): Response {
  return c.json({ error: "NotFound", message: `No product with id "${id}"` }, 404);
}
