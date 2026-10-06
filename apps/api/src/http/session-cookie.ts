import type { CatalogUser } from "@picky/catalog";
import type { Context, MiddlewareHandler } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { UnauthorizedError, type AuthService, type IssuedSession } from "../auth/auth-service.ts";

/** Hono env of routes behind `requireUser`: the signed-in user is on the context. */
export interface SignedInEnv {
  Variables: { user: CatalogUser };
}

/** How the session cookie is written; `secure` is on whenever the web app is served over https. */
export interface SessionCookieOptions {
  secure: boolean;
}

export const SESSION_COOKIE = "picky_session";

/**
 * Rejects the request with 401 unless its session cookie names a live session; otherwise puts the user
 * on the context. The extension rides the same cookie (its requests go through the web origin), so it
 * never handles credentials itself.
 *
 * @example app.use("/api/*", requireUser(auth))
 */
export function requireUser(auth: AuthService): MiddlewareHandler<SignedInEnv> {
  return async (c, next) => {
    const user = await auth.authenticate(readSessionToken(c));
    if (user === null) throw new UnauthorizedError("Sign in to Picky to save products and compare them");
    c.set("user", user);
    await next();
  };
}

/**
 * The raw session token from the request's cookie, if any.
 *
 * @example await auth.signOut(readSessionToken(c))
 */
export function readSessionToken(c: Context): string | undefined {
  return getCookie(c, SESSION_COOKIE);
}

/**
 * HttpOnly so page scripts cannot read it; SameSite=Lax so other sites cannot make writes with it.
 *
 * @example writeSessionCookie(c, await auth.signIn(email, password), { secure: true })
 */
export function writeSessionCookie(c: Context, session: IssuedSession, options: SessionCookieOptions): void {
  setCookie(c, SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "Lax",
    secure: options.secure,
    path: "/",
    expires: session.expiresAt,
  });
}

export function clearSessionCookie(c: Context, options: SessionCookieOptions): void {
  deleteCookie(c, SESSION_COOKIE, { path: "/", secure: options.secure });
}
