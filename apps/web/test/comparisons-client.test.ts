import { describe, expect, test } from "bun:test";
import { createComparisonsClient } from "../src/api/comparisons-client.ts";
import { createProductsClient } from "../src/api/products-client.ts";
import { FakeApiServer } from "./fakes/fake-api-server.ts";

describe("createComparisonsClient", () => {
  test("lists comparisons", async () => {
    const server = new FakeApiServer(200, { comparisons: [{ id: "c1" }] });
    expect(await createComparisonsClient(server.fetch, "").listComparisons()).toEqual([{ id: "c1" }] as never);
    expect(server.calls[0]).toEqual({ url: "/api/comparisons", method: "GET", body: null });
  });

  test("creates with name and product ids, unwrapping the envelope", async () => {
    const server = new FakeApiServer(201, { comparison: { id: "c1" } });
    await createComparisonsClient(server.fetch, "").createComparison("Monitors", ["p1"]);
    expect(server.calls[0]).toEqual({
      url: "/api/comparisons",
      method: "POST",
      body: '{"name":"Monitors","productIds":["p1"]}',
    });
  });

  test("renames with PATCH and encodes ids", async () => {
    const server = new FakeApiServer(200, { comparison: { id: "a/b" } });
    await createComparisonsClient(server.fetch, "").renameComparison("a/b", "New");
    expect(server.calls[0]).toEqual({ url: "/api/comparisons/a%2Fb", method: "PATCH", body: '{"name":"New"}' });
  });

  test("adds with PUT and removes with DELETE on the membership path", async () => {
    const server = new FakeApiServer(200, { comparison: { id: "c1" } });
    const client = createComparisonsClient(server.fetch, "");
    await client.addProduct("c1", "p1");
    await client.removeProduct("c1", "p1");
    expect(server.calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "PUT /api/comparisons/c1/products/p1",
      "DELETE /api/comparisons/c1/products/p1",
    ]);
  });

  test("deleting a comparison tolerates the empty 204 answer", async () => {
    const fetchNoContent = async () => new Response(null, { status: 204 });
    expect(await createComparisonsClient(fetchNoContent, "").deleteComparison("c1")).toBeUndefined();
  });

  test("lists the comparisons of one product", async () => {
    const server = new FakeApiServer(200, { comparisons: [] });
    await createComparisonsClient(server.fetch, "").listComparisonsForProduct("p1");
    expect(server.calls[0]?.url).toBe("/api/products/p1/comparisons");
  });

  test("surfaces the API message on failure", async () => {
    const server = new FakeApiServer(404, { message: 'No comparison with id "x"' });
    await expect(createComparisonsClient(server.fetch, "").getComparison("x")).rejects.toThrow(
      'No comparison with id "x"',
    );
  });
});

describe("createProductsClient search", () => {
  test("sends a trimmed, encoded ?q= and omits it when blank", async () => {
    const server = new FakeApiServer(200, { products: [] });
    const client = createProductsClient(server.fetch, "");
    await client.listProducts(" usb-c 90W ");
    await client.listProducts("  ");
    expect(server.calls.map((call) => call.url)).toEqual(["/api/products?q=usb-c%2090W", "/api/products"]);
  });
});
