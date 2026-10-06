import { describe, expect, test } from "bun:test";
import { ProductPageError } from "@picky/catalog";
import { InvalidSnapshotError, ProductIngestion } from "../src/products/product-ingestion.ts";
import { FakeHtmlFetcher } from "./fakes/fake-html-fetcher.ts";
import { InMemoryProductRepository } from "./fakes/in-memory-product-repository.ts";
import { htmlByFixtureUrl, loadPageFixtures } from "./support/page-fixtures.ts";
import { buildSampleSnapshot } from "./support/sample-snapshot.ts";

const NOW = new Date("2026-10-05T10:00:00Z");
const USER_ID = "user-1";
const fixtures = await loadPageFixtures();

function createIngestion(pages: ReadonlyMap<string, string> = new Map()) {
  const repository = new InMemoryProductRepository();
  const fetcher = new FakeHtmlFetcher(pages);
  return { repository, fetcher, ingestion: new ProductIngestion(repository, fetcher, () => NOW) };
}

describe("ProductIngestion.ingestSnapshot", () => {
  test("stores a valid snapshot in the user's library only", async () => {
    const { ingestion, repository } = createIngestion();
    const product = await ingestion.ingestSnapshot(USER_ID, buildSampleSnapshot());
    expect(await repository.findProductById(USER_ID, product.id)).toEqual(product);
    expect(await repository.findProductById("user-2", product.id)).toBeNull();
  });

  test("lists each failing path in the error", async () => {
    const { ingestion } = createIngestion();
    const rejected = ingestion.ingestSnapshot(USER_ID, { ...buildSampleSnapshot(), title: "", source: "ebay" });
    await expect(rejected).rejects.toThrow(InvalidSnapshotError);
    await expect(rejected).rejects.toThrow(/source: .*; title: /);
  });
});

describe("ProductIngestion.importFromUrl", () => {
  test.each(fixtures.map((fixture) => [fixture.name, fixture] as const))(
    "scrapes, extracts and stores %s",
    async (_name, fixture) => {
      const { ingestion, fetcher } = createIngestion(htmlByFixtureUrl(fixtures));
      const product = await ingestion.importFromUrl(USER_ID, fixture.url);
      expect(fetcher.requestedUrls).toEqual([fixture.url]);
      expect(product.snapshot).toEqual({ ...fixture.expected, capturedAt: NOW.toISOString() });
    },
  );

  test("refuses unsupported URLs without scraping", async () => {
    const { ingestion, fetcher } = createIngestion();
    await expect(ingestion.importFromUrl(USER_ID, "https://example.com/item")).rejects.toThrow(ProductPageError);
    await expect(ingestion.importFromUrl(USER_ID, "https://example.com/item")).rejects.toThrow("amazon.in (e.g.");
    expect(fetcher.requestedUrls).toEqual([]);
  });
});
