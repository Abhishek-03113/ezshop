import { describe, expect, test } from "bun:test";
import { InvalidSnapshotError, ProductIngestion } from "../src/products/product-ingestion.ts";
import { InMemoryProductRepository } from "./fakes/in-memory-product-repository.ts";
import { buildSampleSnapshot } from "./support/sample-snapshot.ts";

function createIngestion() {
  const repository = new InMemoryProductRepository();
  return { repository, ingestion: new ProductIngestion(repository) };
}

describe("ProductIngestion.ingestSnapshot", () => {
  test("stores a valid snapshot", async () => {
    const { ingestion, repository } = createIngestion();
    const product = await ingestion.ingestSnapshot(buildSampleSnapshot());
    expect(await repository.findProductById(product.id)).toEqual(product);
  });

  test("lists each failing path in the error", async () => {
    const { ingestion } = createIngestion();
    const rejected = ingestion.ingestSnapshot({ ...buildSampleSnapshot(), title: "", source: "ebay" });
    await expect(rejected).rejects.toThrow(InvalidSnapshotError);
    await expect(rejected).rejects.toThrow(/source: .*; title: /);
  });
});
