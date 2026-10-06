import type { QueryClient } from "@tanstack/react-query";
import { authQueryKeys } from "../api/auth-queries.ts";
import { ApiRequestError } from "../api/json-requester.ts";

/** The slice of the router the handler drives; the real router satisfies it. */
export interface SignInNavigator {
  state: { location: { pathname: string; href: string } };
  navigate(options: { to: "/login"; search: { redirect: string } }): Promise<void>;
}

/**
 * Error hook for the query and mutation caches: an API 401 means the session ended (expired, or signed
 * out in another tab), so the user is sent to sign in and brought back afterwards. On /login itself a
 * 401 is just a wrong password, which the form shows.
 *
 * @example const onApiError = createSessionExpiryHandler(queryClient, router)
 */
export function createSessionExpiryHandler(
  queryClient: QueryClient,
  router: SignInNavigator,
): (error: unknown) => void {
  return (error) => {
    if (!(error instanceof ApiRequestError) || error.status !== 401) return;
    const { pathname, href } = router.state.location;
    if (pathname === "/login") return;
    queryClient.setQueryData(authQueryKeys.currentUser, null);
    void router.navigate({ to: "/login", search: { redirect: href } });
  };
}
