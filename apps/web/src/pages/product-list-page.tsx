import type { CatalogProductSummary } from "@ezshop/catalog";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { useState } from "react";
import { productListQuery } from "../api/product-queries.ts";
import { AppBar, BrandLink } from "../components/app-bar.tsx";
import { ImportProductForm } from "../components/import-product-form.tsx";
import { LibraryView } from "../components/library-view.tsx";
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
        <span className="app-bar-title">Library</span>
      </AppBar>
      <WelcomeView extensionUrl={extensionUrl} autoImportUrl={autoImportUrl} />
    </>
  );
}

function LibraryScreen({ autoImportUrl, products }: ScreenProps & { products: readonly CatalogProductSummary[] }) {
  const [now] = useState(() => new Date());
  return (
    <>
      <AppBar>
        <BrandLink />
        <ImportProductForm variant="pill" autoImportUrl={autoImportUrl} />
      </AppBar>
      <LibraryView products={products} now={now} />
    </>
  );
}

/** Home: the welcome screen for an empty library, otherwise the library grid with an add-by-link pill. */
export function ProductListPage() {
  const { productsClient, config } = listRouteApi.useRouteContext();
  const { import: autoImportUrl } = listRouteApi.useSearch();
  const { data: products } = useSuspenseQuery(productListQuery(productsClient));
  if (products.length === 0) return <WelcomeScreen autoImportUrl={autoImportUrl} extensionUrl={config.extensionUrl} />;
  return <LibraryScreen autoImportUrl={autoImportUrl} products={products} />;
}
