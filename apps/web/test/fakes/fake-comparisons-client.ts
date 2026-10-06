import type { CatalogComparisonDetail, CatalogComparisonSummary, CatalogProduct } from "@picky/catalog";
import type { ComparisonsClient } from "../../src/api/comparisons-client.ts";

export interface SeededComparison {
  id: string;
  name: string;
  products: CatalogProduct[];
}

/** In-memory ComparisonsClient seeded with comparisons; records every write for assertions. */
export class FakeComparisonsClient implements ComparisonsClient {
  readonly writes: string[] = [];
  private comparisons: SeededComparison[];

  constructor(seeded: SeededComparison[] = []) {
    this.comparisons = seeded.map((comparison) => ({ ...comparison, products: [...comparison.products] }));
  }

  async listComparisons(): Promise<CatalogComparisonSummary[]> {
    return this.comparisons.map(toSummary);
  }

  async getComparison(id: string): Promise<CatalogComparisonDetail> {
    const { name, products } = this.require(id);
    return { id, name, products, updatedAt: UPDATED_AT };
  }

  async createComparison(name: string, productIds: readonly string[] = []): Promise<CatalogComparisonSummary> {
    this.writes.push(`create ${name} [${productIds.join(",")}]`);
    const created: SeededComparison = { id: `c${this.comparisons.length + 1}`, name, products: [] };
    this.comparisons.unshift(created);
    return toSummary(created);
  }

  async renameComparison(id: string, name: string): Promise<CatalogComparisonSummary> {
    this.writes.push(`rename ${id} ${name}`);
    const comparison = this.require(id);
    comparison.name = name;
    return toSummary(comparison);
  }

  async deleteComparison(id: string): Promise<void> {
    this.writes.push(`delete ${id}`);
    this.comparisons = this.comparisons.filter((comparison) => comparison.id !== id);
  }

  async addProduct(comparisonId: string, productId: string): Promise<CatalogComparisonSummary> {
    this.writes.push(`add ${comparisonId} ${productId}`);
    return toSummary(this.require(comparisonId));
  }

  async removeProduct(comparisonId: string, productId: string): Promise<CatalogComparisonSummary> {
    this.writes.push(`remove ${comparisonId} ${productId}`);
    return toSummary(this.require(comparisonId));
  }

  async listComparisonsForProduct(productId: string): Promise<CatalogComparisonSummary[]> {
    return this.comparisons
      .filter((comparison) => comparison.products.some((product) => product.id === productId))
      .map(toSummary);
  }

  private require(id: string): SeededComparison {
    const found = this.comparisons.find((comparison) => comparison.id === id);
    if (found === undefined)
      throw new Error(`FakeComparisonsClient has no comparison "${id}"; seed it in the constructor`);
    return found;
  }
}

const UPDATED_AT = "2026-10-05T10:00:00Z";

function toSummary(comparison: SeededComparison): CatalogComparisonSummary {
  return {
    id: comparison.id,
    name: comparison.name,
    productIds: comparison.products.map((product) => product.id),
    updatedAt: UPDATED_AT,
  };
}
