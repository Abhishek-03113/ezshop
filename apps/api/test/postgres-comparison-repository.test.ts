import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { SQL } from "bun";
import { join } from "node:path";
import { PostgresComparisonRepository } from "../src/comparisons/postgres-comparison-repository.ts";
import { applyMigrations, loadMigrationFiles } from "../src/db/migrate.ts";
import { PostgresProductRepository } from "../src/products/postgres-product-repository.ts";
import { buildSampleSnapshot } from "./support/sample-snapshot.ts";

// Integration test; skipped unless PICKY_TEST_DATABASE_URL is set (see postgres-product-repository.test.ts).
// It uses its own schema so it cannot race that file when bun runs both files in one process.
const TEST_DATABASE_URL = Bun.env.PICKY_TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("PostgresComparisonRepository", () => {
  const sql = new SQL(TEST_DATABASE_URL ?? "");
  const products = new PostgresProductRepository(sql);
  const comparisons = new PostgresComparisonRepository(sql);
  let firstId = "";
  let secondId = "";

  beforeAll(async () => {
    await sql`DROP TABLE IF EXISTS comparison_products, comparisons, products, schema_migrations`;
    await applyMigrations(sql, await loadMigrationFiles(join(import.meta.dir, "../src/db/migrations")));
    firstId = (await products.saveSnapshot(buildSampleSnapshot({ externalId: "CMP1" }))).id;
    secondId = (await products.saveSnapshot(buildSampleSnapshot({ externalId: "CMP2" }))).id;
  });
  afterAll(() => sql.close());

  test("creates with ordered products and reads the detail back in position order", async () => {
    const created = await comparisons.createComparison("Pair", [secondId, firstId]);
    expect(created.productIds).toEqual([secondId, firstId]);
    const detail = await comparisons.findComparison(created.id);
    expect(detail?.products.map((product) => product.id)).toEqual([secondId, firstId]);
  });

  test("addProduct is idempotent and appends; removeProduct drops the link", async () => {
    const { id } = await comparisons.createComparison("Grow", [firstId]);
    await comparisons.addProduct(id, secondId);
    const again = await comparisons.addProduct(id, secondId);
    expect(again?.productIds).toEqual([firstId, secondId]);
    expect((await comparisons.removeProduct(id, firstId))?.productIds).toEqual([secondId]);
  });

  test("lists membership per product and the newest update first", async () => {
    const forFirst = await comparisons.listComparisonsForProduct(firstId);
    expect(forFirst.map((summary) => summary.name).sort()).toEqual(["Pair"]);
    expect((await comparisons.listComparisons())[0]?.name).toBe("Grow");
  });

  test("renames, treats malformed ids as missing, and deleting keeps products", async () => {
    const { id } = await comparisons.createComparison("Temp", []);
    expect((await comparisons.renameComparison(id, "Renamed"))?.name).toBe("Renamed");
    expect(await comparisons.findComparison("not-a-uuid")).toBeNull();
    expect(await comparisons.deleteComparison(id)).toBe(true);
    expect(await comparisons.deleteComparison(id)).toBe(false);
    expect(await products.findProductById(firstId)).not.toBeNull();
  });

  test("deleting a product removes it from every comparison", async () => {
    const doomed = (await products.saveSnapshot(buildSampleSnapshot({ externalId: "CMP3" }))).id;
    const { id } = await comparisons.createComparison("Doomed", [doomed, firstId]);
    await sql`DELETE FROM products WHERE id = ${doomed}`;
    expect((await comparisons.findComparison(id))?.products.map((product) => product.id)).toEqual([firstId]);
  });
});
