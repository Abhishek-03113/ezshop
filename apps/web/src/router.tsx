import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, createRoute, createRouter, type RouterHistory } from "@tanstack/react-router";
import { comparisonDetailQuery, comparisonListQuery, productComparisonsQuery } from "./api/comparison-queries.ts";
import type { ComparisonsClient } from "./api/comparisons-client.ts";
import { productDetailQuery, productListQuery } from "./api/product-queries.ts";
import type { ProductsClient } from "./api/products-client.ts";
import type { AppConfig } from "./config/app-config.ts";
import { AppLayout } from "./components/app-layout.tsx";
import { RouteErrorPanel } from "./components/route-error-panel.tsx";
import { parseLibrarySearch } from "./library/library-search.ts";
import { ComparisonPage } from "./pages/comparison-page.tsx";
import { ComparisonsIndexPage } from "./pages/comparisons-index-page.tsx";
import { ProductDetailPage } from "./pages/product-detail-page.tsx";
import { ProductListPage } from "./pages/product-list-page.tsx";

/** Dependencies handed to every route through router context, instead of module-level singletons. */
export interface EzshopRouterContext {
  queryClient: QueryClient;
  productsClient: ProductsClient;
  comparisonsClient: ComparisonsClient;
  config: AppConfig;
}

const rootRoute = createRootRouteWithContext<EzshopRouterContext>()({
  // Every page shows the comparison count in the app bar, so the list is loaded once at the root.
  loader: ({ context }) => context.queryClient.ensureQueryData(comparisonListQuery(context.comparisonsClient)),
  component: AppLayout,
  errorComponent: RouteErrorPanel,
});

const productListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  validateSearch: parseLibrarySearch,
  loaderDeps: ({ search }) => ({ query: search.q ?? "" }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(productListQuery(context.productsClient, deps.query)),
  component: ProductListPage,
});

const productDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products/$productId",
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(productDetailQuery(context.productsClient, params.productId)),
      context.queryClient.ensureQueryData(productComparisonsQuery(context.comparisonsClient, params.productId)),
    ]),
  component: ProductDetailPage,
});

const comparisonsIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/comparisons",
  // The list is already loaded by the root loader; the index page reads it from the cache.
  component: ComparisonsIndexPage,
});

const comparisonRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/comparisons/$comparisonId",
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(comparisonDetailQuery(context.comparisonsClient, params.comparisonId)),
  component: ComparisonPage,
});

const routeTree = rootRoute.addChildren([productListRoute, productDetailRoute, comparisonsIndexRoute, comparisonRoute]);

/**
 * Builds the app router around injected dependencies.
 *
 * `history` defaults to the browser history; tests pass a memory history.
 *
 * @example createEzshopRouter({ queryClient, productsClient: createProductsClient(fetch, ""), comparisonsClient: createComparisonsClient(fetch, ""), config: readAppConfig(import.meta.env) })
 */
export function createEzshopRouter(context: EzshopRouterContext, history?: RouterHistory) {
  return createRouter({ routeTree, context, history, defaultPreload: "intent", defaultPreloadStaleTime: 0 });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createEzshopRouter>;
  }
}
