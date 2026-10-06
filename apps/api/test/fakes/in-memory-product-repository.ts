import type { CatalogProduct, CatalogProductSummary, ProductSnapshot } from "@picky/catalog";
import {
  productMatchesQuery,
  summarizeProduct,
  type ProductRepository,
} from "../../src/products/product-repository.ts";

interface OwnedProduct {
  userId: string;
  product: CatalogProduct;
}

/** ProductRepository held in a Map; ids are sequential so assertions stay readable. */
export class InMemoryProductRepository implements ProductRepository {
  private readonly productsByKey = new Map<string, OwnedProduct>();
  private nextId = 1;

  async saveSnapshot(userId: string, snapshot: ProductSnapshot): Promise<CatalogProduct> {
    const key = `${userId}:${snapshot.source}:${snapshot.externalId}`;
    const existing = this.productsByKey.get(key)?.product;
    const product: CatalogProduct = {
      id: existing?.id ?? `product-${this.nextId++}`,
      snapshot,
      createdAt: existing?.createdAt ?? snapshot.capturedAt,
      updatedAt: snapshot.capturedAt,
    };
    this.productsByKey.set(key, { userId, product });
    return product;
  }

  async findProductById(userId: string, id: string): Promise<CatalogProduct | null> {
    return this.owned(userId).find((product) => product.id === id) ?? null;
  }

  async listProductSummaries(userId: string, query = ""): Promise<CatalogProductSummary[]> {
    return this.owned(userId)
      .filter((product) => productMatchesQuery(product.snapshot, query))
      .map(summarizeProduct);
  }

  private owned(userId: string): CatalogProduct[] {
    return [...this.productsByKey.values()].filter((owned) => owned.userId === userId).map((owned) => owned.product);
  }
}
