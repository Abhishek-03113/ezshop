import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { SQL } from "bun";
import { join } from "node:path";
import { applyMigrations, loadMigrationFiles } from "../src/db/migrate.ts";
import { likePattern, PostgresProductRepository } from "../src/products/postgres-product-repository.ts";
import { buildSampleSnapshot } from "./support/sample-snapshot.ts";

// Integration test against a real, throwaway database. Skipped unless PICKY_TEST_DATABASE_URL is set
// (the repo-root .env sets it to the docker-compose Postgres).
const TEST_DATABASE_URL = Bun.env.PICKY_TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("PostgresProductRepository + migrations", () => {
  const sql = new SQL(TEST_DATABASE_URL ?? "");
  const repository = new PostgresProductRepository(sql);

  beforeAll(async () => {
    await sql`DROP TABLE IF EXISTS comparison_products, comparisons, products, schema_migrations`;
  });
  afterAll(() => sql.close());

  test("applies pending migrations once", async () => {
    const migrations = await loadMigrationFiles(join(import.meta.dir, "../src/db/migrations"));
    expect(await applyMigrations(sql, migrations)).toEqual(["001_create_products.sql", "002_create_comparisons.sql"]);
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

  test("searches title, brand, category and spec values but not urls", async () => {
    await repository.saveSnapshot(
      buildSampleSnapshot({
        externalId: "B0SEARCH01",
        title: "Dell monitor",
        category: "Monitors",
        specGroups: [{ title: "Display", specs: [{ label: "Panel", value: "IPS 100% sRGB" }] }],
      }),
    );
    const titles = async (query: string) =>
      (await repository.listProductSummaries(query)).map((summary) => summary.title);
    expect(await titles("monitors")).toEqual(["Dell monitor"]);
    expect(await titles("ips")).toEqual(["Dell monitor"]);
    expect(await titles("100%")).toEqual(["Dell monitor"]);
    expect(await titles("https")).toEqual([]);
    expect(await titles("")).toHaveLength(2);
  });
});

describe("likePattern", () => {
  test("escapes LIKE wildcards and is null for a blank query", () => {
    expect(likePattern(" 50%_a\\ ")).toBe("%50\\%\\_a\\\\%");
    expect(likePattern("  ")).toBeNull();
  });
});
