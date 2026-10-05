import type { CatalogComparisonSummary } from "@ezshop/catalog";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCreateComparison } from "../hooks/use-comparison-mutations.ts";
import { PlusIcon } from "./icons.tsx";
import { NewComparisonForm } from "./new-comparison-form.tsx";

interface ComparisonSidebarProps {
  comparisons: readonly CatalogComparisonSummary[];
}

/** Every comparison with its product count, plus "New comparison". The open one is marked current. */
export function ComparisonSidebar({ comparisons }: ComparisonSidebarProps) {
  return (
    <nav aria-label="Comparisons" className="compare-sidebar">
      {comparisons.map((comparison) => (
        <Link
          key={comparison.id}
          to="/comparisons/$comparisonId"
          params={{ comparisonId: comparison.id }}
          className="side-link"
          activeProps={{ "aria-current": "page" }}
        >
          <span className="side-link-name">{comparison.name}</span>
          <span className="side-link-count">{comparison.productIds.length}</span>
        </Link>
      ))}
      <NewComparisonEntry />
    </nav>
  );
}

function NewComparisonEntry() {
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
      isPending={createComparison.isPending}
      errorMessage={createComparison.isError ? createComparison.error.message : null}
      onCreate={(name) => createComparison.mutate({ name, productIds: [] })}
      onCancel={() => setEditing(false)}
    />
  );
}
