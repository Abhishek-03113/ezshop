import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory } from "@tanstack/react-router";
import { renderToString } from "react-dom/server";
import type { ProductsClient } from "../../src/api/products-client.ts";
import { FakeComparisonsClient } from "./fake-comparisons-client.ts";
import type { ComparisonsClient } from "../../src/api/comparisons-client.ts";
import type { ExtensionBridge } from "../../src/api/extension-bridge.ts";
import { FakeExtensionBridge } from "./fake-extension-bridge.ts";
import { createPickyRouter } from "../../src/router.tsx";

/** Renders the real router at `path` against fake clients, after loaders have run. The extension is installed by default. */
export async function renderAppAt(
  path: string,
  productsClient: ProductsClient,
  comparisonsClient: ComparisonsClient = new FakeComparisonsClient(),
  extensionBridge: ExtensionBridge = new FakeExtensionBridge(),
): Promise<string> {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const config = { extensionUrl: "https://store.example/picky" };
  const history = createMemoryHistory({ initialEntries: [path] });
  const router = createPickyRouter(
    { queryClient, productsClient, comparisonsClient, extensionBridge, config },
    history,
  );
  await router.load();
  return renderToString(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}
