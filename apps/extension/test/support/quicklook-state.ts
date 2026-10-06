import type { CatalogProduct } from "@picky/catalog";
import type { QuickLookState } from "../../src/messaging/messages.ts";

/** A QuickLookState selecting `selectedId` among `ids` (default just that one). */
export function stateWith(
  selectedId: string,
  products: CatalogProduct[],
  ids: readonly string[] = [selectedId],
): QuickLookState {
  return {
    comparisons: ids.map((id) => ({ id, name: `Comparison ${id}`, productIds: [], updatedAt: "t" })),
    selectedId,
    products,
    webBaseUrl: "http://web",
  };
}
