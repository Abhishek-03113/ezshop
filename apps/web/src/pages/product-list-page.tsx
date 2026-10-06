import type { CatalogComparisonSummary, CatalogProductSummary } from "@picky/catalog";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { useState } from "react";
import { comparisonListQuery } from "../api/comparison-queries.ts";
import { productListQuery } from "../api/product-queries.ts";
import { AppBar, BrandLink, MainNav } from "../components/app-bar.tsx";
import { ImportProductForm } from "../components/import-product-form.tsx";
import { LibraryView } from "../components/library-view.tsx";
import { DEFAULT_GROUP_KEY, type GroupKey } from "../library/group-options.ts";
import { usePageTitle } from "../hooks/use-page-title.ts";
import { WelcomeView } from "../components/welcome-view.tsx";

const listRouteApi = getRouteApi("/");

interface ScreenProps {
  autoImportUrl: string | undefined;
}

function WelcomeScreen({ autoImportUrl, extensionUrl }: ScreenProps & { extensionUrl: string }) {
  return (
    <>
      <AppBar>
        <BrandLink />
        {/* The nav, not a bare title: a brand-new account lands here and must still be able to sign out. */}
        <MainNav />
      </AppBar>
      <WelcomeView extensionUrl={extensionUrl} autoImportUrl={autoImportUrl} />
    </>
  );
}

interface LibraryScreenProps extends ScreenProps {
  products: readonly CatalogProductSummary[];
  comparisons: readonly CatalogComparisonSummary[];
  query: string;
  groupKey: GroupKey;
}

function LibraryScreen({ autoImportUrl, products, comparisons, query, groupKey }: LibraryScreenProps) {
  const [now] = useState(() => new Date());
  const navigate = listRouteApi.useNavigate();
  // `replace`: typing a search or flipping the grouping should not fill the back button with steps.
  const updateSearch = (change: { q?: string | undefined; group?: GroupKey | undefined }) =>
    void navigate({ search: (previous) => ({ ...previous, ...change }), replace: true });
  return (
    <>
      <AppBar>
        <BrandLink />
        <MainNav />
        <ImportProductForm variant="pill" autoImportUrl={autoImportUrl} />
      </AppBar>
      <LibraryView
        products={products}
        comparisons={comparisons}
        query={query}
        groupKey={groupKey}
        onQueryCommit={(q) => updateSearch({ q: q === "" ? undefined : q })}
        onGroupChange={(group) => updateSearch({ group: group === DEFAULT_GROUP_KEY ? undefined : group })}
        now={now}
      />
    </>
  );
}

/** Home: the welcome screen for an empty library, otherwise the grouped library with an add-by-link pill. */
export function ProductListPage() {
  const { productsClient, comparisonsClient, config } = listRouteApi.useRouteContext();
  const { import: autoImportUrl, q = "", group = DEFAULT_GROUP_KEY } = listRouteApi.useSearch();
  const { data: products } = useSuspenseQuery(productListQuery(productsClient, q));
  const { data: comparisons } = useSuspenseQuery(comparisonListQuery(comparisonsClient));
  usePageTitle("Library");
  if (products.length === 0 && q === "") {
    return <WelcomeScreen autoImportUrl={autoImportUrl} extensionUrl={config.extensionUrl} />;
  }
  return (
    <LibraryScreen
      autoImportUrl={autoImportUrl}
      products={products}
      comparisons={comparisons}
      query={q}
      groupKey={group}
    />
  );
}
