import type { CatalogComparisonSummary, CatalogProductSummary } from "@ezshop/catalog";
import { useAddProductsToComparison, useCreateComparison } from "../hooks/use-comparison-mutations.ts";
import { nameForSelection } from "../library/selection.ts";
import { AddToComparisonMenu } from "./add-to-comparison-menu.tsx";

interface SelectionBarProps {
  selectedProducts: readonly CatalogProductSummary[];
  comparisons: readonly CatalogComparisonSummary[];
  onClear: () => void;
  onAdded: (comparisonName: string) => void;
}

/** Floating bar while products are selected: "N selected · Clear · Add to comparison… · Compare N". */
export function SelectionBar({ selectedProducts, comparisons, onClear, onAdded }: SelectionBarProps) {
  if (selectedProducts.length === 0) return null;
  return (
    <SelectionBarContent
      selectedProducts={selectedProducts}
      comparisons={comparisons}
      onClear={onClear}
      onAdded={onAdded}
    />
  );
}

function SelectionBarContent({ selectedProducts, comparisons, onClear, onAdded }: SelectionBarProps) {
  const createComparison = useCreateComparison();
  const addProducts = useAddProductsToComparison();
  const productIds = selectedProducts.map((product) => product.id);
  const name = nameForSelection(selectedProducts);
  const create = () => createComparison.mutate({ name, productIds });
  const addTo = (comparison: CatalogComparisonSummary) =>
    addProducts.mutate({ comparisonId: comparison.id, productIds }, { onSuccess: () => onAdded(comparison.name) });
  return (
    <div role="region" aria-label="Selection" className="selection-bar">
      <span className="selection-count">{selectedProducts.length} selected</span>
      <button type="button" className="selection-clear" onClick={onClear}>
        Clear
      </button>
      <AddToComparisonMenu comparisons={comparisons} newName={name} onAddTo={addTo} onCreateNew={create} />
      <button type="button" className="selection-compare" disabled={createComparison.isPending} onClick={create}>
        Compare {selectedProducts.length}
      </button>
    </div>
  );
}
