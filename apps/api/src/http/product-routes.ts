import { Hono, type Context } from "hono";
import { z } from "zod";
import type { Logger } from "../logging/json-logger.ts";
import type { ProductIngestion } from "../products/product-ingestion.ts";
import type { ProductRepository } from "../products/product-repository.ts";
import { BadRequestError } from "./http-errors.ts";

export interface ProductRouteDependencies {
  repository: ProductRepository;
  ingestion: ProductIngestion;
  logger: Logger;
}

const ImportRequestSchema = z.object({ url: z.url() });

/**
 * Product endpoints, mounted under /api:
 * POST /snapshots (extension capture), POST /imports (scrape a URL), GET /products, GET /products/:id.
 *
 * @example app.route("/api", createProductRoutes({ repository, ingestion, logger }))
 */
export function createProductRoutes(deps: ProductRouteDependencies): Hono {
  return new Hono()
    .post("/snapshots", (c) => captureSnapshot(c, deps))
    .post("/imports", (c) => importProduct(c, deps))
    .get("/products", async (c) => c.json({ products: await deps.repository.listProductSummaries() }))
    .get("/products/:id", (c) => showProduct(c, deps));
}

async function captureSnapshot(c: Context, deps: ProductRouteDependencies): Promise<Response> {
  const product = await deps.ingestion.ingestSnapshot(await readJsonBody(c));
  deps.logger.info("product.captured", { id: product.id, externalId: product.snapshot.externalId });
  return c.json({ product }, 201);
}

async function importProduct(c: Context, deps: ProductRouteDependencies): Promise<Response> {
  const product = await deps.ingestion.importFromUrl(parseImportUrl(await readJsonBody(c)));
  deps.logger.info("product.imported", { id: product.id, externalId: product.snapshot.externalId });
  return c.json({ product }, 201);
}

async function showProduct(c: Context, deps: ProductRouteDependencies): Promise<Response> {
  const id = c.req.param("id") ?? "";
  const product = await deps.repository.findProductById(id);
  if (product === null) return c.json({ error: "NotFound", message: `No product with id "${id}"` }, 404);
  return c.json({ product });
}

async function readJsonBody(c: Context): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    throw new BadRequestError(
      `Request body for ${c.req.method} ${c.req.path} is not valid JSON; expected a JSON object`,
    );
  }
}

function parseImportUrl(body: unknown): string {
  const parsed = ImportRequestSchema.safeParse(body);
  if (parsed.success) return parsed.data.url;
  throw new BadRequestError(`Import body ${JSON.stringify(body)} is invalid; expected {"url": "<absolute URL>"}`);
}
