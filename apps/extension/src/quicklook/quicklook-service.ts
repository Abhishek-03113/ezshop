import type { CatalogComparisonSummary, ProductSnapshot } from "@picky/catalog";
import type { ComparisonsClient } from "../comparisons/comparisons-client.ts";
import type { QuickLookState } from "../messaging/messages.ts";
import { comparisonNameFor } from "../snapshot-category.ts";

export interface QuickLookServiceDependencies {
  comparisons: ComparisonsClient;
  settings: {
    lastComparisonId(): Promise<string | null>;
    setLastComparisonId(id: string): Promise<void>;
  };
  /** Stores the snapshot (POST /api/snapshots) and returns the product id. */
  sendSnapshot: (snapshot: ProductSnapshot) => Promise<string>;
  webBaseUrl: string;
  /** Called after anything that changes comparison names or membership, so the context menu can refresh. */
  onComparisonsChanged: () => void;
}

/**
 * Service-worker side of Quick Look: loads comparisons, remembers the last-used one, and adds or removes products.
 *
 * @example const state = await new QuickLookService(deps).init()
 */
export class QuickLookService {
  constructor(private readonly deps: QuickLookServiceDependencies) {}

  /** All comparisons with the last-used one (or the first) loaded in full. */
  async init(): Promise<QuickLookState> {
    const comparisons = await this.deps.comparisons.list();
    this.deps.onComparisonsChanged();
    return this.stateFor(comparisons, pickInitial(comparisons, await this.deps.settings.lastComparisonId()));
  }

  async select(comparisonId: string): Promise<QuickLookState> {
    await this.deps.settings.setLastComparisonId(comparisonId);
    return this.stateFor(await this.deps.comparisons.list(), comparisonId);
  }

  /** Saves the snapshot and puts it in the comparison, creating one when `comparisonId` is null. */
  async add(comparisonId: string | null, snapshot: ProductSnapshot): Promise<QuickLookState> {
    const productId = await this.deps.sendSnapshot(snapshot);
    const targetId = comparisonId ?? (await this.deps.comparisons.create(comparisonNameFor(snapshot), [productId])).id;
    if (comparisonId !== null) await this.deps.comparisons.addProduct(comparisonId, productId);
    await this.deps.settings.setLastComparisonId(targetId);
    this.deps.onComparisonsChanged();
    return this.stateFor(await this.deps.comparisons.list(), targetId);
  }

  async remove(comparisonId: string, productId: string): Promise<QuickLookState> {
    await this.deps.comparisons.removeProduct(comparisonId, productId);
    this.deps.onComparisonsChanged();
    return this.stateFor(await this.deps.comparisons.list(), comparisonId);
  }

  private async stateFor(comparisons: CatalogComparisonSummary[], selectedId: string | null): Promise<QuickLookState> {
    const products = selectedId === null ? [] : (await this.deps.comparisons.get(selectedId)).products;
    return { comparisons, selectedId, products, webBaseUrl: this.deps.webBaseUrl };
  }
}

function pickInitial(comparisons: readonly CatalogComparisonSummary[], lastUsedId: string | null): string | null {
  const lastUsed = comparisons.find((comparison) => comparison.id === lastUsedId);
  return (lastUsed ?? comparisons[0])?.id ?? null;
}
