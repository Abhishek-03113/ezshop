import type { CatalogUser } from "@picky/catalog";
import type { AuthClient } from "../../src/api/auth-client.ts";

export const SIGNED_IN_USER: CatalogUser = { id: "u1", email: "me@example.com" };

/** In-memory AuthClient: signed in as `user` (null = signed out); records every call. */
export class FakeAuthClient implements AuthClient {
  readonly calls: string[] = [];

  constructor(private user: CatalogUser | null = SIGNED_IN_USER) {}

  async currentUser(): Promise<CatalogUser | null> {
    return this.user;
  }

  async signIn(email: string): Promise<CatalogUser> {
    this.calls.push(`signIn ${email}`);
    this.user = { id: "u1", email };
    return this.user;
  }

  async signUp(email: string): Promise<CatalogUser> {
    this.calls.push(`signUp ${email}`);
    this.user = { id: "u1", email };
    return this.user;
  }

  async signOut(): Promise<void> {
    this.calls.push("signOut");
    this.user = null;
  }
}
