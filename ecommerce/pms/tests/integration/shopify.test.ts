/**
 * Integration tests for /api/shopify — uses real pms_test DB.
 */
import { describe, it, expect, afterAll, beforeEach } from "vitest";
import { Hono } from "hono";
import { AppError } from "../../src/errors/base.ts";
import { createTestDb, clearTables, seedFixtures } from "./setup.ts";
import { eq } from "drizzle-orm";

import { shopifyRouter } from "../../src/routes/shopify.ts";
import { getJob } from "../../src/lib/job-queue.ts";
import { shopifyProducts, generatedImages } from "../../src/db/schema.ts";

const app = new Hono();
app.route("/api/shopify", shopifyRouter);
app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json({ error: err.code, message: err.message }, err.statusCode as Parameters<typeof c.json>[1]);
  }
  return c.json({ error: "INTERNAL_ERROR", message: err.message }, 500);
});

const { db, client } = createTestDb();

afterAll(async () => {
  await client.end();
});

beforeEach(async () => {
  await clearTables(db);
  await seedFixtures(db);
});

// ---------------------------------------------------------------------------
// GET /api/shopify/status
// ---------------------------------------------------------------------------

describe("GET /api/shopify/status", () => {
  it("returns all designs with sync status", async () => {
    const res = await app.request("/api/shopify/status");
    expect(res.status).toBe(200);
    const body = await res.json() as Array<{
      designId: string;
      curtainType: string;
      design: string;
      productId: null;
      status: string;
      syncedAt: null;
    }>;
    expect(body).toHaveLength(1);
    const d = body[0];
    expect(d.designId).toBe("tul-bornova");
    expect(d.curtainType).toBe("TUL");
    expect(d.design).toBe("BORNOVA");
    expect(d.productId).toBeNull();
    expect(d.status).toBe("DRAFT");
    expect(d.syncedAt).toBeNull();
  });

  it("reflects product_id once synced", async () => {
    await db.update(shopifyProducts)
      .set({ productId: "gid://shopify/Product/999", status: "ACTIVE" })
      .where(eq(shopifyProducts.designId, "tul-bornova"));

    const res = await app.request("/api/shopify/status");
    const body = await res.json() as Array<{ productId: string; status: string }>;
    expect(body[0].productId).toBe("gid://shopify/Product/999");
    expect(body[0].status).toBe("ACTIVE");
  });
});

// ---------------------------------------------------------------------------
// POST /api/shopify/sync/:designId
// ---------------------------------------------------------------------------

describe("POST /api/shopify/sync/:designId", () => {
  it("enqueues a shopify-sync job", async () => {
    const res = await app.request("/api/shopify/sync/tul-bornova", { method: "POST" });
    expect(res.status).toBe(201);
    const body = await res.json() as { jobId: string };
    expect(typeof body.jobId).toBe("string");

    const job = await getJob(body.jobId);
    expect(job?.type).toBe("shopify-sync");
    expect((job?.params as { designId: string }).designId).toBe("tul-bornova");
    expect(job?.status).toBe("pending");
  });

  it("returns 404 for unknown design", async () => {
    const res = await app.request("/api/shopify/sync/nonexistent", { method: "POST" });
    expect(res.status).toBe(404);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("DESIGN_NOT_FOUND");
  });
});

// ---------------------------------------------------------------------------
// POST /api/shopify/upload-images/:sku
// ---------------------------------------------------------------------------

