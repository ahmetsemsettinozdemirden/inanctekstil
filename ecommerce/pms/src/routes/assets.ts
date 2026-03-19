import { Hono } from "hono";
import path from "path";
import { PRODUCTS_DIR } from "../lib/env.ts";
import { logger } from "../lib/logger.ts";

export const assetsRouter = new Hono();

function mimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  if (ext === "png")  return "image/png";
  return "application/octet-stream";
}

// Swatch images — /assets/swatches/TUL/TUL-001.JPG
assetsRouter.get("/swatches/:type/:file", async (c) => {
  const { type, file } = c.req.param();
  const absPath = path.join(PRODUCTS_DIR, "01-cropped-katalog-images", type, file);
  const f = Bun.file(absPath);
  if (!(await f.exists())) {
    logger.debug({ absPath }, "Swatch not found");
    return c.notFound();
  }
  return new Response(f, {
    headers: {
      "Content-Type": mimeType(file),
      "Cache-Control": "public, max-age=86400",
    },
  });
});

// Generated images — /assets/generated/TUL/TUL-001/TUL-001-room-01-terracotta-wall.webp
assetsRouter.get("/generated/:type/:sku/:file", async (c) => {
  const { type, sku, file } = c.req.param();
  const absPath = path.join(PRODUCTS_DIR, "02-final-katalog-images", type, sku, file);
  const f = Bun.file(absPath);
  if (!(await f.exists())) {
    logger.debug({ absPath }, "Generated image not found");
    return c.notFound();
  }
  return new Response(f, {
    headers: {
      "Content-Type": mimeType(file),
      "Cache-Control": "public, max-age=3600",
    },
  });
});
