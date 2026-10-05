import { beforeEach, describe, expect, test } from "bun:test";
import type { CatalogComparisonDetail, CatalogComparisonSummary } from "@ezshop/catalog";
import { createApp } from "../src/http/create-app.ts";
import { ProductIngestion } from "../src/products/product-ingestion.ts";
import { FakeHtmlFetcher } from "./fakes/fake-html-fetcher.ts";
import { InMemoryComparisonRepository } from "./fakes/in-memory-comparison-repository.ts";
import { InMemoryProductRepository } from "./fakes/in-memory-product-repository.ts";
import { RecordingLogger } from "./fakes/recording-logger.ts";
import { buildSampleSnapshot } from "./support/sample-snapshot.ts";

let repository: InMemoryProductRepository;
let app: ReturnType<typeof createApp>;
let logger: RecordingLogger;

beforeEach(() => {
  repository = new InMemoryProductRepository();
  logger = new RecordingLogger();
  const ingestion = new ProductIngestion(repository, new FakeHtmlFetcher(new Map()), () => new Date());
  const comparisons = new InMemoryComparisonRepository(repository);
  app = createApp({ repository, comparisons, ingestion, logger, webOrigin: "http://web.test" });
});

function send(method: string, path: string, body?: unknown): Promise<Response> {
  const init: RequestInit = { method };
  if (body !== undefined)
    Object.assign(init, { body: JSON.stringify(body), headers: { "content-type": "application/json" } });
  return Promise.resolve(app.request(`http://api.test${path}`, init));
}

async function saveProduct(externalId: string): Promise<string> {
  return (await repository.saveSnapshot(buildSampleSnapshot({ externalId, title: `Product ${externalId}` }))).id;
}

async function createComparison(name: string, productIds: string[] = []): Promise<CatalogComparisonSummary> {
  const response = await send("POST", "/api/comparisons", { name, productIds });
  return ((await response.json()) as { comparison: CatalogComparisonSummary }).comparison;
}

describe("comparison CRUD", () => {
  test("POST creates a comparison with products and logs it", async () => {
    const first = await saveProduct("A");
    const response = await send("POST", "/api/comparisons", { name: "  Monitors ", productIds: [first] });
    expect(response.status).toBe(201);
    const { comparison } = (await response.json()) as { comparison: CatalogComparisonSummary };
    expect(comparison).toMatchObject({ name: "Monitors", productIds: [first] });
    expect(logger.entries[0]?.event).toBe("comparison.created");
  });

  test("POST rejects blank names and unknown product ids with 400", async () => {
    expect((await send("POST", "/api/comparisons", { name: " " })).status).toBe(400);
    const unknown = await send("POST", "/api/comparisons", { name: "X", productIds: ["ghost"] });
    expect(unknown.status).toBe(400);
    expect(((await unknown.json()) as { message: string }).message).toContain('["ghost"]');
  });

  test("GET lists the most recently updated comparison first", async () => {
    const older = await createComparison("Older");
    const newer = await createComparison("Newer");
    await send("PATCH", `/api/comparisons/${older.id}`, { name: "Older renamed" });
    const listed = (await (await send("GET", "/api/comparisons")).json()) as {
      comparisons: CatalogComparisonSummary[];
    };
    expect(listed.comparisons.map((comparison) => comparison.id)).toEqual([older.id, newer.id]);
  });

  test("GET /:id returns the products in full, in position order", async () => {
    const [a, b] = [await saveProduct("A"), await saveProduct("B")];
    const created = await createComparison("Pair", [b, a]);
    const { comparison } = (await (await send("GET", `/api/comparisons/${created.id}`)).json()) as {
      comparison: CatalogComparisonDetail;
    };
    expect(comparison.products.map((product) => product.id)).toEqual([b, a]);
  });

  test("PATCH renames, DELETE removes, both 404 for unknown ids", async () => {
    const created = await createComparison("Old");
    const renamed = await send("PATCH", `/api/comparisons/${created.id}`, { name: "New" });
    expect(((await renamed.json()) as { comparison: { name: string } }).comparison.name).toBe("New");
    expect((await send("DELETE", `/api/comparisons/${created.id}`)).status).toBe(204);
    expect((await send("GET", `/api/comparisons/${created.id}`)).status).toBe(404);
    expect((await send("DELETE", "/api/comparisons/nope")).status).toBe(404);
    expect((await send("PATCH", "/api/comparisons/nope", { name: "x" })).status).toBe(404);
  });
});

describe("comparison membership", () => {
  test("PUT adds a product idempotently and DELETE removes it", async () => {
    const productId = await saveProduct("A");
    const { id } = await createComparison("Set");
    await send("PUT", `/api/comparisons/${id}/products/${productId}`);
    const again = await send("PUT", `/api/comparisons/${id}/products/${productId}`);
    expect(((await again.json()) as { comparison: CatalogComparisonSummary }).comparison.productIds).toEqual([
      productId,
    ]);
    const removed = await send("DELETE", `/api/comparisons/${id}/products/${productId}`);
    expect(((await removed.json()) as { comparison: CatalogComparisonSummary }).comparison.productIds).toEqual([]);
  });

  test("PUT is 404 for an unknown product or comparison", async () => {
    const { id } = await createComparison("Set");
    expect((await send("PUT", `/api/comparisons/${id}/products/ghost`)).status).toBe(404);
    const productId = await saveProduct("A");
    expect((await send("PUT", `/api/comparisons/nope/products/${productId}`)).status).toBe(404);
  });

  test("GET /products/:id/comparisons lists every comparison holding the product", async () => {
    const productId = await saveProduct("A");
    const inFirst = await createComparison("First", [productId]);
    await createComparison("Without");
    const inThird = await createComparison("Third", [productId]);
    const response = await send("GET", `/api/products/${productId}/comparisons`);
    const { comparisons } = (await response.json()) as { comparisons: CatalogComparisonSummary[] };
    expect(comparisons.map((comparison) => comparison.id)).toEqual([inThird.id, inFirst.id]);
  });
});

describe("product search route", () => {
  test("GET /api/products?q= filters summaries and includes the category", async () => {
    await repository.saveSnapshot(buildSampleSnapshot({ externalId: "M1", title: "Dell", category: "Monitors" }));
    await repository.saveSnapshot(buildSampleSnapshot({ externalId: "P1", title: "Pixel", category: "Phones" }));
    const response = await send("GET", "/api/products?q=monitors");
    const { products } = (await response.json()) as { products: { title: string; category: string }[] };
    expect(products).toEqual([expect.objectContaining({ title: "Dell", category: "Monitors" })]);
  });
});
