import { describe, expect, test } from "bun:test";
import { createTestApp, sessionCookieOf } from "./support/test-app.ts";

const CREDENTIALS = { email: "Me@Example.com", password: "correct horse" };

describe("sign-up", () => {
  test("creates the account, sets an HttpOnly Lax session cookie and answers the user", async () => {
    const { send, logger } = createTestApp();
    const response = await send("POST", "/api/auth/signup", { body: CREDENTIALS });
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ user: { id: "user-1", email: "me@example.com" } });
    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
    expect(setCookie).toContain("Secure");
    expect(logger.entries.at(-1)).toMatchObject({ event: "auth.signed_up", fields: { userId: "user-1" } });
  });

  test("refuses a taken email in any case with 409", async () => {
    const { send } = createTestApp();
    await send("POST", "/api/auth/signup", { body: CREDENTIALS });
    const again = await send("POST", "/api/auth/signup", { body: { ...CREDENTIALS, email: "ME@example.COM" } });
    expect(again.status).toBe(409);
  });

  test("refuses a bad email or a short password with 400, without echoing the password", async () => {
    const { send } = createTestApp();
    expect((await send("POST", "/api/auth/signup", { body: { email: "nope", password: "long enough" } })).status).toBe(
      400,
    );
    const short = await send("POST", "/api/auth/signup", { body: { email: "a@b.co", password: "hunter2" } });
    expect(short.status).toBe(400);
    expect(await short.text()).not.toContain("hunter2");
  });
});

describe("sign-in, me and sign-out", () => {
  test("signing in with the right password opens a session that /me resolves", async () => {
    const { send } = createTestApp();
    await send("POST", "/api/auth/signup", { body: CREDENTIALS });
    const signedIn = await send("POST", "/api/auth/signin", { body: { ...CREDENTIALS, email: " me@example.com " } });
    expect(signedIn.status).toBe(200);
    const me = await send("GET", "/api/auth/me", { cookie: sessionCookieOf(signedIn) });
    expect(await me.json()).toEqual({ user: { id: "user-1", email: "me@example.com" } });
  });

  test("a wrong password and an unknown email get the same 401", async () => {
    const { send } = createTestApp();
    await send("POST", "/api/auth/signup", { body: CREDENTIALS });
    const wrongPassword = await send("POST", "/api/auth/signin", { body: { ...CREDENTIALS, password: "wrong" } });
    const unknownEmail = await send("POST", "/api/auth/signin", { body: { ...CREDENTIALS, email: "who@x.com" } });
    expect(wrongPassword.status).toBe(401);
    expect(await unknownEmail.json()).toEqual(await wrongPassword.json());
  });

  test("/me is 401 when signed out", async () => {
    const { send } = createTestApp();
    expect((await send("GET", "/api/auth/me")).status).toBe(401);
  });

  test("signing out deletes the session and clears the cookie", async () => {
    const { send, signUp, accounts } = createTestApp();
    const cookie = await signUp("me@example.com");
    const signedOut = await send("POST", "/api/auth/signout", { cookie });
    expect(signedOut.status).toBe(204);
    expect(signedOut.headers.get("set-cookie")).toContain("picky_session=;");
    expect(accounts.sessionCount).toBe(0);
    expect((await send("GET", "/api/auth/me", { cookie })).status).toBe(401);
  });
});
