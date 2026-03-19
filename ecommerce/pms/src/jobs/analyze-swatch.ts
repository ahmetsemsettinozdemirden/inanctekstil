import path from "path";
import { eq } from "drizzle-orm";
import { db } from "../db/client.ts";
import { variants, designs } from "../db/schema.ts";
import { PRODUCTS_DIR } from "../lib/env.ts";
import { logger } from "../lib/logger.ts";
import type { JobRow } from "../db/schema.ts";
import type { JobExecutor } from "../lib/job-queue.ts";

export const analyzeSwatchExecutor: JobExecutor = async (job: JobRow, log) => {
  const params = job.params as { sku: string };
  const { sku } = params;

  await log(`Starting swatch analysis: ${sku}`);

  // Load variant from DB
  const variantRows = await db.select().from(variants).where(eq(variants.sku, sku));
  if (variantRows.length === 0) throw new Error(`Variant not found: ${sku}`);
  const variant = variantRows[0];

  if (!variant.swatchPath) throw new Error(`No swatch path for variant: ${sku}`);

  // Resolve absolute swatch path
  const swatchAbsPath = path.join(PRODUCTS_DIR, variant.swatchPath);
  await log(`Analyzing swatch: ${variant.swatchPath}`);

  // Dynamically import to avoid loading BAML/fal at server startup
  const { analyzeSwatch } = await import("../image-engine/generate.ts");

  const result = await analyzeSwatch(swatchAbsPath);

  await log(`Analysis complete: ${JSON.stringify(result)}`);

  // Update the design's fabric fields
  await db
    .update(designs)
    .set({
      fabricMaterial:     result.material,
      fabricTransparency: result.transparency,
      fabricTexture:      result.texture,
      fabricWeight:       result.weight,
      fabricPattern:      result.pattern,
      updatedAt:          new Date(),
    })
    .where(eq(designs.id, variant.designId));

  logger.info({ sku, designId: variant.designId }, "Swatch analysis complete");

  return result;
};
