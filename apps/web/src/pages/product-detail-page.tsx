import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, getRouteApi } from "@tanstack/react-router";
import { comparisonListQuery, productComparisonsQuery } from "../api/comparison-queries.ts";
import { productDetailQuery } from "../api/product-queries.ts";
import { AppBar, MainNav } from "../components/app-bar.tsx";
import { ChevronLeftIcon } from "../components/icons.tsx";
import { usePageTitle } from "../hooks/use-page-title.ts";
import { ProductComparisonsCard } from "../components/product-comparisons-card.tsx";
import { ProductSummary } from "../components/product-summary.tsx";
import { SourceLink } from "../components/source-link.tsx";
import { SpecSheet } from "../components/spec-sheet.tsx";

const productRouteApi = getRouteApi("/products/$productId");

/** One product as a spec sheet: summary on top, then every spec group. */
export function ProductDetailPage() {
  const { productId } = productRouteApi.useParams();
  const { productsClient } = productRouteApi.useRouteContext();
  const { data: product } = useSuspenseQuery(productDetailQuery(productsClient, productId));
  const { snapshot } = product;
  usePageTitle(snapshot.title);
  return (
    <>
      <AppBar sticky>
        <Link to="/" className="back-link">
          <ChevronLeftIcon size={20} />
          Library
        </Link>
        <MainNav />
        <SourceLink source={snapshot.source} url={snapshot.url} />
      </AppBar>
      <main className="page wide detail-page">
        <ProductSummary snapshot={snapshot} />
        <ProductComparisons
          productId={productId}
          suggestedName={snapshot.category ?? snapshot.brand ?? "New comparison"}
        />
        <SpecSheet groups={snapshot.specGroups} />
      </main>
    </>
  );
}

interface ProductComparisonsProps {
  productId: string;
  suggestedName: string;
}

function ProductComparisons({ productId, suggestedName }: ProductComparisonsProps) {
  const { comparisonsClient } = productRouteApi.useRouteContext();
  const { data: allComparisons } = useSuspenseQuery(comparisonListQuery(comparisonsClient));
  const { data: memberOf } = useSuspenseQuery(productComparisonsQuery(comparisonsClient, productId));
  return (
    <ProductComparisonsCard
      productId={productId}
      suggestedName={suggestedName}
      allComparisons={allComparisons}
      memberOf={memberOf}
    />
  );
}
