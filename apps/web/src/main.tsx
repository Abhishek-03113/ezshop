import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createAuthClient } from "./api/auth-client.ts";
import { createComparisonsClient } from "./api/comparisons-client.ts";
import { createWindowExtensionBridge } from "./api/extension-bridge.ts";
import { createProductsClient } from "./api/products-client.ts";
import { createSessionExpiryHandler } from "./auth/session-expiry.ts";
import { readAppConfig } from "./config/app-config.ts";
import { createPickyRouter } from "./router.tsx";
import "@picky/ui-tokens/tokens.css";
import "@picky/ui-tokens/credit-footer.css";
import "./styles.css";

// Composition root for the browser: real fetch, same-origin API (Vite proxies /api in dev), so the
// HttpOnly session cookie travels with every request without any code handling it.
// The caches' error hook needs the router, which needs the cache: the arrows defer the lookup.
const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: (error) => onApiError(error) }),
  mutationCache: new MutationCache({ onError: (error) => onApiError(error) }),
  defaultOptions: { queries: { staleTime: 30_000 } },
});
const router = createPickyRouter({
  queryClient,
  authClient: createAuthClient(fetch.bind(window), ""),
  productsClient: createProductsClient(fetch.bind(window), ""),
  comparisonsClient: createComparisonsClient(fetch.bind(window), ""),
  extensionBridge: createWindowExtensionBridge(window, () => crypto.randomUUID()),
  config: readAppConfig(import.meta.env),
});
const onApiError = createSessionExpiryHandler(queryClient, router);

const rootElement = document.getElementById("root");
if (rootElement === null) throw new Error('Missing <div id="root"> in index.html; expected the Vite entry markup');

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
