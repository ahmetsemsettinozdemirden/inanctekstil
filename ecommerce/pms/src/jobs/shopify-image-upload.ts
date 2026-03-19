import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { db } from "../db/client.ts";
import { variants, shopifyProducts, generatedImages } from "../db/schema.ts";
import { ShopifyClient } from "../lib/shopify-client.ts";
import { PRODUCTS_DIR } from "../lib/env.ts";
import { logger } from "../lib/logger.ts";
import type { JobRow } from "../db/schema.ts";
import type { JobExecutor } from "../lib/job-queue.ts";

export const shopifyImageUploadExecutor: JobExecutor = async (job: JobRow, log) => {
  const params = job.params as { sku: string };
  const { sku } = params;

  await log(`Starting Shopify image upload for SKU: ${sku}`);

  // Load variant → design → shopify product ID
  const variantRows = await db.select().from(variants).where(eq(variants.sku, sku));
  if (variantRows.length === 0) throw new Error(`Variant not found: ${sku}`);
  const variant = variantRows[0];

  const shopifyRows = await db
    .select({ sp: shopifyProducts })
    .from(shopifyProducts)
    .where(eq(shopifyProducts.designId, variant.designId));

  const productId = shopifyRows[0]?.sp.productId ?? null;
  if (!productId) throw new Error(`Design ${variant.designId} has not been synced to Shopify yet. Run shopify-sync first.`);

  // Load generated images for this SKU that haven't been uploaded yet
  const imageRows = await db
    .select()
    .from(generatedImages)
    .where(eq(generatedImages.sku, sku));

  const pending = imageRows.filter((r) => !r.shopifyMediaId);
  if (pending.length === 0) {
    await log("No new images to upload — all already have Shopify media IDs.");
    return { uploaded: 0 };
  }

  await log(`Found ${pending.length} image(s) to upload`);

  const client = ShopifyClient.fromEnv();
  let uploaded = 0;

  for (const img of pending) {
    const absPath = path.join(PRODUCTS_DIR, img.filePath);

    if (!fs.existsSync(absPath)) {
      await log(`  SKIP ${img.filePath} — file not found on disk`);
      continue;
    }

    const filename = path.basename(absPath);
    const fileBuffer = fs.readFileSync(absPath);
    const fileSize   = String(fileBuffer.byteLength);
    const mimeType   = "image/webp";
    const altText    = `${sku} ${img.imageType}${img.roomId ? ` ${img.roomId}` : ""}`;

    await log(`  Uploading ${filename} (${(fileBuffer.byteLength / 1024).toFixed(0)} KB)...`);

    try {
      // Step 1: Get staged upload target
      const [target] = await client.stagedUploadsCreate([{
        filename,
        mimeType,
        httpMethod: "POST",
        resource:   "IMAGE",
        fileSize,
      }]);

      // Step 2: Upload file to pre-signed URL
      await client.uploadToStagedTarget(target, fileBuffer, mimeType, filename);
      await log(`    Staged upload done → ${target.resourceUrl.slice(0, 60)}...`);

      // Step 3: Attach media to Shopify product
      const media = await client.productCreateMedia(productId, [{
        originalSource: target.resourceUrl,
        alt:            altText,
      }]);

      if (media.length === 0) {
        await log(`    Warning: productCreateMedia returned no media for ${filename}`);
        continue;
      }

      const mediaId = media[0].id;
      await log(`    Media created: ${mediaId} (status: ${media[0].status})`);

      // Write media ID back to DB
      await db
        .update(generatedImages)
        .set({ shopifyMediaId: mediaId })
        .where(eq(generatedImages.id, img.id));

      uploaded++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await log(`    ERROR uploading ${filename}: ${msg}`);
      logger.error({ sku, filename, err }, "Image upload failed");
      // Continue with remaining images — don't abort the whole job
    }
  }

  await log(`Upload complete: ${uploaded}/${pending.length} image(s) uploaded`);
  logger.info({ sku, productId, uploaded, total: pending.length }, "Shopify image upload complete");

  return { uploaded, total: pending.length };
};
