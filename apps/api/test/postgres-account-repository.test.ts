import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { SQL } from "bun";
import { join } from "node:path";
import { EmailTakenError } from "../src/auth/account-repository.ts";
import { hashSessionToken } from "../src/auth/auth-service.ts";
import { PostgresAccountRepository } from "../src/auth/postgres-account-repository.ts";
import { applyMigrations, loadMigrationFiles } from "../src/db/migrate.ts";

// Integration test; skipped unless PICKY_TEST_DATABASE_URL is set (see postgres-product-repository.test.ts).
const TEST_DATABASE_URL = Bun.env.PICKY_TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("PostgresAccountRepository", () => {
  const sql = new SQL(TEST_DATABASE_URL ?? "");
  const accounts = new PostgresAccountRepository(sql);
  const now = new Date("2026-10-05T10:00:00Z");
  const later = new Date("2026-10-06T10:00:00Z");

  beforeAll(async () => {
    await sql`DROP TABLE IF EXISTS comparison_products, comparisons, products, sessions, users, schema_migrations`;
    await applyMigrations(sql, await loadMigrationFiles(join(import.meta.dir, "../src/db/migrations")));
  });
  afterAll(() => sql.close());

  test("creates a user, finds its credentials and refuses the email twice", async () => {
    const user = await accounts.createUser("me@example.com", "hash-1");
    expect(await accounts.findCredentials("me@example.com")).toEqual({ user, passwordHash: "hash-1" });
    expect(await accounts.findCredentials("who@example.com")).toBeNull();
    await expect(accounts.createUser("me@example.com", "hash-2")).rejects.toBeInstanceOf(EmailTakenError);
  });

  test("the schema refuses an email that is not lower-cased", async () => {
    await expect(accounts.createUser("Mixed@Example.com", "hash")).rejects.toThrow("users_email_check");
  });

  test("a session resolves to its user until it expires, and not after deletion", async () => {
    const { user } = (await accounts.findCredentials("me@example.com")) ?? { user: null };
    const tokenHash = hashSessionToken("token-1");
    await accounts.createSession(user?.id ?? "", tokenHash, later);
    expect(await accounts.findSessionUser(tokenHash, now)).toEqual(user);
    expect(await accounts.findSessionUser(tokenHash, later)).toBeNull();
    await accounts.deleteSession(tokenHash);
    expect(await accounts.findSessionUser(tokenHash, now)).toBeNull();
  });

  test("creating a session sweeps that user's expired ones", async () => {
    const { user } = (await accounts.findCredentials("me@example.com")) ?? { user: null };
    await sql`INSERT INTO sessions (token_hash, user_id, expires_at)
              VALUES (${hashSessionToken("stale")}, ${user?.id ?? ""}, now() - interval '1 day')`;
    await accounts.createSession(user?.id ?? "", hashSessionToken("fresh"), later);
    const rows: { count: number }[] = await sql`SELECT count(*)::int AS count FROM sessions`;
    expect(rows).toEqual([{ count: 1 }]);
  });
});
