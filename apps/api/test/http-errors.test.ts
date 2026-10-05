import { describe, expect, test } from "bun:test";
import { ProductPageError } from "@ezshop/catalog";
import { BadRequestError, toErrorResponse } from "../src/http/http-errors.ts";
import { InvalidSnapshotError } from "../src/products/product-ingestion.ts";
import { ScrapeError } from "../src/scraping/html-fetcher.ts";

describe("toErrorResponse", () => {
  test("maps known errors to their status", () => {
    expect(toErrorResponse(new BadRequestError("x")).status).toBe(400);
    expect(toErrorResponse(new ProductPageError("x")).status).toBe(422);
    expect(toErrorResponse(new ScrapeError("x")).status).toBe(502);
  });

  test("includes snapshot issues", () => {
    const response = toErrorResponse(new InvalidSnapshotError("bad", ["title: too short"]));
    expect(response).toEqual({
      status: 400,
      body: { error: "InvalidSnapshotError", message: "bad", issues: ["title: too short"] },
    });
  });

  test("hides the message of unexpected errors", () => {
    expect(toErrorResponse(new Error("db password=hunter2"))).toEqual({
      status: 500,
      body: { error: "InternalError", message: "Unexpected server error" },
    });
  });
});
