import type { QuickLookView } from "./quicklook-model.ts";

/** What the overlay's controls can ask for; implemented by QuickLookController. */
export interface OverlayActions {
  close(): void;
  select(comparisonId: string): void;
  setDifferencesOnly(differencesOnly: boolean): void;
  setView(view: QuickLookView): void;
  removeProduct(productId: string): void;
  addPage(): void;
  retry(): void;
}
