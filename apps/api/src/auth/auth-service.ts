import type { CatalogUser } from "@picky/catalog";
import type { AccountRepository } from "./account-repository.ts";
import type { PasswordHasher } from "./password-hasher.ts";

/** The email and password do not match an account. Deliberately vague about which one was wrong. */
export class InvalidCredentialsError extends Error {
  override readonly name = "InvalidCredentialsError";
}

/** The request needs a signed-in user and carried no valid session. */
export class UnauthorizedError extends Error {
  override readonly name = "UnauthorizedError";
}

export interface IssuedSession {
  user: CatalogUser;
  /** Goes to the client once, in the session cookie; only its hash is stored. */
  token: string;
  expiresAt: Date;
}

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const TOKEN_BYTES = 32;

/**
 * Lower-cased and trimmed, so "Me@X.com " and "me@x.com" are one account.
 *
 * @example normalizeEmail(" Me@Example.COM ") // "me@example.com"
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * SHA-256 of a session token: what the database stores and looks up.
 *
 * @example hashSessionToken(token).length // 32
 */
export function hashSessionToken(token: string): Uint8Array {
  return new Bun.CryptoHasher("sha256").update(token).digest();
}

/**
 * Accounts and sessions: sign up, sign in, resolve a session token to its user, sign out.
 *
 * @example const { token } = await auth.signIn("me@example.com", "correct horse")
 */
export class AuthService {
  /** Verified against when the email is unknown, so a miss costs as long as a wrong password. */
  private decoyHash: Promise<string> | null = null;

  constructor(
    private readonly accounts: AccountRepository,
    private readonly hasher: PasswordHasher,
    private readonly now: () => Date,
  ) {}

  async signUp(email: string, password: string): Promise<IssuedSession> {
    const user = await this.accounts.createUser(normalizeEmail(email), await this.hasher.hash(password));
    return this.issueSession(user);
  }

  async signIn(email: string, password: string): Promise<IssuedSession> {
    const stored = await this.accounts.findCredentials(normalizeEmail(email));
    const matches = await this.hasher.verify(password, stored?.passwordHash ?? (await this.decoy()));
    if (stored === null || !matches) throw new InvalidCredentialsError("Email or password is incorrect");
    return this.issueSession(stored.user);
  }

  /** The token's user, or null for a missing, unknown or expired token. */
  async authenticate(token: string | undefined): Promise<CatalogUser | null> {
    if (token === undefined || token === "") return null;
    return this.accounts.findSessionUser(hashSessionToken(token), this.now());
  }

  async signOut(token: string | undefined): Promise<void> {
    if (token !== undefined && token !== "") await this.accounts.deleteSession(hashSessionToken(token));
  }

  private async issueSession(user: CatalogUser): Promise<IssuedSession> {
    const token = Buffer.from(crypto.getRandomValues(new Uint8Array(TOKEN_BYTES))).toString("base64url");
    const expiresAt = new Date(this.now().getTime() + SESSION_TTL_MS);
    await this.accounts.createSession(user.id, hashSessionToken(token), expiresAt);
    return { user, token, expiresAt };
  }

  private decoy(): Promise<string> {
    this.decoyHash ??= this.hasher.hash("decoy password, never matches");
    return this.decoyHash;
  }
}
