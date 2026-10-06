import { describe, expect, test } from "bun:test";
import { createApp } from "../src/http/create-app.ts";
import { ProductIngestion } from "../src/products/product-ingestion.ts";
import { InMemoryComparisonRepository } from "./fakes/in-memory-comparison-repository.ts";
import { InMemoryProductRepository } from "./fakes/in-memory-product-repository.ts";
import { RecordingLogger } from "./fakes/recording-logger.ts";
import { buildSampleSnapshot } from "./support/sample-snapshot.ts";

function createTestApp() {
  const repository = new InMemoryProductRepository();
  const logger = new RecordingLogger();
  const ingestion = new ProductIngestion(repository);
  return {
    logger,
    app: createApp({
      repository,
      comparisons: new InMemoryComparisonRepository(repository),
      ingestion,
      logger,
      webOrigin: "http://web.test",
    }),
  };
}

function postJson(path: string, body: unknown): Request {
  return new Request(`http://api.test${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("product API", () => {
  test("POST /api/snapshots stores the capture and GET returns it", async () => {
    const { app, logger } = createTestApp();
    const created = await app.request(postJson("/api/snapshots", buildSampleSnapshot()));
    expect(created.status).toBe(201);
    const { product } = (await created.json()) as { product: { id: string } };
    const fetched = await app.request(`/api/products/${product.id}`);
    expect(((await fetched.json()) as { product: { id: string } }).product.id).toBe(product.id);
    expect(logger.entries[0]?.event).toBe("product.captured");
  });

  test("DELETE /api/products/:id removes the product, then answers 404", async () => {
    const { app, logger } = createTestApp();
    const created = await app.request(postJson("/api/snapshots", buildSampleSnapshot()));
    const { product } = (await created.json()) as { product: { id: string } };
    expect((await app.request(`/api/products/${product.id}`, { method: "DELETE" })).status).toBe(204);
    expect((await app.request(`/api/products/${product.id}`)).status).toBe(404);
    expect((await app.request(`/api/products/${product.id}`, { method: "DELETE" })).status).toBe(404);
    expect(logger.entries.map((entry) => entry.event)).toContain("product.deleted");
  });

  test("rejects malformed JSON with 400", async () => {
    const { app } = createTestApp();
    const malformed = new Request("http://api.test/api/snapshots", { method: "POST", body: "{nope" });
    expect((await app.request(malformed)).status).toBe(400);
  });

  test("returns 404 for unknown products and routes, and logs failures", async () => {
    const { app, logger } = createTestApp();
    expect((await app.request("/api/products/missing")).status).toBe(404);
    expect((await app.request("/nowhere")).status).toBe(404);
    expect((await app.request(postJson("/api/snapshots", { title: "" }))).status).toBe(400);
    expect(logger.entries.at(-1)).toMatchObject({ level: "error", event: "request.failed" });
  });

  test("allows the web origin through CORS", async () => {
    const { app } = createTestApp();
    const response = await app.request("/api/products", { headers: { origin: "http://web.test" } });
    expect(response.headers.get("access-control-allow-origin")).toBe("http://web.test");
  });
});
