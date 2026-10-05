import type { ProductSnapshot } from "@ezshop/catalog";
import type { QuickLookState } from "../messaging/messages.ts";

/** What the overlay needs from the service worker; chrome-quicklook-api.ts implements it over runtime messages. */
export interface QuickLookApi {
  init(): Promise<QuickLookState>;
  select(comparisonId: string): Promise<QuickLookState>;
  /** `comparisonId: null` starts a new comparison from this page. */
  add(comparisonId: string | null, snapshot: ProductSnapshot): Promise<QuickLookState>;
  remove(comparisonId: string, productId: string): Promise<QuickLookState>;
}
