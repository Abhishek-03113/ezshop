import type { SQL } from "bun";
import type { CatalogProduct, CatalogProductSummary, ProductSnapshot } from "@ezshop/catalog";
import { summarizeProduct, type ProductRepository } from "./product-repository.ts";

interface ProductRow {
  id: string;
  snapshot: ProductSnapshot;
  created_at: Date;
  updated_at: Date;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LIST_LIMIT = 200;

/**
 * ProductRepository on Postgres via Bun's built-in SQL client.
 *
 * @example new PostgresProductRepository(new SQL(config.databaseUrl)).listProductSummaries()
 */
export class PostgresProductRepository implements ProductRepository {
  constructor(private readonly sql: SQL) {}

  async saveSnapshot(snapshot: ProductSnapshot): Promise<CatalogProduct> {
    // Pass the object itself: Bun encodes it for ::jsonb. A pre-stringified value is stored as a JSON string.
    const rows: ProductRow[] = await this.sql`
      INSERT INTO products (source, external_id, snapshot)
      VALUES (${snapshot.source}, ${snapshot.externalId}, ${snapshot}::jsonb)
      ON CONFLICT (source, external_id)
      DO UPDATE SET snapshot = EXCLUDED.snapshot, updated_at = now()
      RETURNING id, snapshot, created_at, updated_at`;
    return toCatalogProduct(requireRow(rows, snapshot.externalId));
  }

  async findProductById(id: string): Promise<CatalogProduct | null> {
    // Postgres rejects a malformed uuid with an error; to callers it is simply "not found".
    if (!UUID_PATTERN.test(id)) return null;
    const rows: ProductRow[] = await this.sql`
      SELECT id, snapshot, created_at, updated_at FROM products WHERE id = ${id}`;
    return rows[0] === undefined ? null : toCatalogProduct(rows[0]);
  }

  async listProductSummaries(): Promise<CatalogProductSummary[]> {
    const rows: ProductRow[] = await this.sql`
      SELECT id, snapshot, created_at, updated_at FROM products
      ORDER BY updated_at DESC LIMIT ${LIST_LIMIT}`;
    return rows.map((row) => summarizeProduct(toCatalogProduct(row)));
  }
}

function requireRow(rows: ProductRow[], externalId: string): ProductRow {
  const row = rows[0];
  if (row !== undefined) return row;
  throw new Error(`Upsert of product ${externalId} returned ${rows.length} rows; expected exactly 1`);
}

function toCatalogProduct(row: ProductRow): CatalogProduct {
  return {
    id: row.id,
    snapshot: row.snapshot,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}
