import type { SQL } from "bun";
import type {
  CatalogComparisonDetail,
  CatalogComparisonSummary,
  CatalogProduct,
  ProductSnapshot,
} from "@ezshop/catalog";
import { isUuid } from "../db/uuid.ts";
import type { ComparisonRepository } from "./comparison-repository.ts";

interface SummaryRow {
  id: string;
  name: string;
  updated_at: Date;
  product_ids: string[];
}

interface ProductRow {
  id: string;
  snapshot: ProductSnapshot;
  created_at: Date;
  updated_at: Date;
}

// jsonb_agg (not array_agg): Bun decodes jsonb to a JS array, but returns uuid[] as raw text.
const SUMMARY_COLUMNS = (sql: SQL) => sql`
  c.id, c.name, c.updated_at,
  COALESCE(jsonb_agg(cp.product_id::text ORDER BY cp.position, cp.added_at)
           FILTER (WHERE cp.product_id IS NOT NULL), '[]'::jsonb) AS product_ids`;

/**
 * ComparisonRepository on Postgres via Bun's built-in SQL client.
 *
 * @example await new PostgresComparisonRepository(sql).createComparison("Monitors", [productId])
 */
export class PostgresComparisonRepository implements ComparisonRepository {
  constructor(private readonly sql: SQL) {}

  async listComparisons(): Promise<CatalogComparisonSummary[]> {
    const rows: SummaryRow[] = await this.sql`
      SELECT ${SUMMARY_COLUMNS(this.sql)} FROM comparisons c
      LEFT JOIN comparison_products cp ON cp.comparison_id = c.id
      GROUP BY c.id ORDER BY c.updated_at DESC, c.created_at DESC`;
    return rows.map(toSummary);
  }

  async createComparison(name: string, productIds: readonly string[]): Promise<CatalogComparisonSummary> {
    const created = await this.sql.begin(async (tx) => {
      const [row]: { id: string }[] = await tx`INSERT INTO comparisons (name) VALUES (${name}) RETURNING id`;
      const id = row?.id ?? "";
      for (const [position, productId] of productIds.entries()) {
        await tx`INSERT INTO comparison_products (comparison_id, product_id, position)
                 VALUES (${id}, ${productId}, ${position}) ON CONFLICT DO NOTHING`;
      }
      return id;
    });
    return requireSummary(await this.findSummary(created), created);
  }

  async findComparison(id: string): Promise<CatalogComparisonDetail | null> {
    const summary = await this.findSummary(id);
    if (summary === null) return null;
    const rows: ProductRow[] = await this.sql`
      SELECT p.id, p.snapshot, p.created_at, p.updated_at FROM comparison_products cp
      JOIN products p ON p.id = cp.product_id
      WHERE cp.comparison_id = ${id} ORDER BY cp.position, cp.added_at`;
    return { id: summary.id, name: summary.name, updatedAt: summary.updatedAt, products: rows.map(toProduct) };
  }

  async renameComparison(id: string, name: string): Promise<CatalogComparisonSummary | null> {
    if (!isUuid(id)) return null;
    await this.sql`UPDATE comparisons SET name = ${name}, updated_at = now() WHERE id = ${id}`;
    return this.findSummary(id);
  }

  async deleteComparison(id: string): Promise<boolean> {
    if (!isUuid(id)) return false;
    const rows: { id: string }[] = await this.sql`DELETE FROM comparisons WHERE id = ${id} RETURNING id`;
    return rows.length > 0;
  }

  async addProduct(id: string, productId: string): Promise<CatalogComparisonSummary | null> {
    if (!isUuid(id) || !isUuid(productId)) return null;
    await this.sql.begin(async (tx) => {
      const [locked]: { id: string }[] = await tx`SELECT id FROM comparisons WHERE id = ${id} FOR UPDATE`;
      if (locked === undefined) return;
      await tx`INSERT INTO comparison_products (comparison_id, product_id, position)
               VALUES (${id}, ${productId}, (SELECT COALESCE(MAX(position) + 1, 0) FROM comparison_products WHERE comparison_id = ${id}))
               ON CONFLICT DO NOTHING`;
      await tx`UPDATE comparisons SET updated_at = now() WHERE id = ${id}`;
    });
    return this.findSummary(id);
  }

  async removeProduct(id: string, productId: string): Promise<CatalogComparisonSummary | null> {
    if (!isUuid(id) || !isUuid(productId)) return null;
    await this.sql`DELETE FROM comparison_products WHERE comparison_id = ${id} AND product_id = ${productId}`;
    await this.sql`UPDATE comparisons SET updated_at = now() WHERE id = ${id}`;
    return this.findSummary(id);
  }

  async listComparisonsForProduct(productId: string): Promise<CatalogComparisonSummary[]> {
    if (!isUuid(productId)) return [];
    const all = await this.listComparisons();
    return all.filter((summary) => summary.productIds.includes(productId));
  }

  private async findSummary(id: string): Promise<CatalogComparisonSummary | null> {
    if (!isUuid(id)) return null;
    const rows: SummaryRow[] = await this.sql`
      SELECT ${SUMMARY_COLUMNS(this.sql)} FROM comparisons c
      LEFT JOIN comparison_products cp ON cp.comparison_id = c.id
      WHERE c.id = ${id} GROUP BY c.id`;
    return rows[0] === undefined ? null : toSummary(rows[0]);
  }
}

function requireSummary(summary: CatalogComparisonSummary | null, id: string): CatalogComparisonSummary {
  if (summary !== null) return summary;
  throw new Error(`Comparison ${id} vanished right after insert; expected one row`);
}

function toSummary(row: SummaryRow): CatalogComparisonSummary {
  return { id: row.id, name: row.name, productIds: row.product_ids, updatedAt: row.updated_at.toISOString() };
}

function toProduct(row: ProductRow): CatalogProduct {
  return {
    id: row.id,
    snapshot: row.snapshot,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}
