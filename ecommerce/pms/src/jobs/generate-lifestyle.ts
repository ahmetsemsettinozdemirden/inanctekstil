import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { db } from "../db/client.ts";
import { variants, designs, shopifyProducts, generatedImages } from "../db/schema.ts";
import { eq } from "drizzle-orm";
import { PRODUCTS_DIR } from "../lib/env.ts";
import { logger } from "../lib/logger.ts";
import type { JobRow } from "../db/schema.ts";
import type { JobExecutor } from "../lib/job-queue.ts";

const __filename = fileURLToPath(import.meta.url);
// pms/src/jobs/ → up 2 = pms/
const PMS_ROOT = path.resolve(path.dirname(__filename), "../..");

/** Build the output directory for generated images: products/02-final-katalog-images/{TYPE}/{SKU} */
function outputDir(curtainType: string, sku: string): string {
  return path.join(PRODUCTS_DIR, "02-final-katalog-images", curtainType, sku);
}

export const generateLifestyleExecutor: JobExecutor = async (job: JobRow, log) => {
  const params = job.params as { sku: string; roomId: string };
  const { sku, roomId } = params;

  await log(`Starting lifestyle generation: ${sku} × ${roomId}`);

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

  // Load manifest for room definition
  const manifestPath = path.join(PMS_ROOT, "assets", "input", "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
    rooms: Record<string, { image: string; room_type: string; wall_color: string; floor_type: string; props: string[]; lighting: string; window_type: string }>;
  };

  const roomDef = manifest.rooms[roomId];
  if (!roomDef) throw new Error(`Room not found in manifest: ${roomId}. Available: ${Object.keys(manifest.rooms).join(", ")}`);

  await log(`Room: ${roomDef.room_type} (${roomDef.wall_color})`);

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
  const outDir = outputDir(design.curtainType, sku);
  fs.mkdirSync(outDir, { recursive: true });

  await log(`Output directory: ${outDir}`);

  // Dynamically import the image engine (avoids circular init issues)
  const { runLifestyle } = await import("../image-engine/generate.ts");

  await log("Running lifestyle pipeline...");
  const result = await runLifestyle(
    catalogDesign as Parameters<typeof runLifestyle>[0],
    catalogVariant as Parameters<typeof runLifestyle>[1],
    roomId,
    roomDef as Parameters<typeof runLifestyle>[3],
    outDir,
  );

  await log(`Pipeline complete. Score: ${result.score.overall}`);

  // Compute relative path for DB storage
  const relPath = path.relative(PRODUCTS_DIR, result.finalPath);

  // Upsert into generated_images (delete existing record for this sku+type+room, then insert)
  const { sql } = await import("drizzle-orm");
  await db.execute(
    sql`DELETE FROM generated_images WHERE sku = ${sku} AND image_type = 'lifestyle' AND room_id = ${roomId}`,
  );
  await db.insert(generatedImages).values({
    sku,
    imageType: "lifestyle",
    roomId,
    filePath: relPath,
    evaluationScore: result.score.overall,
  });

  await log(`Saved to: ${relPath}`);
  logger.info({ sku, roomId, score: result.score.overall }, "Lifestyle generation complete");

  return { finalPath: relPath, score: result.score.overall };
};
