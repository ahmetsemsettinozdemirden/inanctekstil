import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import path from "path";
import { fileURLToPath } from "url";
import { DATABASE_URL } from "../lib/env.ts";
import { logger } from "../lib/logger.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function runMigrations(): Promise<void> {
  const client = postgres(DATABASE_URL, { max: 1 });
  try {
    const db = drizzle(client);
    const migrationsFolder = path.resolve(__dirname, "migrations");
    logger.info({ migrationsFolder }, "Running database migrations");
    await migrate(db, { migrationsFolder });
    logger.info("Database migrations completed");
  } finally {
    await client.end();
  }
}
