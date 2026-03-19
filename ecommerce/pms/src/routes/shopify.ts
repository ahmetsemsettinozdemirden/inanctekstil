import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client.ts";
import { designs, shopifyProducts, variants, generatedImages } from "../db/schema.ts";
import { enqueueJob } from "../lib/job-queue.ts";
import { ShopifyClient } from "../lib/shopify-client.ts";
import { DesignNotFoundError } from "../errors/catalog.ts";
import { ShopifyNotConfiguredError } from "../errors/shopify.ts";

export const shopifyRouter = new Hono();

// GET /api/shopify/status — all designs with their Shopify sync status (DB only, no live call)
shopifyRouter.get("/status", async (c) => {
  const rows = await db
    .select({ design: designs, shopify: shopifyProducts })
    .from(designs)
    .leftJoin(shopifyProducts, eq(designs.id, shopifyProducts.designId))
    .orderBy(designs.curtainType, designs.designName);

  return c.json(rows.map(({ design, shopify }) => ({
    designId:    design.id,
    curtainType: design.curtainType,
    design:      design.designName,
    productId:   shopify?.productId   ?? null,
    handle:      shopify?.handle      ?? null,
    status:      shopify?.status      ?? "MISSING",
    syncedAt:    shopify?.syncedAt    ?? null,
  })));
});

// POST /api/shopify/sync/:designId — enqueue a shopify-sync job
shopifyRouter.post("/sync/:designId", async (c) => {
  const designId = c.req.param("designId");

  // Verify design exists
  const rows = await db.select().from(designs).where(eq(designs.id, designId));
  if (rows.length === 0) throw new DesignNotFoundError(designId);

  const jobId = await enqueueJob("shopify-sync", { designId });
  return c.json({ jobId }, 201);
});

// GET /api/shopify/metafields/:productId — live fetch from Shopify
shopifyRouter.get("/metafields/:productId", async (c) => {
  const rawId    = c.req.param("productId");
  const namespace = c.req.query("namespace") ?? "custom";

  // Accept both numeric IDs and full GIDs
  const gid = rawId.startsWith("gid://") ? rawId : `gid://shopify/Product/${rawId}`;

  let client: ShopifyClient;
  try {
    client = ShopifyClient.fromEnv();
  } catch {
    throw new ShopifyNotConfiguredError();
  }

  const metafields = await client.getMetafields(gid, namespace);
  return c.json(metafields);
});

// POST /api/shopify/metafields/:productId — upsert metafields
// Body: [{ namespace, key, value, type }]
shopifyRouter.post("/metafields/:productId", async (c) => {
  const rawId = c.req.param("productId");
  const gid   = rawId.startsWith("gid://") ? rawId : `gid://shopify/Product/${rawId}`;

  const body = await c.req.json<Array<{ namespace: string; key: string; value: string; type: string }>>();
  if (!Array.isArray(body) || body.length === 0) {
    return c.json({ error: "INVALID_INPUT", message: "Body must be a non-empty array of metafield objects" }, 400);
  }

  let client: ShopifyClient;
  try {
    client = ShopifyClient.fromEnv();
  } catch {
    throw new ShopifyNotConfiguredError();
  }

  const metafields = await client.setMetafields(
    body.map((m) => ({ ...m, ownerId: gid })),
  );
  return c.json(metafields);
});

// POST /api/shopify/upload-images/:sku — enqueue image upload job for a SKU
shopifyRouter.post("/upload-images/:sku", async (c) => {
  const sku = c.req.param("sku");

  // Verify variant exists and has generated images
  const variantRows = await db.select().from(variants).where(eq(variants.sku, sku));
  if (variantRows.length === 0) {
    return c.json({ error: "VARIANT_NOT_FOUND", message: `Variant not found: ${sku}` }, 404);
  }

  const imageRows = await db.select().from(generatedImages).where(eq(generatedImages.sku, sku));
  if (imageRows.length === 0) {
    return c.json({ error: "NO_IMAGES", message: "No generated images found for this SKU. Generate images first." }, 422);
  }

  const pending = imageRows.filter((r) => !r.shopifyMediaId);
  if (pending.length === 0) {
    return c.json({ message: "All images already uploaded", uploaded: 0 }, 200);
  }

  const jobId = await enqueueJob("shopify-image-upload", { sku });
  return c.json({ jobId, pending: pending.length }, 201);
});

// POST /api/shopify/refresh-all — live sync status for all synced designs from Shopify
shopifyRouter.post("/refresh-all", async (c) => {
  let client: ShopifyClient;
  try {
    client = ShopifyClient.fromEnv();
  } catch {
    throw new ShopifyNotConfiguredError();
  }

  const rows = await db
    .select({ design: designs, shopify: shopifyProducts })
    .from(designs)
    .leftJoin(shopifyProducts, eq(designs.id, shopifyProducts.designId));

  const synced = rows.filter((r) => r.shopify?.productId);
  let refreshed = 0;
  let failed = 0;

  for (const { design, shopify } of synced) {
    try {
      const product = await client.getProduct(shopify!.productId!);
      if (!product) { failed++; continue; }

      await db.update(shopifyProducts)
        .set({ status: product.status, syncedAt: new Date() })
        .where(eq(shopifyProducts.designId, design.id));

      for (const sv of product.variants) {
        if (sv.sku) {
          await db.update(variants)
            .set({ shopifyVariantId: sv.id })
            .where(eq(variants.sku, sv.sku));
        }
      }
      refreshed++;
    } catch {
      failed++;
    }
  }

  return c.json({ total: synced.length, refreshed, failed });
});

// GET /api/shopify/product/:designId — live product status from Shopify
shopifyRouter.get("/product/:designId", async (c) => {
  const designId = c.req.param("designId");

  const shopifyRows = await db.select().from(shopifyProducts).where(eq(shopifyProducts.designId, designId));
  const productId = shopifyRows[0]?.productId;
  if (!productId) {
    return c.json({ error: "NOT_SYNCED", message: "No Shopify product ID for this design" }, 404);
  }

  let client: ShopifyClient;
  try {
    client = ShopifyClient.fromEnv();
  } catch {
    throw new ShopifyNotConfiguredError();
  }

  const product = await client.getProduct(productId);
  if (!product) {
    return c.json({ error: "PRODUCT_NOT_FOUND", message: "Product not found in Shopify" }, 404);
  }

  // Update local status from live data
  await db.update(shopifyProducts)
    .set({ status: product.status, syncedAt: new Date() })
    .where(eq(shopifyProducts.designId, designId));

  // Sync variant IDs
  for (const sv of product.variants) {
    if (sv.sku) {
      await db.update(variants)
        .set({ shopifyVariantId: sv.id })
        .where(eq(variants.sku, sv.sku));
    }
  }

  return c.json(product);
});
