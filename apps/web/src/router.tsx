import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, createRoute, createRouter, type RouterHistory } from "@tanstack/react-router";
import { productDetailQuery, productListQuery } from "./api/product-queries.ts";
import type { ProductsClient } from "./api/products-client.ts";
import type { AppConfig } from "./config/app-config.ts";
import { AppLayout } from "./components/app-layout.tsx";
import { RouteErrorPanel } from "./components/route-error-panel.tsx";
import { parseImportSearch } from "./import/import-search.ts";
import { ProductDetailPage } from "./pages/product-detail-page.tsx";
import { ProductListPage } from "./pages/product-list-page.tsx";

/** Dependencies handed to every route through router context, instead of module-level singletons. */
export interface EzshopRouterContext {
  queryClient: QueryClient;
  productsClient: ProductsClient;
  config: AppConfig;
}

const rootRoute = createRootRouteWithContext<EzshopRouterContext>()({
  component: AppLayout,
  errorComponent: RouteErrorPanel,
});

const productListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  validateSearch: parseImportSearch,
  loader: ({ context }) => context.queryClient.ensureQueryData(productListQuery(context.productsClient)),
  component: ProductListPage,
});

const productDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products/$productId",
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(productDetailQuery(context.productsClient, params.productId)),
  component: ProductDetailPage,
});

const routeTree = rootRoute.addChildren([productListRoute, productDetailRoute]);

/**
 * Builds the app router around injected dependencies.
 *
 * `history` defaults to the browser history; tests pass a memory history.
 *
 * @example createEzshopRouter({ queryClient, productsClient: createProductsClient(fetch, ""), config: readAppConfig(import.meta.env) })
 */
export function createEzshopRouter(context: EzshopRouterContext, history?: RouterHistory) {
  return createRouter({ routeTree, context, history, defaultPreload: "intent", defaultPreloadStaleTime: 0 });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createEzshopRouter>;
  }
}
