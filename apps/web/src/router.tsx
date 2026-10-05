import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, createRoute, createRouter } from "@tanstack/react-router";
import { productDetailQuery, productListQuery } from "./api/product-queries.ts";
import type { ProductsClient } from "./api/products-client.ts";
import { AppLayout } from "./components/app-layout.tsx";
import { RouteErrorPanel } from "./components/route-error-panel.tsx";
import { ProductDetailPage } from "./pages/product-detail-page.tsx";
import { ProductListPage } from "./pages/product-list-page.tsx";

/** Dependencies handed to every route through router context, instead of module-level singletons. */
export interface EzshopRouterContext {
  queryClient: QueryClient;
  productsClient: ProductsClient;
}

const rootRoute = createRootRouteWithContext<EzshopRouterContext>()({
  component: AppLayout,
  errorComponent: RouteErrorPanel,
});

const productListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
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
 * @example createEzshopRouter({ queryClient, productsClient: createProductsClient(fetch, "") })
 */
export function createEzshopRouter(context: EzshopRouterContext) {
  return createRouter({ routeTree, context, defaultPreload: "intent", defaultPreloadStaleTime: 0 });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createEzshopRouter>;
  }
}
