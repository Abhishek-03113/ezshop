import { buildComparisonMatrix, type CatalogComparisonDetail, type CatalogProduct } from "@picky/catalog";
import { useState } from "react";
import { comparisonSubtitle } from "../comparison/comparison-labels.ts";
import { useMatrixControls } from "../hooks/use-matrix-controls.ts";
import { useDeleteComparison, useRenameComparison, useSetMembership } from "../hooks/use-comparison-mutations.ts";
import { AddProductPanel } from "./add-product-panel.tsx";
import { ComparisonMatrixView } from "./comparison-matrix.tsx";
import { ComparisonTitle } from "./comparison-title.tsx";
import { ComparisonToolbar } from "./comparison-toolbar.tsx";
import { PlusIcon } from "./icons.tsx";

/** Title, add/delete actions, the toolbar and the matrix of one comparison. */
export function ComparisonView({ comparison }: { comparison: CatalogComparisonDetail }) {
  const setMembership = useSetMembership();
  const setMember = (productId: string, member: boolean) =>
    setMembership.mutate({ comparisonId: comparison.id, productId, member });
  return (
    <main className="compare-main">
      <ComparisonHeading comparison={comparison} onAdd={(productId) => setMember(productId, true)} />
      <ComparisonBody products={comparison.products} onRemove={(productId) => setMember(productId, false)} />
    </main>
  );
}

interface ComparisonBodyProps {
  products: readonly CatalogProduct[];
  onRemove: (productId: string) => void;
}

/** The toolbar and the matrix it drives; an empty comparison shows a hint instead. */
function ComparisonBody({ products, onRemove }: ComparisonBodyProps) {
  const controls = useMatrixControls();
  if (products.length === 0) {
    return <p className="card empty-state">No products yet. Use “Add product”, or select products in the library.</p>;
  }
  const differencesOnly = controls.mode === "differences";
  const snapshots = products.map((product) => product.snapshot);
  const matrix = buildComparisonMatrix(snapshots, { differencesOnly, query: controls.query });
  return (
    <>
      <ComparisonToolbar controls={controls} />
      <ComparisonMatrixView
        products={products}
        matrix={matrix}
        markBest={controls.markBest}
        differencesOnly={differencesOnly}
        onRemove={onRemove}
      />
    </>
  );
}

interface ComparisonHeadingProps {
  comparison: CatalogComparisonDetail;
  onAdd: (productId: string) => void;
}

function ComparisonHeading({ comparison, onAdd }: ComparisonHeadingProps) {
  const rename = useRenameComparison();
  const remove = useDeleteComparison();
  const confirmDelete = () => {
    if (window.confirm(`Delete “${comparison.name}”? Its products stay in your library.`)) remove.mutate(comparison.id);
  };
  return (
    <div className="compare-heading">
      <div className="compare-heading-text">
        <ComparisonTitle
          name={comparison.name}
          onRename={(name) => rename.mutate({ comparisonId: comparison.id, name })}
        />
        <p className="subtle">{comparisonSubtitle(comparison.products)}</p>
      </div>
      <button type="button" className="text-button danger" onClick={confirmDelete}>
        Delete
      </button>
      <AddProductControl comparison={comparison} onAdd={onAdd} />
    </div>
  );
}

function AddProductControl({ comparison, onAdd }: ComparisonHeadingProps) {
  const [picking, setPicking] = useState(false);
  const memberIds = new Set(comparison.products.map((product) => product.id));
  return (
    <div className="menu-anchor">
      <button type="button" className="add-product-button" onClick={() => setPicking(!picking)}>
        <PlusIcon size={16} />
        Add product
      </button>
      {picking && <AddProductPanel memberIds={memberIds} onAdd={onAdd} onClose={() => setPicking(false)} />}
    </div>
  );
}
