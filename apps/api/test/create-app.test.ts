import { describe, expect, test } from "bun:test";
import { htmlByFixtureUrl, loadPageFixtures } from "./support/page-fixtures.ts";
import { buildSampleSnapshot } from "./support/sample-snapshot.ts";
import { createTestApp } from "./support/test-app.ts";

const fixtures = await loadPageFixtures();

describe("product API", () => {
  test("POST /api/snapshots stores the capture and GET returns it", async () => {
    const { send, signUp, logger } = createTestApp();
    const cookie = await signUp("me@example.com");
    const created = await send("POST", "/api/snapshots", { body: buildSampleSnapshot(), cookie });
    expect(created.status).toBe(201);
    const { product } = (await created.json()) as { product: { id: string } };
    const fetched = await send("GET", `/api/products/${product.id}`, { cookie });
    expect(((await fetched.json()) as { product: { id: string } }).product.id).toBe(product.id);
    expect(logger.entries.map((entry) => entry.event)).toContain("product.captured");
  });

  test("POST /api/imports reads every supported site and lists the products", async () => {
    const { send, signUp } = createTestApp({ htmlByUrl: htmlByFixtureUrl(fixtures) });
    const cookie = await signUp("me@example.com");
    for (const fixture of fixtures) {
      expect((await send("POST", "/api/imports", { body: { url: fixture.url }, cookie })).status).toBe(201);
    }
    const listed = (await (await send("GET", "/api/products", { cookie })).json()) as {
      products: { source: string }[];
    };
    expect(new Set(listed.products.map((product) => product.source))).toEqual(new Set(["amazon.in", "flipkart.com"]));
    expect(listed.products).toHaveLength(fixtures.length);
  });

  test("rejects malformed JSON and bad import bodies with 400", async () => {
    const { send, signUp, app } = createTestApp();
    const cookie = await signUp("me@example.com");
    const malformed = new Request("http://api.test/api/snapshots", {
      method: "POST",
      headers: { cookie },
      body: "{nope",
    });
    expect((await app.request(malformed)).status).toBe(400);
    expect((await send("POST", "/api/imports", { body: { url: "nope" }, cookie })).status).toBe(400);
  });

  test("returns 404 for unknown products and routes, and logs failures", async () => {
    const { send, signUp, logger } = createTestApp();
    const cookie = await signUp("me@example.com");
    expect((await send("GET", "/api/products/missing", { cookie })).status).toBe(404);
    expect((await send("GET", "/nowhere")).status).toBe(404);
    expect((await send("POST", "/api/imports", { body: { url: "https://example.com/x" }, cookie })).status).toBe(422);
    expect(logger.entries.at(-1)).toMatchObject({ level: "error", event: "request.failed" });
  });

  test("allows the web origin through CORS, with credentials", async () => {
    const { app } = createTestApp();
    const response = await app.request("/health", { headers: { origin: "http://web.test" } });
    expect(response.status).toBe(200);
    const preflight = await app.request("/api/products", {
      method: "OPTIONS",
      headers: { origin: "http://web.test", "access-control-request-method": "GET" },
    });
    expect(preflight.headers.get("access-control-allow-origin")).toBe("http://web.test");
    expect(preflight.headers.get("access-control-allow-credentials")).toBe("true");
  });
});

describe("signed-out requests", () => {
  test("every library and comparison route answers 401 with a sign-in hint", async () => {
    const { send } = createTestApp();
    const routes: [string, string][] = [
      ["GET", "/api/products"],
      ["GET", "/api/products/p1"],
      ["POST", "/api/snapshots"],
      ["POST", "/api/imports"],
      ["GET", "/api/comparisons"],
      ["POST", "/api/comparisons"],
      ["DELETE", "/api/comparisons/c1"],
      ["PUT", "/api/comparisons/c1/products/p1"],
      ["GET", "/api/products/p1/comparisons"],
    ];
    for (const [method, path] of routes) {
      const response = await send(method, path, { body: {} });
      expect({ method, path, status: response.status }).toEqual({ method, path, status: 401 });
      expect(((await response.json()) as { message: string }).message).toContain("Sign in");
    }
  });

  test("a forged session cookie is rejected", async () => {
    const { send } = createTestApp();
    expect((await send("GET", "/api/products", { cookie: "picky_session=forged" })).status).toBe(401);
  });
});

describe("isolation between users", () => {
  test("a user never sees, reads or links another user's products", async () => {
    const { send, signUp } = createTestApp();
    const alice = await signUp("alice@example.com");
    const bob = await signUp("bob@example.com");
    const created = await send("POST", "/api/snapshots", { body: buildSampleSnapshot(), cookie: alice });
    const { product } = (await created.json()) as { product: { id: string } };

    const bobsList = (await (await send("GET", "/api/products", { cookie: bob })).json()) as { products: [] };
    expect(bobsList.products).toEqual([]);
    expect((await send("GET", `/api/products/${product.id}`, { cookie: bob })).status).toBe(404);
    const stolen = await send("POST", "/api/comparisons", {
      body: { name: "Mine", productIds: [product.id] },
      cookie: bob,
    });
    expect(stolen.status).toBe(400);
  });

  test("the same listing captured by two users is two products", async () => {
    const { send, signUp } = createTestApp();
    const alice = await signUp("alice@example.com");
    const bob = await signUp("bob@example.com");
    const capture = async (cookie: string, title: string) =>
      (
        (await (await send("POST", "/api/snapshots", { body: buildSampleSnapshot({ title }), cookie })).json()) as {
          product: { id: string };
        }
      ).product.id;
    const alicesId = await capture(alice, "Alice's view");
    const bobsId = await capture(bob, "Bob's view");
    expect(bobsId).not.toBe(alicesId);
    const alicesProduct = await send("GET", `/api/products/${alicesId}`, { cookie: alice });
    expect(((await alicesProduct.json()) as { product: { snapshot: { title: string } } }).product.snapshot.title).toBe(
      "Alice's view",
    );
  });

  test("a user cannot read, rename, fill or delete another user's comparison", async () => {
    const { send, signUp } = createTestApp();
    const alice = await signUp("alice@example.com");
    const bob = await signUp("bob@example.com");
    const created = await send("POST", "/api/comparisons", { body: { name: "Alice's" }, cookie: alice });
    const { comparison } = (await created.json()) as { comparison: { id: string } };
    const path = `/api/comparisons/${comparison.id}`;
    const bobsProduct = await send("POST", "/api/snapshots", { body: buildSampleSnapshot(), cookie: bob });
    const { product } = (await bobsProduct.json()) as { product: { id: string } };

    expect((await send("GET", path, { cookie: bob })).status).toBe(404);
    expect((await send("PATCH", path, { body: { name: "Bob's now" }, cookie: bob })).status).toBe(404);
    expect((await send("PUT", `${path}/products/${product.id}`, { cookie: bob })).status).toBe(404);
    expect((await send("DELETE", path, { cookie: bob })).status).toBe(404);
    const bobsComparisons = (await (await send("GET", "/api/comparisons", { cookie: bob })).json()) as {
      comparisons: [];
    };
    expect(bobsComparisons.comparisons).toEqual([]);
    const stillThere = (await (await send("GET", path, { cookie: alice })).json()) as { comparison: { name: string } };
    expect(stillThere.comparison.name).toBe("Alice's");
  });
});
