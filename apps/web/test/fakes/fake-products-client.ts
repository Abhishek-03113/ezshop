import type { CatalogProduct, CatalogProductSummary } from "@ezshop/catalog";
import type { ApiCapabilities, ProductsClient } from "../../src/api/products-client.ts";

/**
 * In-memory ProductsClient: serves canned products and records every URL passed to importProduct.
 * `capabilities` defaults to URL import on; pass an Error to simulate a failed capabilities probe.
 */
export class FakeProductsClient implements ProductsClient {
  readonly importedUrls: string[] = [];

  constructor(
    private readonly summaries: CatalogProductSummary[] = [],
    private readonly products: CatalogProduct[] = [],
    private readonly capabilities: ApiCapabilities | Error = { urlImport: true },
  ) {}

  async getCapabilities(): Promise<ApiCapabilities> {
    if (this.capabilities instanceof Error) throw this.capabilities;
    return this.capabilities;
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

  async importProduct(url: string): Promise<CatalogProduct> {
    this.importedUrls.push(url);
    const product = this.products[0];
    if (product === undefined) throw new Error("FakeProductsClient needs one seeded product to answer an import");
    return product;
  }
}
