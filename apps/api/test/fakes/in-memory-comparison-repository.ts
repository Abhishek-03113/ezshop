import type { CatalogComparisonDetail, CatalogComparisonSummary } from "@picky/catalog";
import type { ComparisonRepository } from "../../src/comparisons/comparison-repository.ts";
import type { ProductRepository } from "../../src/products/product-repository.ts";

interface StoredComparison {
  id: string;
  userId: string;
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

  async listComparisons(userId: string): Promise<CatalogComparisonSummary[]> {
    return [...this.comparisons.values()]
      .filter((stored) => stored.userId === userId)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map(toSummary);
  }

  async createComparison(
    userId: string,
    name: string,
    productIds: readonly string[],
  ): Promise<CatalogComparisonSummary> {
    const stored: StoredComparison = {
      id: `comparison-${this.nextId++}`,
      userId,
      name,
      productIds: [...new Set(productIds)],
      updatedAt: ++this.tick,
    };
    this.comparisons.set(stored.id, stored);
    return toSummary(stored);
  }

  async findComparison(userId: string, id: string): Promise<CatalogComparisonDetail | null> {
    const stored = this.find(userId, id);
    if (stored === null) return null;
    const found = await Promise.all(
      stored.productIds.map((productId) => this.products.findProductById(userId, productId)),
    );
    const products = found.filter((product) => product !== null);
    return { id, name: stored.name, products, updatedAt: toSummary(stored).updatedAt };
  }

  async renameComparison(userId: string, id: string, name: string): Promise<CatalogComparisonSummary | null> {
    return this.touch(userId, id, (stored) => void (stored.name = name));
  }

  async deleteComparison(userId: string, id: string): Promise<boolean> {
    return this.find(userId, id) !== null && this.comparisons.delete(id);
  }

  async addProduct(userId: string, id: string, productId: string): Promise<CatalogComparisonSummary | null> {
    return this.touch(userId, id, (stored) => {
      if (!stored.productIds.includes(productId)) stored.productIds.push(productId);
    });
  }

  async removeProduct(userId: string, id: string, productId: string): Promise<CatalogComparisonSummary | null> {
    return this.touch(userId, id, (stored) => {
      stored.productIds = stored.productIds.filter((candidate) => candidate !== productId);
    });
  }

  async listComparisonsForProduct(userId: string, productId: string): Promise<CatalogComparisonSummary[]> {
    return (await this.listComparisons(userId)).filter((summary) => summary.productIds.includes(productId));
  }

  /** Another user's comparison is as invisible as a missing one. */
  private find(userId: string, id: string): StoredComparison | null {
    const stored = this.comparisons.get(id);
    return stored?.userId === userId ? stored : null;
  }

  private touch(
    userId: string,
    id: string,
    change: (stored: StoredComparison) => void,
  ): CatalogComparisonSummary | null {
    const stored = this.find(userId, id);
    if (stored === null) return null;
    change(stored);
    stored.updatedAt = ++this.tick;
    return toSummary(stored);
  }
}

function toSummary(stored: StoredComparison): CatalogComparisonSummary {
  const updatedAt = new Date(Date.UTC(2026, 9, 5, 10, 0, stored.updatedAt)).toISOString();
  return { id: stored.id, name: stored.name, productIds: [...stored.productIds], updatedAt };
}
