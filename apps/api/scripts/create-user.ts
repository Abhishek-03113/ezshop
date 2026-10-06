// Creates a Picky account with a generated password and writes its credentials to a local file.
// Usage: bun run user:create [email] [output-file]
//   defaults: master@picky.local, ./master-user.credentials.json (git-ignored)
// Applies pending migrations first, so it also works on a fresh database.
import { SQL } from "bun";
import { chmod } from "node:fs/promises";
import { join, resolve } from "node:path";
import { normalizeEmail } from "../src/auth/auth-service.ts";
import { bunPasswordHasher } from "../src/auth/password-hasher.ts";
import { PostgresAccountRepository } from "../src/auth/postgres-account-repository.ts";
import { loadApiConfig } from "../src/config/api-config.ts";
import { applyMigrations, loadMigrationFiles } from "../src/db/migrate.ts";

const PASSWORD_BYTES = 18;

const [email = "master@picky.local", outputFile = "master-user.credentials.json"] = Bun.argv.slice(2);
const outputPath = resolve(outputFile);
if (await Bun.file(outputPath).exists()) {
  console.error(`${outputPath} already exists; move it away first so its credentials are not lost`);
  process.exit(1);
}

const config = loadApiConfig(Bun.env);
const sql = new SQL(config.databaseUrl);
await applyMigrations(sql, await loadMigrationFiles(join(import.meta.dir, "../src/db/migrations")));

const password = Buffer.from(crypto.getRandomValues(new Uint8Array(PASSWORD_BYTES))).toString("base64url");
const accounts = new PostgresAccountRepository(sql);
const user = await accounts.createUser(normalizeEmail(email), await bunPasswordHasher.hash(password));
await sql.close();

const credentials = { email: user.email, password, userId: user.id, signInAt: `${config.webOrigin}/login` };
await Bun.write(outputPath, `${JSON.stringify(credentials, null, 2)}\n`);
// Owner-only: the file holds a live password. (Bun.write ignores a `mode` option, hence the chmod.)
await chmod(outputPath, 0o600);
console.log(`Created ${credentials.email} (${user.id}); credentials written to ${outputPath}`);
