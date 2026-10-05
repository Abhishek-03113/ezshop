import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, getRouteApi } from "@tanstack/react-router";
import { productDetailQuery } from "../api/product-queries.ts";
import { AppBar } from "../components/app-bar.tsx";
import { ChevronLeftIcon } from "../components/icons.tsx";
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
  return (
    <>
      <AppBar sticky>
        <Link to="/" className="back-link">
          <ChevronLeftIcon size={20} />
          Library
        </Link>
        <SourceLink source={snapshot.source} url={snapshot.url} />
      </AppBar>
      <main className="page wide detail-page">
        <ProductSummary snapshot={snapshot} />
        <SpecSheet groups={snapshot.specGroups} />
      </main>
    </>
  );
}