describe("POST /api/shopify/upload-images/:sku", () => {
  it("returns 404 for unknown variant", async () => {
    const res = await app.request("/api/shopify/upload-images/FAKE-999", { method: "POST" });
    expect(res.status).toBe(404);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("VARIANT_NOT_FOUND");
  });

  it("returns 422 when no generated images exist", async () => {
    const res = await app.request("/api/shopify/upload-images/TUL-001", { method: "POST" });
    expect(res.status).toBe(422);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("NO_IMAGES");
  });

  it("returns 200 with uploaded:0 when all images already have shopifyMediaId", async () => {
    await db.insert(generatedImages).values({
      sku: "TUL-001", imageType: "texture", roomId: null,
      filePath: "TUL/TUL-001/texture.webp", shopifyMediaId: "gid://shopify/MediaImage/1",
    });

    const res = await app.request("/api/shopify/upload-images/TUL-001", { method: "POST" });
    expect(res.status).toBe(200);
    const body = await res.json() as { uploaded: number };
    expect(body.uploaded).toBe(0);
  });

  it("enqueues upload job when pending images exist", async () => {
    await db.insert(generatedImages).values({
      sku: "TUL-001", imageType: "texture", roomId: null,
      filePath: "TUL/TUL-001/texture.webp", shopifyMediaId: null,
    });

    const res = await app.request("/api/shopify/upload-images/TUL-001", { method: "POST" });
    expect(res.status).toBe(201);
    const body = await res.json() as { jobId: string; pending: number };
    expect(typeof body.jobId).toBe("string");
    expect(body.pending).toBe(1);

    const job = await getJob(body.jobId);
    expect(job?.type).toBe("shopify-image-upload");
    expect((job?.params as { sku: string }).sku).toBe("TUL-001");
  });
});

// ---------------------------------------------------------------------------
// GET /api/shopify/metafields/:productId (no credentials → 503)
// ---------------------------------------------------------------------------

describe("GET /api/shopify/metafields/:productId", () => {
  it("returns 503 when Shopify credentials are not configured", async () => {
    const origDomain = process.env.SHOPIFY_STORE_DOMAIN;
    const origToken  = process.env.SHOPIFY_ACCESS_TOKEN;
    delete process.env.SHOPIFY_STORE_DOMAIN;
    delete process.env.SHOPIFY_ACCESS_TOKEN;

    try {
      const res = await app.request("/api/shopify/metafields/123456789");
      expect(res.status).toBe(503);
      const body = await res.json() as { error: string };
      expect(body.error).toBe("SHOPIFY_NOT_CONFIGURED");
    } finally {
      if (origDomain) process.env.SHOPIFY_STORE_DOMAIN = origDomain;
      if (origToken)  process.env.SHOPIFY_ACCESS_TOKEN  = origToken;
    }
  });
});

// ---------------------------------------------------------------------------
// POST /api/shopify/metafields/:productId
// ---------------------------------------------------------------------------

describe("POST /api/shopify/metafields/:productId", () => {
  it("returns 400 for empty array body", async () => {
    process.env.SHOPIFY_STORE_DOMAIN = "test.myshopify.com";
    process.env.SHOPIFY_ACCESS_TOKEN = "dummy-token";

    try {
      const res = await app.request("/api/shopify/metafields/123456789", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify([]),
      });
      expect(res.status).toBe(400);
      const body = await res.json() as { error: string };
      expect(body.error).toBe("INVALID_INPUT");
    } finally {
      delete process.env.SHOPIFY_STORE_DOMAIN;
      delete process.env.SHOPIFY_ACCESS_TOKEN;
    }
  });

  it("returns 400 for non-array body", async () => {
    process.env.SHOPIFY_STORE_DOMAIN = "test.myshopify.com";
    process.env.SHOPIFY_ACCESS_TOKEN = "dummy-token";

    try {
      const res = await app.request("/api/shopify/metafields/123456789", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ namespace: "custom", key: "foo", value: "bar", type: "single_line_text_field" }),
      });
      expect(res.status).toBe(400);
    } finally {
      delete process.env.SHOPIFY_STORE_DOMAIN;
      delete process.env.SHOPIFY_ACCESS_TOKEN;
    }
  });

  it("returns 503 when Shopify credentials are not configured", async () => {
    const origDomain = process.env.SHOPIFY_STORE_DOMAIN;
    const origToken  = process.env.SHOPIFY_ACCESS_TOKEN;
    delete process.env.SHOPIFY_STORE_DOMAIN;
    delete process.env.SHOPIFY_ACCESS_TOKEN;

    try {
      const res = await app.request("/api/shopify/metafields/123456789", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify([{ namespace: "custom", key: "foo", value: "bar", type: "single_line_text_field" }]),
      });
      expect(res.status).toBe(503);
      const body = await res.json() as { error: string };
      expect(body.error).toBe("SHOPIFY_NOT_CONFIGURED");
    } finally {
      if (origDomain) process.env.SHOPIFY_STORE_DOMAIN = origDomain;
      if (origToken)  process.env.SHOPIFY_ACCESS_TOKEN  = origToken;
    }
  });
});

