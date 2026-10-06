import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory } from "@tanstack/react-router";
import { renderToString } from "react-dom/server";
import type { AuthClient } from "../../src/api/auth-client.ts";
import { FakeAuthClient } from "./fake-auth-client.ts";
import type { ProductsClient } from "../../src/api/products-client.ts";
import { FakeComparisonsClient } from "./fake-comparisons-client.ts";
import type { ComparisonsClient } from "../../src/api/comparisons-client.ts";
import { createPickyRouter } from "../../src/router.tsx";

/** Renders the real router at `path` against fake clients (signed in by default), after loaders have run. */
export async function renderAppAt(
  path: string,
  productsClient: ProductsClient,
  comparisonsClient: ComparisonsClient = new FakeComparisonsClient(),
  authClient: AuthClient = new FakeAuthClient(),
): Promise<string> {
  return (await renderAppWithRouter(path, productsClient, comparisonsClient, authClient)).html;
}

/** Like renderAppAt, also handing back the router so tests can see where guards sent it. */
export async function renderAppWithRouter(
  path: string,
  productsClient: ProductsClient,
  comparisonsClient: ComparisonsClient = new FakeComparisonsClient(),
  authClient: AuthClient = new FakeAuthClient(),
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const config = { extensionUrl: "https://store.example/picky" };
  const history = createMemoryHistory({ initialEntries: [path] });
  const router = createPickyRouter({ queryClient, authClient, productsClient, comparisonsClient, config }, history);
  await router.load();
  const html = renderToString(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { html, router };
}
