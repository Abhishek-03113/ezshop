import type { CatalogProduct, CatalogProductSummary, ProductSnapshot } from "@ezshop/catalog";
import {
  productMatchesQuery,
  summarizeProduct,
  type ProductRepository,
} from "../../src/products/product-repository.ts";

/** ProductRepository held in a Map; ids are sequential so assertions stay readable. */
export class InMemoryProductRepository implements ProductRepository {
  private readonly productsByKey = new Map<string, CatalogProduct>();
  private nextId = 1;

  async saveSnapshot(snapshot: ProductSnapshot): Promise<CatalogProduct> {
    const key = `${snapshot.source}:${snapshot.externalId}`;
    const existing = this.productsByKey.get(key);
    const product: CatalogProduct = {
      id: existing?.id ?? `product-${this.nextId++}`,
      snapshot,
      createdAt: existing?.createdAt ?? snapshot.capturedAt,
      updatedAt: snapshot.capturedAt,
    };
    this.productsByKey.set(key, product);
    return product;
  }

  async findProductById(id: string): Promise<CatalogProduct | null> {
    return [...this.productsByKey.values()].find((product) => product.id === id) ?? null;
  }

  async listProductSummaries(query = ""): Promise<CatalogProductSummary[]> {
    return [...this.productsByKey.values()]
      .filter((product) => productMatchesQuery(product.snapshot, query))
      .map(summarizeProduct);
  }
}
