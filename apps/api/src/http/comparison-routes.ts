import { Hono, type Context } from "hono";
import { z } from "zod";
import type { ComparisonRepository } from "../comparisons/comparison-repository.ts";
import type { Logger } from "../logging/json-logger.ts";
import type { ProductRepository } from "../products/product-repository.ts";
import { BadRequestError } from "./http-errors.ts";
import { readJsonBody } from "./read-json-body.ts";
import type { SignedInEnv } from "./session-cookie.ts";

export interface ComparisonRouteDependencies {
  comparisons: ComparisonRepository;
  repository: ProductRepository;
  logger: Logger;
}

const NameSchema = z.string().trim().min(1).max(120);
const CreateBodySchema = z.object({ name: NameSchema, productIds: z.array(z.string().min(1)).optional() });
const RenameBodySchema = z.object({ name: NameSchema });

type SignedInContext = Context<SignedInEnv>;

/**
 * The signed-in user's comparison endpoints, mounted under /api behind `requireUser`
 * (contract shared with the extension's Quick Look):
 * GET|POST /comparisons, GET|PATCH|DELETE /comparisons/:id,
 * PUT|DELETE /comparisons/:id/products/:productId, GET /products/:id/comparisons.
 *
 * @example app.route("/api", createComparisonRoutes({ comparisons, repository, logger }))
 */
export function createComparisonRoutes(deps: ComparisonRouteDependencies): Hono<SignedInEnv> {
  return new Hono<SignedInEnv>()
    .get("/comparisons", async (c) => c.json({ comparisons: await deps.comparisons.listComparisons(userIdOf(c)) }))
    .post("/comparisons", (c) => createComparison(c, deps))
    .get("/comparisons/:id", (c) => showComparison(c, deps))
    .patch("/comparisons/:id", (c) => renameComparison(c, deps))
    .delete("/comparisons/:id", (c) => deleteComparison(c, deps))
    .put("/comparisons/:id/products/:productId", (c) => addProduct(c, deps))
    .delete("/comparisons/:id/products/:productId", (c) => removeProduct(c, deps))
    .get("/products/:id/comparisons", (c) => listForProduct(c, deps));
}

async function createComparison(c: SignedInContext, deps: ComparisonRouteDependencies): Promise<Response> {
  const body = parseBody(CreateBodySchema, await readJsonBody(c), '{"name": "<text>", "productIds"?: ["<id>", ...]}');
  const productIds = body.productIds ?? [];
  const missing = await findMissingProductIds(deps.repository, userIdOf(c), productIds);
  if (missing.length > 0) {
    throw new BadRequestError(
      `Unknown product ids ${JSON.stringify(missing)}; expected ids of products in the library`,
    );
  }
  const comparison = await deps.comparisons.createComparison(userIdOf(c), body.name, productIds);
  deps.logger.info("comparison.created", { id: comparison.id, products: productIds.length });
  return c.json({ comparison }, 201);
}

async function showComparison(c: SignedInContext, deps: ComparisonRouteDependencies): Promise<Response> {
  const id = c.req.param("id") ?? "";
  const comparison = await deps.comparisons.findComparison(userIdOf(c), id);
  return comparison === null ? comparisonNotFound(c, id) : c.json({ comparison });
}

async function renameComparison(c: SignedInContext, deps: ComparisonRouteDependencies): Promise<Response> {
  const id = c.req.param("id") ?? "";
  const body = parseBody(RenameBodySchema, await readJsonBody(c), '{"name": "<text>"}');
  const comparison = await deps.comparisons.renameComparison(userIdOf(c), id, body.name);
  return comparison === null ? comparisonNotFound(c, id) : c.json({ comparison });
}

async function deleteComparison(c: SignedInContext, deps: ComparisonRouteDependencies): Promise<Response> {
  const id = c.req.param("id") ?? "";
  if (!(await deps.comparisons.deleteComparison(userIdOf(c), id))) return comparisonNotFound(c, id);
  deps.logger.info("comparison.deleted", { id });
  return c.body(null, 204);
}

async function addProduct(c: SignedInContext, deps: ComparisonRouteDependencies): Promise<Response> {
  const id = c.req.param("id") ?? "";
  const productId = c.req.param("productId") ?? "";
  if ((await deps.repository.findProductById(userIdOf(c), productId)) === null) return productNotFound(c, productId);
  const comparison = await deps.comparisons.addProduct(userIdOf(c), id, productId);
  return comparison === null ? comparisonNotFound(c, id) : c.json({ comparison });
}

async function removeProduct(c: SignedInContext, deps: ComparisonRouteDependencies): Promise<Response> {
  const id = c.req.param("id") ?? "";
  const comparison = await deps.comparisons.removeProduct(userIdOf(c), id, c.req.param("productId") ?? "");
  return comparison === null ? comparisonNotFound(c, id) : c.json({ comparison });
}

async function listForProduct(c: SignedInContext, deps: ComparisonRouteDependencies): Promise<Response> {
  const comparisons = await deps.comparisons.listComparisonsForProduct(userIdOf(c), c.req.param("id") ?? "");
  return c.json({ comparisons });
}

function userIdOf(c: SignedInContext): string {
  return c.get("user").id;
}

/** Ids that are not products in this user's library; another user's product counts as missing. */
async function findMissingProductIds(
  repository: ProductRepository,
  userId: string,
  productIds: readonly string[],
): Promise<string[]> {
  const found = await Promise.all(productIds.map((productId) => repository.findProductById(userId, productId)));
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
