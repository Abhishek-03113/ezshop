import type { SQL } from "bun";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

export interface Migration {
  name: string;
  statements: string;
}

/**
 * Loads `*.sql` files from a directory, ordered by their numeric filename prefix.
 *
 * @example await loadMigrationFiles(join(import.meta.dir, "migrations"))
 */
export async function loadMigrationFiles(directory: string): Promise<Migration[]> {
  const names = (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort();
  return Promise.all(names.map(async (name) => ({ name, statements: await Bun.file(join(directory, name)).text() })));
}

/**
 * Applies migrations not yet recorded in `schema_migrations`, each in its own transaction.
 * Returns the names it applied.
 *
 * @example await applyMigrations(sql, await loadMigrationFiles(dir)) // ["001_create_products.sql"]
 */
export async function applyMigrations(sql: SQL, migrations: readonly Migration[]): Promise<string[]> {
  await sql`CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`;
  const appliedRows: { name: string }[] = await sql`SELECT name FROM schema_migrations`;
  const applied = new Set(appliedRows.map((row) => row.name));
  const pending = migrations.filter((migration) => !applied.has(migration.name));
  for (const migration of pending) await applyMigration(sql, migration);
  return pending.map((migration) => migration.name);
}

async function applyMigration(sql: SQL, migration: Migration): Promise<void> {
  await sql.begin(async (transaction) => {
    await transaction.unsafe(migration.statements);
    await transaction`INSERT INTO schema_migrations (name) VALUES (${migration.name})`;
  });
}
