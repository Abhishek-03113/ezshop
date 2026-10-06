import type { CatalogComparisonSummary } from "@ezshop/catalog";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, getRouteApi } from "@tanstack/react-router";
import { comparisonListQuery } from "../api/comparison-queries.ts";
import { AppBar, BrandLink, MainNav } from "../components/app-bar.tsx";
import { ComparisonIndexCard } from "../components/comparison-index-card.tsx";
import { NewComparisonEntry } from "../components/new-comparison-entry.tsx";
import { usePageTitle } from "../hooks/use-page-title.ts";

const comparisonsIndexRouteApi = getRouteApi("/comparisons");

/** /comparisons: every saved comparison as a card, plus "New comparison"; an empty state when there are none. */
export function ComparisonsIndexPage() {
  const { comparisonsClient } = comparisonsIndexRouteApi.useRouteContext();
  const { data: comparisons } = useSuspenseQuery(comparisonListQuery(comparisonsClient));
  usePageTitle("Comparisons");
  return (
    <>
      <AppBar sticky>
        <BrandLink />
        <MainNav />
      </AppBar>
      <main className="comparisons-index">
        <div className="comparisons-index-heading">
          <h1 className="page-title">Comparisons</h1>
          <NewComparisonEntry buttonClassName="soft-button" />
        </div>
        {comparisons.length === 0 ? <NoComparisonsYet /> : <ComparisonCardGrid comparisons={comparisons} />}
      </main>
    </>
  );
}

function ComparisonCardGrid({ comparisons }: { comparisons: readonly CatalogComparisonSummary[] }) {
  const now = new Date();
  return (
    <ul className="comparison-index-grid">
      {comparisons.map((comparison) => (
        <li key={comparison.id}>
          <ComparisonIndexCard comparison={comparison} now={now} />
        </li>
      ))}
    </ul>
  );
}

function NoComparisonsYet() {
  return (
    <div className="card empty-state">
      <strong>No comparisons yet</strong>
      <p className="subtle">
        Pick products in your library and press “Compare”, or start an empty comparison with “New comparison”.
      </p>
      <Link to="/" className="soft-button">
        Open library
      </Link>
    </div>
  );
}
