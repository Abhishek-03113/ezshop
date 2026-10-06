import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { apiCapabilitiesQuery } from "../api/product-queries.ts";

const rootRouteApi = getRouteApi("__root__");

/**
 * Whether the API can import a product from a pasted link. Off on DOM-capture-only deployments,
 * where products arrive through the extension instead. The root loader has already fetched it.
 *
 * @example const urlImportEnabled = useUrlImportEnabled()
 */
export function useUrlImportEnabled(): boolean {
  const { productsClient } = rootRouteApi.useRouteContext();
  return useSuspenseQuery(apiCapabilitiesQuery(productsClient)).data.urlImport;
}
