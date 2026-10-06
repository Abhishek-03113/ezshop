import type { SQL } from "bun";
import type { CatalogProduct, CatalogProductSummary, ProductSnapshot } from "@picky/catalog";
import { isUuid } from "../db/uuid.ts";
import { summarizeProduct, type ProductRepository } from "./product-repository.ts";

interface ProductRow {
  id: string;
  snapshot: ProductSnapshot;
  created_at: Date;
  updated_at: Date;
}

const LIST_LIMIT = 200;

// Why ILIKE over derived text, not over `snapshot::text`: the raw jsonb text also holds URLs, image
// links and keys ("https", "specs"), so those words would match every product. Library-sized tables
// (hundreds of rows) need no index; move to a generated tsvector/trigram column if that changes.
// Kept in step with `searchableText` in product-repository.ts.
const SEARCH_TEXT_SQL = `concat_ws(' ', snapshot->>'title', snapshot->>'brand', snapshot->>'category', (
  SELECT string_agg((spec->>'label') || ' ' || (spec->>'value'), ' ')
  FROM jsonb_array_elements(snapshot->'specGroups') AS spec_group,
       jsonb_array_elements(spec_group->'specs') AS spec))`;

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
    if (!isUuid(id)) return null;
    const rows: ProductRow[] = await this.sql`
      SELECT id, snapshot, created_at, updated_at FROM products WHERE id = ${id}`;
    return rows[0] === undefined ? null : toCatalogProduct(rows[0]);
  }

  async listProductSummaries(query = ""): Promise<CatalogProductSummary[]> {
    const pattern = likePattern(query);
    const rows: ProductRow[] = await this.sql`
      SELECT id, snapshot, created_at, updated_at FROM products
      WHERE ${pattern}::text IS NULL OR ${this.sql.unsafe(SEARCH_TEXT_SQL)} ILIKE ${pattern}
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

/**
 * LIKE pattern for a substring search, with the user's %, _ and \\ escaped; null for a blank query.
 *
 * @example likePattern("50%") // "%50\\%%"
 */
export function likePattern(query: string): string | null {
  const trimmed = query.trim();
  if (trimmed === "") return null;
  return `%${trimmed.replace(/[\\%_]/g, "\\$&")}%`;
}
