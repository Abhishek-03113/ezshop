import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { SQL } from "bun";
import { join } from "node:path";
import { PostgresAccountRepository } from "../src/auth/postgres-account-repository.ts";
import { PostgresComparisonRepository } from "../src/comparisons/postgres-comparison-repository.ts";
import { applyMigrations, loadMigrationFiles } from "../src/db/migrate.ts";
import { PostgresProductRepository } from "../src/products/postgres-product-repository.ts";
import { buildSampleSnapshot } from "./support/sample-snapshot.ts";

// Integration test; skipped unless PICKY_TEST_DATABASE_URL is set (see postgres-product-repository.test.ts).
// Each file rebuilds the schema in beforeAll; bun runs test files one after another, so they do not race.
const TEST_DATABASE_URL = Bun.env.PICKY_TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("PostgresComparisonRepository", () => {
  const sql = new SQL(TEST_DATABASE_URL ?? "");
  const products = new PostgresProductRepository(sql);
  const comparisons = new PostgresComparisonRepository(sql);
  const accounts = new PostgresAccountRepository(sql);
  let user = "";
  let other = "";
  let firstId = "";
  let secondId = "";

  beforeAll(async () => {
    await sql`DROP TABLE IF EXISTS comparison_products, comparisons, products, sessions, users, schema_migrations`;
    await applyMigrations(sql, await loadMigrationFiles(join(import.meta.dir, "../src/db/migrations")));
    user = (await accounts.createUser("me@example.com", "hash")).id;
    other = (await accounts.createUser("other@example.com", "hash")).id;
    firstId = (await products.saveSnapshot(user, buildSampleSnapshot({ externalId: "CMP1" }))).id;
    secondId = (await products.saveSnapshot(user, buildSampleSnapshot({ externalId: "CMP2" }))).id;
  });
  afterAll(() => sql.close());

  test("creates with ordered products and reads the detail back in position order", async () => {
    const created = await comparisons.createComparison(user, "Pair", [secondId, firstId]);
    expect(created.productIds).toEqual([secondId, firstId]);
    const detail = await comparisons.findComparison(user, created.id);
    expect(detail?.products.map((product) => product.id)).toEqual([secondId, firstId]);
  });

  test("addProduct is idempotent and appends; removeProduct drops the link", async () => {
    const { id } = await comparisons.createComparison(user, "Grow", [firstId]);
    await comparisons.addProduct(user, id, secondId);
    const again = await comparisons.addProduct(user, id, secondId);
    expect(again?.productIds).toEqual([firstId, secondId]);
    expect((await comparisons.removeProduct(user, id, firstId))?.productIds).toEqual([secondId]);
  });

  test("lists membership per product and the newest update first", async () => {
    const forFirst = await comparisons.listComparisonsForProduct(user, firstId);
    expect(forFirst.map((summary) => summary.name).sort()).toEqual(["Pair"]);
    expect((await comparisons.listComparisons(user))[0]?.name).toBe("Grow");
  });

  test("renames, treats malformed ids as missing, and deleting keeps products", async () => {
    const { id } = await comparisons.createComparison(user, "Temp", []);
    expect((await comparisons.renameComparison(user, id, "Renamed"))?.name).toBe("Renamed");
    expect(await comparisons.findComparison(user, "not-a-uuid")).toBeNull();
    expect(await comparisons.deleteComparison(user, id)).toBe(true);
    expect(await comparisons.deleteComparison(user, id)).toBe(false);
    expect(await products.findProductById(user, firstId)).not.toBeNull();
  });

  test("deleting a product removes it from every comparison", async () => {
    const doomed = (await products.saveSnapshot(user, buildSampleSnapshot({ externalId: "CMP3" }))).id;
    const { id } = await comparisons.createComparison(user, "Doomed", [doomed, firstId]);
    await sql`DELETE FROM products WHERE id = ${doomed}`;
    expect((await comparisons.findComparison(user, id))?.products.map((product) => product.id)).toEqual([firstId]);
  });

  test("another user's comparison is invisible and cannot be changed", async () => {
    const { id } = await comparisons.createComparison(user, "Private", [firstId]);
    expect(await comparisons.findComparison(other, id)).toBeNull();
    expect(await comparisons.renameComparison(other, id, "Taken")).toBeNull();
    expect(await comparisons.removeProduct(other, id, firstId)).toBeNull();
    expect(await comparisons.deleteComparison(other, id)).toBe(false);
    expect(await comparisons.listComparisons(other)).toEqual([]);
    expect((await comparisons.findComparison(user, id))?.products.map((product) => product.id)).toEqual([firstId]);
  });

  test("the schema refuses to link another user's product into a comparison", async () => {
    const foreign = (await products.saveSnapshot(other, buildSampleSnapshot({ externalId: "CMP9" }))).id;
    const { id } = await comparisons.createComparison(user, "Guarded", []);
    await expect(comparisons.addProduct(user, id, foreign)).rejects.toThrow("comparison_products_product_fkey");
  });

  test("deleting a user removes their products, comparisons and links", async () => {
    const doomed = (await accounts.createUser("doomed@example.com", "hash")).id;
    const productId = (await products.saveSnapshot(doomed, buildSampleSnapshot({ externalId: "CMP8" }))).id;
    await comparisons.createComparison(doomed, "Gone", [productId]);
    await sql`DELETE FROM users WHERE id = ${doomed}`;
    const [counts]: { products: number; comparisons: number }[] = await sql`
      SELECT (SELECT count(*)::int FROM products WHERE user_id = ${doomed}) AS products,
             (SELECT count(*)::int FROM comparisons WHERE user_id = ${doomed}) AS comparisons`;
    expect(counts).toEqual({ products: 0, comparisons: 0 });
  });
});
