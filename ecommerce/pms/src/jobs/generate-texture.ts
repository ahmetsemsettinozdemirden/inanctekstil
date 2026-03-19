import path from "path";
import fs from "fs";
import { sql, eq } from "drizzle-orm";
import { db } from "../db/client.ts";
import { variants, designs, shopifyProducts, generatedImages } from "../db/schema.ts";
import { generatedImagesDir } from "../lib/image-paths.ts";
import { PRODUCTS_DIR } from "../lib/env.ts";
import { logger } from "../lib/logger.ts";
import type { JobRow } from "../db/schema.ts";
import type { JobExecutor } from "../lib/job-queue.ts";



export const generateTextureExecutor: JobExecutor = async (job: JobRow, log) => {
  const params = job.params as { sku: string };
  const { sku } = params;

  await log(`Starting texture generation: ${sku}`);

  // Load variant + design from DB
  const variantRows = await db.select().from(variants).where(eq(variants.sku, sku));
  if (variantRows.length === 0) throw new Error(`Variant not found: ${sku}`);
  const variant = variantRows[0];

  const designRows = await db
    .select({ design: designs, shopify: shopifyProducts })
    .from(designs)
    .leftJoin(shopifyProducts, eq(designs.id, shopifyProducts.designId))
    .where(eq(designs.id, variant.designId));

  if (designRows.length === 0) throw new Error(`Design not found for variant: ${sku}`);
  const { design } = designRows[0];

  // Build CatalogDesign/CatalogVariant compatible objects
  const catalogDesign = {
    id:           design.id,
    curtain_type: design.curtainType,
    design:       design.designName,
    width_cm:     design.widthCm,
    price:        design.price,
    composition:  design.composition,
    fabric: {
      material:     design.fabricMaterial     ?? "",
      transparency: design.fabricTransparency ?? "",
      texture:      design.fabricTexture      ?? null,
      weight:       design.fabricWeight       ?? "",
      pattern:      design.fabricPattern      ?? null,
    },
    shopify: { product_id: null, handle: "", product_type: "", status: "DRAFT", options: ["Renk"] },
    variants: [],
  };

  const catalogVariant = {
    sku,
    colour:  variant.colour,
    finish:  variant.finish,
    swatch:  variant.swatchPath ?? "",
    shopify: { variant_id: null, status: "DRAFT" },
  };

  // Ensure output directory exists
  const outDir = generatedImagesDir(sku, design.curtainType);
  fs.mkdirSync(outDir, { recursive: true });

  await log(`Output directory: ${outDir}`);

  // Dynamically import to avoid loading the image engine at server startup
  const { runTexture } = await import("../image-engine/generate.ts");

  await log("Running texture pipeline...");
  const result = await runTexture(
    catalogDesign as Parameters<typeof runTexture>[0],
    catalogVariant as Parameters<typeof runTexture>[1],
    outDir,
  );

  await log(`Pipeline complete. Score: ${result.score.overall}`);

  // Compute relative path for DB storage
  const relPath = path.relative(PRODUCTS_DIR, result.finalPath);

  // Upsert into generated_images
  await db.execute(
    sql`DELETE FROM generated_images WHERE sku = ${sku} AND image_type = 'texture'`,
  );
  await db.insert(generatedImages).values({
    sku,
    imageType: "texture",
    roomId: null,
    filePath: relPath,
    evaluationScore: result.score.overall,
  });

  await log(`Saved to: ${relPath}`);
  logger.info({ sku, score: result.score.overall }, "Texture generation complete");

  return { finalPath: relPath, score: result.score.overall };
};
