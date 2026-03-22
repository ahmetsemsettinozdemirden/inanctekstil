/**
 * Clears all catalog data (designs, variants, shopify_products, generated_images)
 * and re-seeds from catalog.json. Run this after updating catalog.json.
 *
 * Usage: bun run src/db/reseed.ts
 */

import { db } from "./client.ts";
import { designs } from "./schema.ts";
import { seed } from "./seed.ts";
import { logger } from "../lib/logger.ts";

if (import.meta.main) {
  logger.info("Deleting all designs (cascade)...");
  await db.delete(designs);
  logger.info("Re-seeding from catalog.json...");
  await seed();
  logger.info("Done.");
  process.exit(0);
}
