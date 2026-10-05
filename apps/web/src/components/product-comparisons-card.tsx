import type { CatalogComparisonSummary } from "@ezshop/catalog";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCreateComparison, useSetMembership } from "../hooks/use-comparison-mutations.ts";
import { PlusIcon } from "./icons.tsx";
import { NewComparisonForm } from "./new-comparison-form.tsx";

interface ProductComparisonsCardProps {
  productId: string;
  /** Pre-fills "New comparison", e.g. with the product's category. */
  suggestedName: string;
  allComparisons: readonly CatalogComparisonSummary[];
  memberOf: readonly CatalogComparisonSummary[];
}

/** "In comparisons": one checkbox per comparison to add or remove this product, plus "New comparison". */
export function ProductComparisonsCard({
  productId,
  suggestedName,
  allComparisons,
  memberOf,
}: ProductComparisonsCardProps) {
  return (
    <section className="card comparisons-card" aria-labelledby="in-comparisons-title">
      <h2 id="in-comparisons-title">In comparisons</h2>
      <MembershipList productId={productId} allComparisons={allComparisons} memberOf={memberOf} />
      <NewForProduct productId={productId} suggestedName={suggestedName} />
      <p className="hint">
        A product can sit in any number of comparisons. Removing it here doesn’t delete it from your library.
      </p>
    </section>
  );
}

function MembershipList({ productId, allComparisons, memberOf }: Omit<ProductComparisonsCardProps, "suggestedName">) {
  const setMembership = useSetMembership();
  const memberIds = new Set(memberOf.map((comparison) => comparison.id));
  if (allComparisons.length === 0) return <p className="hint">Not in any comparison yet.</p>;
  return (
    <ul className="membership-list">
      {allComparisons.map((comparison) => (
        <MembershipRow
          key={comparison.id}
          comparison={comparison}
          isMember={memberIds.has(comparison.id)}
          disabled={setMembership.isPending}
          onChange={(member) => setMembership.mutate({ comparisonId: comparison.id, productId, member })}
        />
      ))}
    </ul>
  );
}

interface MembershipRowProps {
  comparison: CatalogComparisonSummary;
  isMember: boolean;
  disabled: boolean;
  onChange: (member: boolean) => void;
}

function MembershipRow({ comparison, isMember, disabled, onChange }: MembershipRowProps) {
  return (
    <li>
      <label className="membership-row">
        <input
          type="checkbox"
          checked={isMember}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>{comparison.name}</span>
        {isMember && (
          <Link to="/comparisons/$comparisonId" params={{ comparisonId: comparison.id }} className="membership-open">
            Open
          </Link>
        )}
      </label>
    </li>
  );
}

function NewForProduct({ productId, suggestedName }: { productId: string; suggestedName: string }) {
  const [editing, setEditing] = useState(false);
  const createComparison = useCreateComparison();
  if (!editing) {
    return (
      <button type="button" className="side-new" onClick={() => setEditing(true)}>
        <PlusIcon size={16} />
        New comparison
      </button>
    );
  }
  return (
    <NewComparisonForm
      initialName={suggestedName}
      isPending={createComparison.isPending}
      errorMessage={createComparison.isError ? createComparison.error.message : null}
      onCreate={(name) => createComparison.mutate({ name, productIds: [productId] })}
      onCancel={() => setEditing(false)}
    />
  );
}
