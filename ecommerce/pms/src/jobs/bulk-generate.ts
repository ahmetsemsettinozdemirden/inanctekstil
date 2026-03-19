import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { eq } from "drizzle-orm";
import { db } from "../db/client.ts";
import { variants, generatedImages } from "../db/schema.ts";
import { enqueueJob } from "../lib/job-queue.ts";
import { logger } from "../lib/logger.ts";
import type { JobRow } from "../db/schema.ts";
import type { JobExecutor } from "../lib/job-queue.ts";

const __filename = fileURLToPath(import.meta.url);
// pms/src/jobs/ → up 2 = pms/
const PMS_ROOT = path.resolve(path.dirname(__filename), "../..");

export const bulkGenerateExecutor: JobExecutor = async (job: JobRow, log) => {
  const params = job.params as { designId: string };
  const { designId } = params;

  await log(`Starting bulk generate for design: ${designId}`);

  // Load all variants for the design
  const variantRows = await db
    .select()
    .from(variants)
    .where(eq(variants.designId, designId));

  if (variantRows.length === 0) throw new Error(`No variants found for design: ${designId}`);

  // Load manifest rooms
  const manifestPath = path.join(PMS_ROOT, "assets", "input", "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
    rooms: Record<string, unknown>;
  };
  const allRoomIds = Object.keys(manifest.rooms);

  await log(`Found ${variantRows.length} variants, ${allRoomIds.length} rooms`);

  let enqueuedCount = 0;

  for (const variant of variantRows) {
    const { sku } = variant;

    // Get existing images for this SKU
    const existingImages = await db
      .select()
      .from(generatedImages)
      .where(eq(generatedImages.sku, sku));

    const existingRooms = new Set(
      existingImages
        .filter((i) => i.imageType === "lifestyle")
        .map((i) => i.roomId),
    );
    const hasTexture = existingImages.some((i) => i.imageType === "texture");

    // Enqueue missing lifestyle jobs
    for (const roomId of allRoomIds) {
      if (!existingRooms.has(roomId)) {
        await enqueueJob("lifestyle", { sku, roomId });
        enqueuedCount++;
        await log(`Enqueued lifestyle: ${sku} × ${roomId}`);
      }
    }

    // Enqueue missing texture job
    if (!hasTexture) {
      await enqueueJob("texture", { sku });
      enqueuedCount++;
      await log(`Enqueued texture: ${sku}`);
    }
  }

  await log(`Bulk generate complete. Enqueued ${enqueuedCount} jobs.`);
  logger.info({ designId, enqueuedCount }, "Bulk generate jobs enqueued");

  return { enqueuedCount };
};
