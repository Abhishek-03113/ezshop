import { Hono, type Context } from "hono";
import { z } from "zod";
import type { AuthService } from "../auth/auth-service.ts";
import type { Logger } from "../logging/json-logger.ts";
import { BadRequestError } from "./http-errors.ts";
import { readJsonBody } from "./read-json-body.ts";
import {
  clearSessionCookie,
  readSessionToken,
  requireUser,
  writeSessionCookie,
  type SessionCookieOptions,
  type SignedInEnv,
} from "./session-cookie.ts";

export interface AuthRouteDependencies {
  auth: AuthService;
  logger: Logger;
  sessionCookie: SessionCookieOptions;
}

const SignInBodySchema = z.object({ email: z.string().min(1), password: z.string().min(1) });
// 200 chars fits any passphrase; the cap stops a megabyte "password" from tying up argon2.
const SignUpBodySchema = z.object({ email: z.email(), password: z.string().min(8).max(200) });

/**
 * Account endpoints, mounted under /api. Sign-up and sign-in answer with the user and set the session cookie:
 * POST /auth/signup, POST /auth/signin, POST /auth/signout, GET /auth/me (401 when signed out).
 *
 * @example app.route("/api", createAuthRoutes({ auth, logger, sessionCookie: { secure: true } }))
 */
export function createAuthRoutes(deps: AuthRouteDependencies): Hono {
  return new Hono()
    .post("/auth/signup", (c) => signUp(c, deps))
    .post("/auth/signin", (c) => signIn(c, deps))
    .post("/auth/signout", (c) => signOut(c, deps))
    .get("/auth/me", requireUser(deps.auth), (c: Context<SignedInEnv>) => c.json({ user: c.get("user") }));
}

async function signUp(c: Context, deps: AuthRouteDependencies): Promise<Response> {
  const body = parseBody(
    SignUpBodySchema,
    await readJsonBody(c),
    '{"email": "<address>", "password": "<8-200 chars>"}',
  );
  const session = await deps.auth.signUp(body.email, body.password);
  writeSessionCookie(c, session, deps.sessionCookie);
  deps.logger.info("auth.signed_up", { userId: session.user.id });
  return c.json({ user: session.user }, 201);
}

async function signIn(c: Context, deps: AuthRouteDependencies): Promise<Response> {
  const body = parseBody(SignInBodySchema, await readJsonBody(c), '{"email": "<address>", "password": "<text>"}');
  const session = await deps.auth.signIn(body.email, body.password);
  writeSessionCookie(c, session, deps.sessionCookie);
  deps.logger.info("auth.signed_in", { userId: session.user.id });
  return c.json({ user: session.user });
}

async function signOut(c: Context, deps: AuthRouteDependencies): Promise<Response> {
  await deps.auth.signOut(readSessionToken(c));
  clearSessionCookie(c, deps.sessionCookie);
  return c.body(null, 204);
}

// Never echoes the body: it holds a password.
function parseBody<T>(schema: z.ZodType<T>, body: unknown, expected: string): T {
  const parsed = schema.safeParse(body);
  if (parsed.success) return parsed.data;
  const fields = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
  throw new BadRequestError(`Account body has invalid ${fields}; expected ${expected}`);
}
