import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import type { AuthClient } from "../api/auth-client.ts";
import { currentUserQuery } from "../api/auth-queries.ts";
import { afterSignInPath, type SignInSearch } from "./sign-in-search.ts";

export const SIGN_IN_PATH = "/login";

interface GuardContext {
  queryClient: QueryClient;
  authClient: AuthClient;
}

/**
 * Root `beforeLoad`: the library and comparisons are per account, so every page but /login needs a
 * signed-in user. Throws a redirect to /login that remembers where the visitor was going.
 *
 * @example beforeLoad: ({ context, location }) => requireSignedIn(context, location)
 */
export async function requireSignedIn(
  context: GuardContext,
  location: { pathname: string; href: string },
): Promise<void> {
  if (location.pathname === SIGN_IN_PATH) return;
  const user = await context.queryClient.ensureQueryData(currentUserQuery(context.authClient));
  if (user === null) throw redirect({ to: SIGN_IN_PATH, search: { redirect: location.href } });
}

/**
 * /login's `beforeLoad`: someone already signed in has nothing to do there, so they go on to the target.
 *
 * @example beforeLoad: ({ context, search }) => skipSignInWhenSignedIn(context, search)
 */
export async function skipSignInWhenSignedIn(context: GuardContext, search: SignInSearch): Promise<void> {
  const user = await context.queryClient.ensureQueryData(currentUserQuery(context.authClient));
  if (user !== null) throw redirect({ href: afterSignInPath(search) });
}
