import { Hono } from "hono";
import { db } from "../db/client.ts";
import { variants, designs, generatedImages } from "../db/schema.ts";
import { eq } from "drizzle-orm";
import { enqueueJob } from "../lib/job-queue.ts";
import { JobEnqueueError } from "../errors/jobs.ts";
import { DesignNotFoundError } from "../errors/catalog.ts";

export const imagesRouter = new Hono();

// POST /api/images/generate — enqueue image generation job
// Body: { sku: string; flow: "lifestyle" | "texture"; roomId?: string }
imagesRouter.post("/generate", async (c) => {
  const body = await c.req.json<{ sku?: string; flow?: string; roomId?: string }>();

  if (!body.sku) throw new JobEnqueueError("sku is required");
  if (!body.flow || !["lifestyle", "texture"].includes(body.flow)) {
    throw new JobEnqueueError("flow must be 'lifestyle' or 'texture'");
  }
  if (body.flow === "lifestyle" && !body.roomId) {
    throw new JobEnqueueError("roomId is required for lifestyle flow");
  }

  // Verify variant exists
  const variantRows = await db.select().from(variants).where(eq(variants.sku, body.sku));
  if (variantRows.length === 0) {
    throw new JobEnqueueError(`Variant not found: ${body.sku}`);
  }

  const jobId = await enqueueJob(
    body.flow as "lifestyle" | "texture",
    { sku: body.sku, ...(body.roomId ? { roomId: body.roomId } : {}) },
  );

  return c.json({ jobId }, 201);
});

// GET /api/images/:sku — get generated images for a variant
imagesRouter.get("/:sku", async (c) => {
  const sku = c.req.param("sku");
  const rows = await db
    .select()
    .from(generatedImages)
    .where(eq(generatedImages.sku, sku))
    .orderBy(generatedImages.createdAt);

  const lifestyle = rows.filter((r) => r.imageType === "lifestyle");
  const texture   = rows.find((r) => r.imageType === "texture") ?? null;

  return c.json({ lifestyle, texture });
});

// POST /api/images/generate-bulk — enqueue bulk generation for all missing images of a design
// Body: { designId: string }
imagesRouter.post("/generate-bulk", async (c) => {
  const body = await c.req.json<{ designId?: string }>();
  if (!body.designId) throw new JobEnqueueError("designId is required");

  const rows = await db.select().from(designs).where(eq(designs.id, body.designId));
  if (rows.length === 0) throw new DesignNotFoundError(body.designId);

  const jobId = await enqueueJob("bulk-generate", { designId: body.designId });
  return c.json({ jobId }, 201);
});

// POST /api/images/analyze — enqueue swatch analysis for a variant
// Body: { sku: string }
imagesRouter.post("/analyze", async (c) => {
  const body = await c.req.json<{ sku?: string }>();
  if (!body.sku) throw new JobEnqueueError("sku is required");

  const variantRows = await db.select().from(variants).where(eq(variants.sku, body.sku));
  if (variantRows.length === 0) throw new JobEnqueueError(`Variant not found: ${body.sku}`);
  if (!variantRows[0].swatchPath) throw new JobEnqueueError(`No swatch for variant: ${body.sku}`);

  const jobId = await enqueueJob("analyze-swatch", { sku: body.sku });
  return c.json({ jobId }, 201);
});

// GET /api/images/rooms — list available rooms from manifest
imagesRouter.get("/rooms/list", async (c) => {
  const { default: fs } = await import("fs");
  const { default: path } = await import("path");
  const { fileURLToPath } = await import("url");
  const __filename = fileURLToPath(import.meta.url);
  // pms/src/routes/ → up 2 = pms/
  const PMS_ROOT = path.resolve(path.dirname(__filename), "../..");
  const manifestPath = path.join(PMS_ROOT, "assets", "input", "manifest.json");

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
      rooms: Record<string, { room_type: string; wall_color: string }>;
    };
    const rooms = Object.entries(manifest.rooms).map(([id, def]) => ({
      id,
      room_type:  def.room_type,
      wall_color: def.wall_color,
    }));
    return c.json(rooms);
  } catch {
    return c.json([]);
  }
});
