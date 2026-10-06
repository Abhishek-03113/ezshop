import type { CatalogUser } from "@picky/catalog";
import { EmailTakenError, type AccountRepository, type StoredCredentials } from "../../src/auth/account-repository.ts";

interface StoredSession {
  userId: string;
  expiresAt: Date;
}

/** AccountRepository held in memory; user ids are sequential so assertions stay readable. */
export class InMemoryAccountRepository implements AccountRepository {
  private readonly credentialsByEmail = new Map<string, StoredCredentials>();
  private readonly sessions = new Map<string, StoredSession>();
  private nextId = 1;

  async createUser(email: string, passwordHash: string): Promise<CatalogUser> {
    if (this.credentialsByEmail.has(email)) throw new EmailTakenError(`An account for ${email} already exists`);
    const user = { id: `user-${this.nextId++}`, email };
    this.credentialsByEmail.set(email, { user, passwordHash });
    return user;
  }

  async findCredentials(email: string): Promise<StoredCredentials | null> {
    return this.credentialsByEmail.get(email) ?? null;
  }

  async createSession(userId: string, tokenHash: Uint8Array, expiresAt: Date): Promise<void> {
    this.sessions.set(Buffer.from(tokenHash).toString("hex"), { userId, expiresAt });
  }

  async findSessionUser(tokenHash: Uint8Array, now: Date): Promise<CatalogUser | null> {
    const session = this.sessions.get(Buffer.from(tokenHash).toString("hex"));
    if (session === undefined || session.expiresAt <= now) return null;
    return [...this.credentialsByEmail.values()].find(({ user }) => user.id === session.userId)?.user ?? null;
  }

  async deleteSession(tokenHash: Uint8Array): Promise<void> {
    this.sessions.delete(Buffer.from(tokenHash).toString("hex"));
  }

  /** How many sessions are stored, live or not; lets tests see sign-out really deleted one. */
  get sessionCount(): number {
    return this.sessions.size;
  }
}
