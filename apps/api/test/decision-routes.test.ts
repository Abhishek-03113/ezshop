import { describe, expect, test } from "bun:test";
import { FakeDecisionModel } from "./fakes/fake-decision-model.ts";
import { createTestApp as createHarness } from "./support/test-app.ts";

const answer = { label: "true", probability: 0.9, probabilities: { false: 0.1, true: 0.9 } };

function createTestApp(withModel: boolean) {
  const decisionModel = withModel ? new FakeDecisionModel(answer) : undefined;
  const harness = createHarness({ decisionModel });
  return { app: harness.app, decisionModel, signUp: harness.signUp };
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
    const { app, signUp } = createTestApp(false);
    const request = post({ state: "x", question: { kind: "noul", instruction: "y" } });
    request.headers.set("cookie", await signUp("me@example.com"));
    const response = await app.request(request);
    expect(response.status).toBe(404);
  });
});
