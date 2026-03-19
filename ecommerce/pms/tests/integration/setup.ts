/**
 * Integration test setup — runs migrations on pms_test DB and seeds minimal fixtures.
 * Import this at the top of each integration test file via beforeAll/afterAll.
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "path";
import { fileURLToPath } from "url";
import { designs, shopifyProducts, variants, generatedImages, jobs } from "../../src/db/schema.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, "../../src/db/migrations");
const TEST_DB_URL = process.env.DATABASE_URL!;

// Safety guard: never run destructive operations against the production DB.
// Integration tests must use DATABASE_URL that ends in "pms_test".
if (!TEST_DB_URL || !TEST_DB_URL.includes("pms_test")) {
  throw new Error(
    `Integration tests require a DATABASE_URL pointing to pms_test.\n` +
    `Got: ${TEST_DB_URL ?? "(unset)"}\n` +
    `Run tests via: bunx vitest run tests/integration (NOT bun test)`,
  );
}

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

export function createTestDb() {
  const client = postgres(TEST_DB_URL, { max: 5 });
  const db = drizzle(client);
  return { db, client };
}

export async function runMigrationsOnTestDb() {
  const client = postgres(TEST_DB_URL, { max: 1 });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  await client.end();
}

/** Truncate all tables in dependency order so each test starts clean. */
export async function clearTables(db: ReturnType<typeof drizzle>) {
  await db.delete(generatedImages);
  await db.delete(jobs);
  await db.delete(variants);
  await db.delete(shopifyProducts);
  await db.delete(designs);
}

// ---------------------------------------------------------------------------
// Minimal seed fixtures
// ---------------------------------------------------------------------------

export const FIXTURE_DESIGN_1 = {
  id:                 "tul-bornova",
  curtainType:        "TUL",
  designName:         "BORNOVA",
  widthCm:            320,
  price:              230,
  composition:        "%80 PES-%20 CO",
  fabricMaterial:     "polyester",
  fabricTransparency: "sheer",
  fabricTexture:      "fine woven mesh",
  fabricWeight:       "light",
  fabricPattern:      null,
  createdAt:          new Date("2025-01-01"),
  updatedAt:          new Date("2025-01-01"),
} as const;

export const FIXTURE_SHOPIFY_1 = {
  designId:    "tul-bornova",
  productId:   null,
  handle:      "tul-bornova",
  productType: "TUL",
  status:      "DRAFT",
  options:     ["Renk"] as string[],
  syncedAt:    null,
} as const;

export const FIXTURE_VARIANT_1 = {
  sku:              "TUL-001",
  designId:         "tul-bornova",
  colour:           "BEYAZ",
  finish:           null,
  swatchPath:       "01-cropped-katalog-images/TUL/TUL-001.JPG",
  shopifyVariantId: null,
  shopifyStatus:    "DRAFT",
  createdAt:        new Date("2025-01-01"),
} as const;

export const FIXTURE_VARIANT_2 = {
  sku:              "TUL-002",
  designId:         "tul-bornova",
  colour:           "KREM",
  finish:           null,
  swatchPath:       "01-cropped-katalog-images/TUL/TUL-002.JPG",
  shopifyVariantId: null,
  shopifyStatus:    "DRAFT",
  createdAt:        new Date("2025-01-01"),
} as const;

export async function seedFixtures(db: ReturnType<typeof drizzle>) {
  await db.insert(designs).values(FIXTURE_DESIGN_1);
  await db.insert(shopifyProducts).values({ ...FIXTURE_SHOPIFY_1, options: ["Renk"] });
  await db.insert(variants).values(FIXTURE_VARIANT_1);
  await db.insert(variants).values(FIXTURE_VARIANT_2);
}
