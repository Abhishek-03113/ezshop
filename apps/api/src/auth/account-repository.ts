import type { CatalogUser } from "@picky/catalog";

/** The email is already registered. */
export class EmailTakenError extends Error {
  override readonly name = "EmailTakenError";
}

export interface StoredCredentials {
  user: CatalogUser;
  passwordHash: string;
}

/**
 * Storage for users and their sessions. Emails arrive normalized (see `normalizeEmail`);
 * session tokens arrive already hashed, so the raw token never reaches the database.
 */
export interface AccountRepository {
  /** Throws EmailTakenError when the email is registered already. */
  createUser(email: string, passwordHash: string): Promise<CatalogUser>;
  findCredentials(email: string): Promise<StoredCredentials | null>;
  createSession(userId: string, tokenHash: Uint8Array, expiresAt: Date): Promise<void>;
  /** The session's user, or null when it does not exist or expired before `now`. */
  findSessionUser(tokenHash: Uint8Array, now: Date): Promise<CatalogUser | null>;
  deleteSession(tokenHash: Uint8Array): Promise<void>;
}
