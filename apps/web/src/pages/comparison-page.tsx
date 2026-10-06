import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { comparisonDetailQuery, comparisonListQuery } from "../api/comparison-queries.ts";
import { AppBar, BrandLink, MainNav } from "../components/app-bar.tsx";
import { ComparisonSidebar } from "../components/comparison-sidebar.tsx";
import { usePageTitle } from "../hooks/use-page-title.ts";
import { ComparisonView } from "../components/comparison-view.tsx";

const comparisonRouteApi = getRouteApi("/comparisons/$comparisonId");

/** /comparisons/$comparisonId: sidebar of all comparisons beside the matrix of this one. */
export function ComparisonPage() {
  const { comparisonId } = comparisonRouteApi.useParams();
  const { comparisonsClient } = comparisonRouteApi.useRouteContext();
  const { data: comparison } = useSuspenseQuery(comparisonDetailQuery(comparisonsClient, comparisonId));
  const { data: comparisons } = useSuspenseQuery(comparisonListQuery(comparisonsClient));
  usePageTitle(comparison.name);
  return (
    <>
      <AppBar sticky>
        <BrandLink />
        <MainNav />
      </AppBar>
      <div className="compare-layout">
        <ComparisonSidebar comparisons={comparisons} />
        <ComparisonView key={comparison.id} comparison={comparison} />
      </div>
    </>
  );
}
