import { describe, expect, test } from "bun:test";
import { createApp } from "../src/http/create-app.ts";
import { ProductIngestion } from "../src/products/product-ingestion.ts";
import { FakeDecisionModel } from "./fakes/fake-decision-model.ts";
import { InMemoryComparisonRepository } from "./fakes/in-memory-comparison-repository.ts";
import { InMemoryProductRepository } from "./fakes/in-memory-product-repository.ts";
import { RecordingLogger } from "./fakes/recording-logger.ts";

const answer = { label: "true", probability: 0.9, probabilities: { false: 0.1, true: 0.9 } };

function createTestApp(withModel: boolean) {
  const repository = new InMemoryProductRepository();
  const ingestion = new ProductIngestion(repository);
  const decisionModel = withModel ? new FakeDecisionModel(answer) : undefined;
  const app = createApp({
    repository,
    comparisons: new InMemoryComparisonRepository(repository),
    ingestion,
    logger: new RecordingLogger(),
    webOrigin: "http://web.test",
    decisionModel,
  });
  return { app, decisionModel };
}

const post = (body: unknown): Request =>
  new Request("http://api.test/api/decisions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /api/decisions", () => {
  test("returns the model's answer for a valid question", async () => {
    const { app, decisionModel } = createTestApp(true);
    const response = await app.request(
      post({ state: "Refurbished phone", question: { kind: "noul", instruction: "Is it refurbished?" } }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ answer });
    expect(decisionModel?.asked[0]?.state).toBe("Refurbished phone");
  });

  test("rejects an unknown question kind with 400", async () => {
    const { app } = createTestApp(true);
    const response = await app.request(post({ state: "x", question: { kind: "essay", instruction: "y" } }));
    expect(response.status).toBe(400);
  });

  test("rejects a choice with fewer than two options", async () => {
    const { app } = createTestApp(true);
    const response = await app.request(
      post({ state: "x", question: { kind: "choice", instruction: "y", options: { a: "" } } }),
    );
    expect(response.status).toBe(400);
  });

  test("is not mounted when no model is configured", async () => {
    const { app } = createTestApp(false);
    const response = await app.request(post({ state: "x", question: { kind: "noul", instruction: "y" } }));
    expect(response.status).toBe(404);
  });
});
