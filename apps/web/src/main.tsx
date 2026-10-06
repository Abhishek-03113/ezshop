import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createComparisonsClient } from "./api/comparisons-client.ts";
import { createWindowExtensionBridge } from "./api/extension-bridge.ts";
import { createProductsClient } from "./api/products-client.ts";
import { readAppConfig } from "./config/app-config.ts";
import { createPickyRouter } from "./router.tsx";
import "@picky/ui-tokens/tokens.css";
import "./styles.css";

// Composition root for the browser: real fetch, same-origin API (Vite proxies /api in dev).
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });
const router = createPickyRouter({
  queryClient,
  productsClient: createProductsClient(fetch.bind(window), ""),
  comparisonsClient: createComparisonsClient(fetch.bind(window), ""),
  extensionBridge: createWindowExtensionBridge(window, () => crypto.randomUUID()),
  config: readAppConfig(import.meta.env),
});

const rootElement = document.getElementById("root");
if (rootElement === null) throw new Error('Missing <div id="root"> in index.html; expected the Vite entry markup');

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
