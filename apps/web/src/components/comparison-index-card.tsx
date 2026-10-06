import { pluralize, type CatalogComparisonSummary } from "@picky/catalog";
import { Link } from "@tanstack/react-router";
import { formatUpdatedLabel } from "../format/format-relative-date.ts";

interface ComparisonIndexCardProps {
  comparison: CatalogComparisonSummary;
  /** Injected so the "Updated today" label is deterministic in tests. */
  now: Date;
}

/**
 * One saved comparison on the comparisons index: name, product count and last change, opening the matrix.
 *
 * @example <ComparisonIndexCard comparison={summary} now={new Date()} />
 */
export function ComparisonIndexCard({ comparison, now }: ComparisonIndexCardProps) {
  return (
    <Link
      to="/comparisons/$comparisonId"
      params={{ comparisonId: comparison.id }}
      className="card comparison-index-card"
    >
      <span className="comparison-index-name">{comparison.name}</span>
      <span className="subtle">
        {`${pluralize(comparison.productIds.length, "product")} · ${formatUpdatedLabel(comparison.updatedAt, now)}`}
      </span>
    </Link>
  );
}
