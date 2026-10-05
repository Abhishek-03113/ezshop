import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { SQL } from "bun";
import { join } from "node:path";
import { applyMigrations, loadMigrationFiles } from "../src/db/migrate.ts";
import { PostgresProductRepository } from "../src/products/postgres-product-repository.ts";
import { buildSampleSnapshot } from "./support/sample-snapshot.ts";

// Integration test against a real, throwaway database. Skipped unless EZSHOP_TEST_DATABASE_URL is set
// (the repo-root .env sets it to the docker-compose Postgres).
const TEST_DATABASE_URL = Bun.env.EZSHOP_TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("PostgresProductRepository + migrations", () => {
  const sql = new SQL(TEST_DATABASE_URL ?? "");
  const repository = new PostgresProductRepository(sql);

  beforeAll(async () => {
    await sql`DROP TABLE IF EXISTS products, schema_migrations`;
  });
  afterAll(() => sql.close());

  test("applies pending migrations once", async () => {
    const migrations = await loadMigrationFiles(join(import.meta.dir, "../src/db/migrations"));
    expect(await applyMigrations(sql, migrations)).toEqual(["001_create_products.sql"]);
    expect(await applyMigrations(sql, migrations)).toEqual([]);
  });

  test("upserts by source and external id, keeping the snapshot as an object", async () => {
    const first = await repository.saveSnapshot(buildSampleSnapshot());
    const second = await repository.saveSnapshot(buildSampleSnapshot({ title: "Renamed" }));
    expect(second.id).toBe(first.id);
    expect((await repository.findProductById(first.id))?.snapshot.title).toBe("Renamed");
  });

  test("lists summaries and treats malformed ids as not found", async () => {
    expect((await repository.listProductSummaries()).map((summary) => summary.title)).toEqual(["Renamed"]);
    expect(await repository.findProductById("not-a-uuid")).toBeNull();
  });
});
