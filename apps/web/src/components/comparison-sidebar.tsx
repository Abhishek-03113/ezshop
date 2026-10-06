import type { CatalogComparisonSummary } from "@picky/catalog";
import { Link } from "@tanstack/react-router";
import { NewComparisonEntry } from "./new-comparison-entry.tsx";

interface ComparisonSidebarProps {
  comparisons: readonly CatalogComparisonSummary[];
}

/** "All comparisons", every comparison with its product count, plus "New comparison". The open one is marked current. */
export function ComparisonSidebar({ comparisons }: ComparisonSidebarProps) {
  return (
    <nav aria-label="Comparisons" className="compare-sidebar">
      <Link to="/comparisons" className="side-link side-all" activeOptions={{ exact: true }}>
        All comparisons
      </Link>
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
      <NewComparisonEntry buttonClassName="side-new" />
    </nav>
  );
}
