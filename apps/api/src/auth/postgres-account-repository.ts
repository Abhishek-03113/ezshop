import type { SQL } from "bun";
import type { CatalogUser } from "@picky/catalog";
import { EmailTakenError, type AccountRepository, type StoredCredentials } from "./account-repository.ts";

interface CredentialsRow {
  id: string;
  email: string;
  password_hash: string;
}

const UNIQUE_VIOLATION = "23505";

/**
 * AccountRepository on Postgres via Bun's built-in SQL client.
 *
 * @example await new PostgresAccountRepository(sql).findCredentials("me@example.com")
 */
export class PostgresAccountRepository implements AccountRepository {
  constructor(private readonly sql: SQL) {}

  async createUser(email: string, passwordHash: string): Promise<CatalogUser> {
    try {
      const [row]: CatalogUser[] = await this.sql`
        INSERT INTO users (email, password_hash) VALUES (${email}, ${passwordHash}) RETURNING id, email`;
      if (row === undefined) throw new Error(`Insert of user ${email} returned no row; expected exactly 1`);
      return { id: row.id, email: row.email };
    } catch (error) {
      if (isUniqueViolation(error)) throw new EmailTakenError(`An account for ${email} already exists`);
      throw error;
    }
  }

  async findCredentials(email: string): Promise<StoredCredentials | null> {
    const [row]: CredentialsRow[] = await this.sql`
      SELECT id, email, password_hash FROM users WHERE email = ${email}`;
    return row === undefined ? null : { user: { id: row.id, email: row.email }, passwordHash: row.password_hash };
  }

  async createSession(userId: string, tokenHash: Uint8Array, expiresAt: Date): Promise<void> {
    // Expired sessions are swept per user at sign-in, so the table cannot grow without bound.
    await this.sql.begin(async (tx) => {
      await tx`DELETE FROM sessions WHERE user_id = ${userId} AND expires_at <= now()`;
      await tx`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (${tokenHash}, ${userId}, ${expiresAt})`;
    });
  }

  async findSessionUser(tokenHash: Uint8Array, now: Date): Promise<CatalogUser | null> {
    const [row]: CatalogUser[] = await this.sql`
      SELECT u.id, u.email FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ${tokenHash} AND s.expires_at > ${now}`;
    return row === undefined ? null : { id: row.id, email: row.email };
  }

  async deleteSession(tokenHash: Uint8Array): Promise<void> {
    await this.sql`DELETE FROM sessions WHERE token_hash = ${tokenHash}`;
  }
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { errno?: unknown }).errno === UNIQUE_VIOLATION;
}
