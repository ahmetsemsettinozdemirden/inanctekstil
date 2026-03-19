/**
 * Runs database migrations once before all integration tests.
 * Registered as globalSetup in vitest.config.ts.
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, "../../src/db/migrations");
const TEST_DB_URL = "postgres://pms:pms@localhost:5432/pms_test";

export default async function setup() {
  const client = postgres(TEST_DB_URL, { max: 1 });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  await client.end();
}
