import { describe, expect, test } from "bun:test";
import { ApiRequestError, createProductsClient } from "../src/api/products-client.ts";
import { FakeApiServer } from "./fakes/fake-api-server.ts";

describe("createProductsClient", () => {
  test("lists products from the base URL", async () => {
    const server = new FakeApiServer(200, { products: [{ id: "p1" }] });
    expect(await createProductsClient(server.fetch, "http://api").listProducts()).toEqual([{ id: "p1" }] as never);
    expect(server.calls[0]).toEqual({ url: "http://api/api/products", method: "GET", body: null });
  });

  test("gets one product with an encoded id", async () => {
    const server = new FakeApiServer(200, { product: { id: "a/b" } });
    await createProductsClient(server.fetch, "").getProduct("a/b");
    expect(server.calls[0]?.url).toBe("/api/products/a%2Fb");
  });

  test("throws the API's message and status on failure", async () => {
    const server = new FakeApiServer(404, { message: 'No product with id "x"' });
    await expect(createProductsClient(server.fetch, "").getProduct("x")).rejects.toThrow(
      new ApiRequestError('No product with id "x"', 404),
    );
  });

  test("falls back to a generic message when the error body has none", async () => {
    const server = new FakeApiServer(500, {});
    await expect(createProductsClient(server.fetch, "").listProducts()).rejects.toThrow(
      "Request to /api/products failed with HTTP 500",
    );
  });
});
