import type { PasswordHasher } from "../../src/auth/password-hasher.ts";

/** Reversible stand-in for argon2, so tests stay fast. Never use outside tests. */
export const plainPasswordHasher: PasswordHasher = {
  hash: async (password) => `plain:${password}`,
  verify: async (password, hash) => hash === `plain:${password}`,
};
