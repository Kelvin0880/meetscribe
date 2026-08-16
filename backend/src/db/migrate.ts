import fs from "node:fs";
import path from "node:path";
import { pool } from "./pool";
import { logger } from "../utils/logger";

const MIGRATIONS_DIR = path.resolve(__dirname, "migrations");

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const result = await pool.query("SELECT name FROM schema_migrations");
  return new Set(result.rows.map((row) => row.name as string));
}

export async function runMigrations(): Promise<void> {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      logger.info("migration_applied", { file });
    } catch (err) {
      await client.query("ROLLBACK");
      logger.error("migration_failed", { file, message: (err as Error).message });
      throw err;
    } finally {
      client.release();
    }
  }
}

// Permite correr `tsx src/db/migrate.ts` a mano además de invocarse desde el arranque del server.
if (require.main === module) {
  runMigrations()
    .then(() => {
      logger.info("migrations_complete");
      process.exit(0);
    })
    .catch((err) => {
      logger.error("migrations_failed", { message: (err as Error).message });
      process.exit(1);
    });
}
