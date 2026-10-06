import { describe, expect, test } from "bun:test";
import { HttpComparisonsClient } from "../../src/comparisons/http-comparisons-client.ts";
import { SignInRequiredError } from "../../src/sign-in-required.ts";
import { FakeHttpApi } from "../fakes/fake-http-api.ts";
import { ReceiverStrictFetch } from "../fakes/receiver-strict-fetch.ts";

function clientFor(api: FakeHttpApi): HttpComparisonsClient {
  return new HttpComparisonsClient(api.fetch, "http://api");
}

describe("HttpComparisonsClient", () => {
  test("calls fetch as a bare function, not as a method (browser 'Illegal invocation')", async () => {
    const fetch = new ReceiverStrictFetch(() => Response.json({ comparisons: [] }));
    expect(await new HttpComparisonsClient(fetch.fetch, "http://api").list()).toEqual([]);
    expect(fetch.urls).toEqual(["http://api/api/comparisons"]);
  });

  test("list reads comparisons", async () => {
    const api = new FakeHttpApi(200, { comparisons: [{ id: "c1", name: "A", productIds: [], updatedAt: "t" }] });
    expect((await clientFor(api).list()).map((comparison) => comparison.id)).toEqual(["c1"]);
    expect(api.requests[0]).toMatchObject({ method: "GET", url: "http://api/api/comparisons", credentials: "include" });
  });

  test("a 401 throws SignInRequiredError", async () => {
    const api = new FakeHttpApi(401, { error: "UnauthorizedError", message: "Sign in" });
    await expect(clientFor(api).list()).rejects.toBeInstanceOf(SignInRequiredError);
  });

  test("get unwraps the comparison and encodes the id", async () => {
    const api = new FakeHttpApi(200, { comparison: { id: "a/b", name: "A", products: [], updatedAt: "t" } });
    expect((await clientFor(api).get("a/b")).name).toBe("A");
    expect(api.requests[0]?.url).toBe("http://api/api/comparisons/a%2Fb");
  });

  test("create posts name and product ids and returns id and name", async () => {
    const api = new FakeHttpApi(201, { comparison: { id: "c9", name: "Monitors", productIds: ["p1"] } });
    expect(await clientFor(api).create("Monitors", ["p1"])).toEqual({ id: "c9", name: "Monitors" });
    expect(api.requests[0]?.body).toEqual({ name: "Monitors", productIds: ["p1"] });
  });

  test("addProduct PUTs and removeProduct DELETEs the membership path", async () => {
    const api = new FakeHttpApi(200, { comparison: {} });
    await clientFor(api).addProduct("c1", "p1");
    await clientFor(api).removeProduct("c1", "p1");
    expect(api.requests.map((request) => `${request.method} ${request.url}`)).toEqual([
      "PUT http://api/api/comparisons/c1/products/p1",
      "DELETE http://api/api/comparisons/c1/products/p1",
    ]);
  });

  test("errors name the request and the API message", async () => {
    const api = new FakeHttpApi(404, { message: "no such comparison" });
    await expect(clientFor(api).get("zz")).rejects.toThrow("GET /api/comparisons/zz failed: no such comparison");
  });

  test("errors fall back to the status when the body is not JSON", async () => {
    const api = new FakeHttpApi(500, null);
    await expect(clientFor(api).list()).rejects.toThrow("HTTP 500");
  });

  test("malformed success bodies throw with the expected shape", async () => {
    await expect(clientFor(new FakeHttpApi(200, { nope: 1 })).list()).rejects.toThrow("expected comparisons: []");
    await expect(clientFor(new FakeHttpApi(201, { comparison: {} })).create("x")).rejects.toThrow(
      "expected { comparison: { id, name } }",
    );
  });
});
