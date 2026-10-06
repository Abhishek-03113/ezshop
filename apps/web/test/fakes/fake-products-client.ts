import type { CatalogProduct, CatalogProductSummary } from "@picky/catalog";
import type { ProductsClient } from "../../src/api/products-client.ts";

/** In-memory ProductsClient: serves canned products and records searches and deletions. */
export class FakeProductsClient implements ProductsClient {
  constructor(
    private readonly summaries: CatalogProductSummary[] = [],
    private readonly products: CatalogProduct[] = [],
  ) {}

  readonly deletedIds: string[] = [];

  async deleteProduct(id: string): Promise<void> {
    this.deletedIds.push(id);
  }

  readonly listedQueries: string[] = [];

  async listProducts(query = ""): Promise<CatalogProductSummary[]> {
    this.listedQueries.push(query);
    const needle = query.trim().toLowerCase();
    return this.summaries.filter((summary) =>
      `${summary.title} ${summary.brand} ${summary.category}`.toLowerCase().includes(needle),
    );
  }

  async getProduct(id: string): Promise<CatalogProduct> {
    const product = this.products.find((candidate) => candidate.id === id);
    if (product === undefined) throw new Error(`FakeProductsClient has no product "${id}"; seed it in the constructor`);
    return product;
  }
}
