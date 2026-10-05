import type { CatalogComparisonDetail, CatalogComparisonSummary, CatalogProduct } from "@ezshop/catalog";
import type { ComparisonsClient, CreatedComparison } from "../../src/comparisons/comparisons-client.ts";

/** In-memory ComparisonsClient: seed comparisons and products, inspect `calls` afterwards. */
export class FakeComparisonsClient implements ComparisonsClient {
  readonly calls: string[] = [];
  failWith: Error | null = null;
  private readonly members = new Map<string, string[]>();
  private readonly names = new Map<string, string>();
  private nextId = 1;

  constructor(
    comparisons: readonly { id: string; name: string; productIds: readonly string[] }[] = [],
    private readonly products: Readonly<Record<string, CatalogProduct>> = {},
  ) {
    for (const { id, name, productIds } of comparisons) {
      this.names.set(id, name);
      this.members.set(id, [...productIds]);
    }
  }

  async list(): Promise<CatalogComparisonSummary[]> {
    this.record("list");
    return [...this.names].map(([id, name]) => ({
      id,
      name,
      productIds: [...(this.members.get(id) ?? [])],
      updatedAt: "2026-10-05T10:00:00.000Z",
    }));
  }

  async get(comparisonId: string): Promise<CatalogComparisonDetail> {
    this.record(`get ${comparisonId}`);
    const name = this.names.get(comparisonId);
    if (name === undefined) throw new Error(`FakeComparisonsClient has no comparison "${comparisonId}"`);
    const products = (this.members.get(comparisonId) ?? []).flatMap((id) => this.products[id] ?? []);
    return { id: comparisonId, name, products, updatedAt: "2026-10-05T10:00:00.000Z" };
  }

  async create(name: string, productIds: readonly string[] = []): Promise<CreatedComparison> {
    this.record(`create ${name} [${productIds.join(",")}]`);
    const id = `new-${this.nextId++}`;
    this.names.set(id, name);
    this.members.set(id, [...productIds]);
    return { id, name };
  }

  async addProduct(comparisonId: string, productId: string): Promise<void> {
    this.record(`add ${comparisonId} ${productId}`);
    const current = this.members.get(comparisonId) ?? [];
    if (!current.includes(productId)) this.members.set(comparisonId, [...current, productId]);
  }

  async removeProduct(comparisonId: string, productId: string): Promise<void> {
    this.record(`remove ${comparisonId} ${productId}`);
    this.members.set(
      comparisonId,
      (this.members.get(comparisonId) ?? []).filter((id) => id !== productId),
    );
  }

  private record(call: string): void {
    this.calls.push(call);
    if (this.failWith !== null) throw this.failWith;
  }
}
