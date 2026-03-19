import { Hono } from "hono";
import { cors } from "hono/cors";
import { runMigrations } from "./db/migrate.ts";
import { seed } from "./db/seed.ts";
import { serveStatic } from "hono/bun";
import { catalogRouter } from "./routes/catalog.ts";
import { assetsRouter } from "./routes/assets.ts";
import { jobsRouter } from "./routes/jobs.ts";
import { imagesRouter } from "./routes/images.ts";
import { shopifyRouter } from "./routes/shopify.ts";
import { startWorker, registerExecutor } from "./lib/job-queue.ts";
import { generateLifestyleExecutor } from "./jobs/generate-lifestyle.ts";
import { generateTextureExecutor } from "./jobs/generate-texture.ts";
import { shopifySyncExecutor } from "./jobs/shopify-sync.ts";
import { shopifyImageUploadExecutor } from "./jobs/shopify-image-upload.ts";
import { analyzeSwatchExecutor } from "./jobs/analyze-swatch.ts";
import { bulkGenerateExecutor } from "./jobs/bulk-generate.ts";
import { logger } from "./lib/logger.ts";
import { PORT, NODE_ENV } from "./lib/env.ts";
import { AppError } from "./errors/base.ts";

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

const app = new Hono();

// Middleware
app.use("*", cors({ origin: "*" }));

app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  logger.info(
    { method: c.req.method, path: c.req.path, status: c.res.status, ms },
    "request",
  );
});

// Health check
app.get("/health", (c) =>
  c.json({ status: "ok", uptime: Math.floor(process.uptime()), env: NODE_ENV }),
);

// API routes
app.route("/api/catalog", catalogRouter);
app.route("/api/jobs", jobsRouter);
app.route("/api/images", imagesRouter);
app.route("/api/shopify", shopifyRouter);

// Static product assets (swatches, generated images)
app.route("/assets", assetsRouter);

// Serve built frontend — only active when frontend/dist/ exists (production / after build)
app.use("*", serveStatic({ root: "./frontend/dist" }));
app.get("*", async (c) => {
  const indexFile = Bun.file("./frontend/dist/index.html");
  if (await indexFile.exists()) return c.html(await indexFile.text());
  return c.json({ error: "NOT_FOUND", message: "Route not found" }, 404);
});

// Global error handler
app.onError((err, c) => {
  if (err instanceof AppError) {
    logger.warn({ code: err.code, meta: err.meta }, err.message);
    return c.json(
      { error: err.code, message: err.message, ...(err.meta && { meta: err.meta }) },
      err.statusCode as Parameters<typeof c.json>[1],
    );
  }
  logger.error({ err }, "Unhandled error");
  return c.json({ error: "INTERNAL_ERROR", message: "Internal server error" }, 500);
});

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------

logger.info("Starting PMS server...");

try {
  await runMigrations();
  await seed();
} catch (err) {
  logger.error({ err }, "Startup failed");
  process.exit(1);
}

// Register job executors and start background worker
registerExecutor("lifestyle", generateLifestyleExecutor);
registerExecutor("texture", generateTextureExecutor);
registerExecutor("shopify-sync", shopifySyncExecutor);
registerExecutor("shopify-image-upload", shopifyImageUploadExecutor);
registerExecutor("analyze-swatch", analyzeSwatchExecutor);
registerExecutor("bulk-generate", bulkGenerateExecutor);
startWorker();

const server = Bun.serve({ port: PORT, fetch: app.fetch });
logger.info({ port: server.port, env: NODE_ENV }, "PMS server ready");
