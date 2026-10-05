import type { CatalogComparisonDetail, CatalogComparisonSummary } from "@ezshop/catalog";
import type { ComparisonRepository } from "../../src/comparisons/comparison-repository.ts";
import type { ProductRepository } from "../../src/products/product-repository.ts";

interface StoredComparison {
  id: string;
  name: string;
  productIds: string[];
  updatedAt: number;
}

/**
 * ComparisonRepository held in memory. Ids are sequential and "time" ticks once per write, so
 * ordering assertions are deterministic. Products are resolved through the injected ProductRepository.
 */
export class InMemoryComparisonRepository implements ComparisonRepository {
  private readonly comparisons = new Map<string, StoredComparison>();
  private nextId = 1;
  private tick = 0;

  constructor(private readonly products: ProductRepository) {}

  async listComparisons(): Promise<CatalogComparisonSummary[]> {
    return [...this.comparisons.values()].sort((a, b) => b.updatedAt - a.updatedAt).map(toSummary);
  }

  async createComparison(name: string, productIds: readonly string[]): Promise<CatalogComparisonSummary> {
    const stored: StoredComparison = {
      id: `comparison-${this.nextId++}`,
      name,
      productIds: [...new Set(productIds)],
      updatedAt: ++this.tick,
    };
    this.comparisons.set(stored.id, stored);
    return toSummary(stored);
  }

  async findComparison(id: string): Promise<CatalogComparisonDetail | null> {
    const stored = this.comparisons.get(id);
    if (stored === undefined) return null;
    const found = await Promise.all(stored.productIds.map((productId) => this.products.findProductById(productId)));
    const products = found.filter((product) => product !== null);
    return { id, name: stored.name, products, updatedAt: toSummary(stored).updatedAt };
  }

  async renameComparison(id: string, name: string): Promise<CatalogComparisonSummary | null> {
    return this.touch(id, (stored) => void (stored.name = name));
  }

  async deleteComparison(id: string): Promise<boolean> {
    return this.comparisons.delete(id);
  }

  async addProduct(id: string, productId: string): Promise<CatalogComparisonSummary | null> {
    return this.touch(id, (stored) => {
      if (!stored.productIds.includes(productId)) stored.productIds.push(productId);
    });
  }

  async removeProduct(id: string, productId: string): Promise<CatalogComparisonSummary | null> {
    return this.touch(id, (stored) => {
      stored.productIds = stored.productIds.filter((candidate) => candidate !== productId);
    });
  }

  async listComparisonsForProduct(productId: string): Promise<CatalogComparisonSummary[]> {
    return (await this.listComparisons()).filter((summary) => summary.productIds.includes(productId));
  }

  private touch(id: string, change: (stored: StoredComparison) => void): CatalogComparisonSummary | null {
    const stored = this.comparisons.get(id);
    if (stored === undefined) return null;
    change(stored);
    stored.updatedAt = ++this.tick;
    return toSummary(stored);
  }
}

function toSummary(stored: StoredComparison): CatalogComparisonSummary {
  const updatedAt = new Date(Date.UTC(2026, 9, 5, 10, 0, stored.updatedAt)).toISOString();
  return { id: stored.id, name: stored.name, productIds: [...stored.productIds], updatedAt };
}
