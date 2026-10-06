import type { CatalogUser } from "@picky/catalog";
import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { authQueryKeys } from "../api/auth-queries.ts";
import type { SignInMode } from "../auth/sign-in-search.ts";

const rootRouteApi = getRouteApi("__root__");

export interface Credentials {
  email: string;
  password: string;
}

/**
 * Signs in (or signs up, by `mode`) and then opens `destination`. Everything cached before belongs to
 * whoever was signed in earlier, so the cache is dropped and only the new user is kept.
 *
 * @example useSignIn("signin", "/comparisons").mutate({ email, password })
 */
export function useSignIn(mode: SignInMode, destination: string): UseMutationResult<CatalogUser, Error, Credentials> {
  const { authClient } = rootRouteApi.useRouteContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({ email, password }) =>
      mode === "signup" ? authClient.signUp(email, password) : authClient.signIn(email, password),
    onSuccess: async (user) => {
      queryClient.clear();
      queryClient.setQueryData(authQueryKeys.currentUser, user);
      await navigate({ href: destination, replace: true });
    },
  });
}

/**
 * Ends the session, forgets every cached page of this user and returns to the sign-in page.
 *
 * @example useSignOut().mutate()
 */
export function useSignOut(): UseMutationResult<void, Error, void> {
  const { authClient } = rootRouteApi.useRouteContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => authClient.signOut(),
    onSuccess: async () => {
      queryClient.clear();
      queryClient.setQueryData(authQueryKeys.currentUser, null);
      await navigate({ to: "/login", search: {} });
    },
  });
}
