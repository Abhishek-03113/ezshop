import type { CatalogProduct, CatalogProductSummary } from "@ezshop/catalog";
import type { ProductsClient } from "../../src/api/products-client.ts";

/** In-memory ProductsClient: serves canned products and records every URL passed to importProduct. */
export class FakeProductsClient implements ProductsClient {
  readonly importedUrls: string[] = [];

  constructor(
    private readonly summaries: CatalogProductSummary[] = [],
    private readonly products: CatalogProduct[] = [],
  ) {}

  async listProducts(): Promise<CatalogProductSummary[]> {
    return this.summaries;
  }

  async getProduct(id: string): Promise<CatalogProduct> {
    const product = this.products.find((candidate) => candidate.id === id);
    if (product === undefined) throw new Error(`FakeProductsClient has no product "${id}"; seed it in the constructor`);
    return product;
  }

  async importProduct(url: string): Promise<CatalogProduct> {
    this.importedUrls.push(url);
    const product = this.products[0];
    if (product === undefined) throw new Error("FakeProductsClient needs one seeded product to answer an import");
    return product;
  }
}
