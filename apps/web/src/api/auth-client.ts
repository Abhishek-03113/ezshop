import type { CatalogUser } from "@picky/catalog";
import { ApiRequestError, createJsonRequester, jsonRequest, type FetchFunction } from "./json-requester.ts";

export interface AuthClient {
  /** The signed-in user, or null when the session cookie is missing or expired. */
  currentUser(): Promise<CatalogUser | null>;
  signIn(email: string, password: string): Promise<CatalogUser>;
  signUp(email: string, password: string): Promise<CatalogUser>;
  signOut(): Promise<void>;
}

type UserEnvelope = { user: CatalogUser };

/**
 * Typed client for the account endpoints. The API keeps the session in an HttpOnly cookie on this
 * origin, so the browser sends it along and no token ever reaches JavaScript.
 *
 * @example await createAuthClient(fetch, "").signIn("me@example.com", "correct horse")
 */
export function createAuthClient(fetchFunction: FetchFunction, baseUrl: string): AuthClient {
  const requestJson = createJsonRequester(fetchFunction, baseUrl);
  return {
    currentUser: async () => {
      try {
        return (await requestJson<UserEnvelope>("/api/auth/me")).user;
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 401) return null;
        throw error;
      }
    },
    signIn: async (email, password) =>
      (await requestJson<UserEnvelope>("/api/auth/signin", jsonRequest("POST", { email, password }))).user,
    signUp: async (email, password) =>
      (await requestJson<UserEnvelope>("/api/auth/signup", jsonRequest("POST", { email, password }))).user,
    signOut: () => requestJson<void>("/api/auth/signout", { method: "POST" }),
  };
}