// ---------------------------------------------------------------------------
// GET /api/shopify/product/:designId
// ---------------------------------------------------------------------------

describe("GET /api/shopify/product/:designId", () => {
  it("returns 404 when design has no productId", async () => {
    // Fixture design has no product_id
    const res = await app.request("/api/shopify/product/tul-bornova");
    expect(res.status).toBe(404);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("NOT_SYNCED");
  });

  it("returns 503 when productId exists but credentials not configured", async () => {
    // Set a product_id so we get past the NOT_SYNCED check
    await db.update(shopifyProducts)
      .set({ productId: "gid://shopify/Product/123456789" })
      .where(eq(shopifyProducts.designId, "tul-bornova"));

    const origDomain = process.env.SHOPIFY_STORE_DOMAIN;
    const origToken  = process.env.SHOPIFY_ACCESS_TOKEN;
    delete process.env.SHOPIFY_STORE_DOMAIN;
    delete process.env.SHOPIFY_ACCESS_TOKEN;

    try {
      const res = await app.request("/api/shopify/product/tul-bornova");
      expect(res.status).toBe(503);
      const body = await res.json() as { error: string };
      expect(body.error).toBe("SHOPIFY_NOT_CONFIGURED");
    } finally {
      if (origDomain) process.env.SHOPIFY_STORE_DOMAIN = origDomain;
      if (origToken)  process.env.SHOPIFY_ACCESS_TOKEN  = origToken;
    }
  });
});

// ---------------------------------------------------------------------------
// POST /api/shopify/refresh-all
// ---------------------------------------------------------------------------

describe("POST /api/shopify/refresh-all", () => {
  it("returns 503 when Shopify credentials are not configured", async () => {
    const origDomain = process.env.SHOPIFY_STORE_DOMAIN;
    const origToken  = process.env.SHOPIFY_ACCESS_TOKEN;
    delete process.env.SHOPIFY_STORE_DOMAIN;
    delete process.env.SHOPIFY_ACCESS_TOKEN;

    try {
      const res = await app.request("/api/shopify/refresh-all", { method: "POST" });
      expect(res.status).toBe(503);
      const body = await res.json() as { error: string };
      expect(body.error).toBe("SHOPIFY_NOT_CONFIGURED");
    } finally {
      if (origDomain) process.env.SHOPIFY_STORE_DOMAIN = origDomain;
      if (origToken)  process.env.SHOPIFY_ACCESS_TOKEN  = origToken;
    }
  });

  it("returns zero counts when no designs are synced", async () => {
    // Fixture data has no product_id — refresh should skip all
    process.env.SHOPIFY_STORE_DOMAIN = "test.myshopify.com";
    process.env.SHOPIFY_ACCESS_TOKEN = "dummy-token";

    try {
      const res = await app.request("/api/shopify/refresh-all", { method: "POST" });
      expect(res.status).toBe(200);
      const body = await res.json() as { total: number; refreshed: number; failed: number };
      expect(body.total).toBe(0);
      expect(body.refreshed).toBe(0);
      expect(body.failed).toBe(0);
    } finally {
      delete process.env.SHOPIFY_STORE_DOMAIN;
      delete process.env.SHOPIFY_ACCESS_TOKEN;
    }
  });
});
