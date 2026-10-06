import { describe, expect, test } from "bun:test";
import { AuthService, hashSessionToken, normalizeEmail, SESSION_TTL_MS } from "../src/auth/auth-service.ts";
import { bunPasswordHasher } from "../src/auth/password-hasher.ts";
import { InMemoryAccountRepository } from "./fakes/in-memory-account-repository.ts";
import { plainPasswordHasher } from "./fakes/plain-password-hasher.ts";

describe("AuthService sessions", () => {
  test("a session stops resolving once it expires", async () => {
    let now = new Date("2026-10-05T10:00:00Z");
    const auth = new AuthService(new InMemoryAccountRepository(), plainPasswordHasher, () => now);
    const { token, expiresAt } = await auth.signUp("me@example.com", "correct horse");
    expect(expiresAt.getTime() - now.getTime()).toBe(SESSION_TTL_MS);
    expect(await auth.authenticate(token)).toEqual({ id: "user-1", email: "me@example.com" });
    now = expiresAt;
    expect(await auth.authenticate(token)).toBeNull();
  });

  test("stores only the token's hash, and tokens are unique per sign-in", async () => {
    const accounts = new InMemoryAccountRepository();
    const auth = new AuthService(accounts, plainPasswordHasher, () => new Date("2026-10-05T10:00:00Z"));
    const first = await auth.signUp("me@example.com", "correct horse");
    const second = await auth.signIn("me@example.com", "correct horse");
    expect(second.token).not.toBe(first.token);
    expect(await accounts.findSessionUser(hashSessionToken(first.token), new Date(0))).not.toBeNull();
    expect(await auth.authenticate(undefined)).toBeNull();
  });
});

describe("helpers", () => {
  test("normalizeEmail trims and lower-cases", () => {
    expect(normalizeEmail("  Me@Example.COM ")).toBe("me@example.com");
  });

  test("bunPasswordHasher round-trips with argon2id and rejects a wrong password", async () => {
    const hash = await bunPasswordHasher.hash("correct horse");
    expect(hash).toStartWith("$argon2id$");
    expect(await bunPasswordHasher.verify("correct horse", hash)).toBe(true);
    expect(await bunPasswordHasher.verify("wrong", hash)).toBe(false);
  });
});
