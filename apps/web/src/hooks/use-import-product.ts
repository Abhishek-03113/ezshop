import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { productQueryKeys } from "../api/product-queries.ts";

const rootRouteApi = getRouteApi("__root__");

/**
 * Mutation that imports a product URL through the extension, refreshes the list and opens the new spec sheet.
 *
 * @example const importProduct = useImportProduct(); importProduct.mutate(url)
 */
export function useImportProduct() {
  const { extensionBridge } = rootRouteApi.useRouteContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (productUrl: string) => extensionBridge.importLink(productUrl),
    onSuccess: async (productId) => {
      await queryClient.invalidateQueries({ queryKey: productQueryKeys.list });
      await navigate({ to: "/products/$productId", params: { productId } });
    },
  });
}
