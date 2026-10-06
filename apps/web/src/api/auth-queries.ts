import { queryOptions } from "@tanstack/react-query";
import type { AuthClient } from "./auth-client.ts";

export const authQueryKeys = {
  currentUser: ["auth", "me"] as const,
};

/**
 * Query for the signed-in user (null when signed out). The route guard and the nav both read it.
 *
 * @example await queryClient.ensureQueryData(currentUserQuery(authClient))
 */
export function currentUserQuery(client: AuthClient) {
  return queryOptions({ queryKey: authQueryKeys.currentUser, queryFn: () => client.currentUser() });
}
