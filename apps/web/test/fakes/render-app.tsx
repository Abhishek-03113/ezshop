import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory } from "@tanstack/react-router";
import { renderToString } from "react-dom/server";
import type { ProductsClient } from "../../src/api/products-client.ts";
import { FakeComparisonsClient } from "./fake-comparisons-client.ts";
import type { ComparisonsClient } from "../../src/api/comparisons-client.ts";
import { createEzshopRouter } from "../../src/router.tsx";

/** Renders the real router at `path` against a fake client, after loaders have run. */
export async function renderAppAt(
  path: string,
  productsClient: ProductsClient,
  comparisonsClient: ComparisonsClient = new FakeComparisonsClient(),
): Promise<string> {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const config = { extensionUrl: "https://store.example/ezshop" };
  const history = createMemoryHistory({ initialEntries: [path] });
  const router = createEzshopRouter({ queryClient, productsClient, comparisonsClient, config }, history);
  await router.load();
  return renderToString(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}
