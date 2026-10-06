/** One-way password hashing; injected so tests can skip the deliberately slow real hash. */
export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

/**
 * PasswordHasher on Bun's built-in argon2id, which salts and encodes its parameters into the hash.
 *
 * @example await bunPasswordHasher.verify("secret", await bunPasswordHasher.hash("secret")) // true
 */
export const bunPasswordHasher: PasswordHasher = {
  hash: (password) => Bun.password.hash(password, "argon2id"),
  verify: (password, hash) => Bun.password.verify(password, hash),
};
