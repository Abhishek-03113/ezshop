import type { CatalogComparisonSummary, CatalogProduct, ProductSnapshot } from "@picky/catalog";
import type { QuickLookState } from "../../src/messaging/messages.ts";
import type { QuickLookApi } from "../../src/quicklook/quicklook-api.ts";

/** In-memory QuickLookApi: holds comparisons with their products and records each call. */
export class FakeQuickLookApi implements QuickLookApi {
  readonly calls: string[] = [];
  failNext: Error | null = null;

  constructor(
    private comparisons: readonly CatalogComparisonSummary[],
    private readonly products: Readonly<Record<string, readonly CatalogProduct[]>>,
    private selectedId: string | null = comparisons[0]?.id ?? null,
  ) {}

  async init(): Promise<QuickLookState> {
    return this.answer("init");
  }

  async select(comparisonId: string): Promise<QuickLookState> {
    this.selectedId = comparisonId;
    return this.answer(`select ${comparisonId}`);
  }

  async add(comparisonId: string | null, snapshot: ProductSnapshot): Promise<QuickLookState> {
    const target = comparisonId ?? "created";
    if (comparisonId === null) {
      this.comparisons = [{ id: target, name: "Created", productIds: [], updatedAt: "t" }];
      this.selectedId = target;
    }
    (this.products as Record<string, CatalogProduct[]>)[target] = [
      ...(this.products[target] ?? []),
      { id: `saved-${snapshot.externalId}`, snapshot, createdAt: "t", updatedAt: "t" },
    ];
    return this.answer(`add ${target} ${snapshot.externalId}`);
  }

  async remove(comparisonId: string, productId: string): Promise<QuickLookState> {
    (this.products as Record<string, CatalogProduct[]>)[comparisonId] = (this.products[comparisonId] ?? []).filter(
      (product) => product.id !== productId,
    );
    return this.answer(`remove ${comparisonId} ${productId}`);
  }

  private answer(call: string): QuickLookState {
    this.calls.push(call);
    if (this.failNext !== null) {
      const failure = this.failNext;
      this.failNext = null;
      throw failure;
    }
    const products = this.selectedId === null ? [] : [...(this.products[this.selectedId] ?? [])];
    return {
      signedIn: true,
      comparisons: [...this.comparisons],
      selectedId: this.selectedId,
      products,
      webBaseUrl: "http://web",
    };
  }
}
