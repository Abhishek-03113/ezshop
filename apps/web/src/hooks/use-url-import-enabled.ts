import { getRouteApi } from "@tanstack/react-router";

const rootRouteApi = getRouteApi("__root__");

/**
 * Whether a pasted product link can be imported: only with the Picky extension on this page, since
 * the store page is downloaded in the user's browser. Without it, products arrive through the extension
 * on the store's own pages instead.
 *
 * @example const urlImportEnabled = useUrlImportEnabled()
 */
export function useUrlImportEnabled(): boolean {
  return rootRouteApi.useRouteContext().extensionBridge.isAvailable();
}
