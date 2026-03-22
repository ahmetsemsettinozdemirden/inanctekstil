import { eq, sql } from "drizzle-orm";
import { db } from "../db/client.ts";
import { designs, shopifyProducts, variants } from "../db/schema.ts";
import { ShopifyClient } from "../lib/shopify-client.ts";
import { logger } from "../lib/logger.ts";
import { DesignNotFoundError } from "../errors/catalog.ts";
import type { JobRow } from "../db/schema.ts";
import type { JobExecutor } from "../lib/job-queue.ts";
import type { ProductVariantInput, ProductVariantBulkInput, ProductSetInput } from "../lib/shopify-client.ts";

// ---------------------------------------------------------------------------
// Mapping constants
// ---------------------------------------------------------------------------

// Human-readable type labels used in product titles
const PRODUCT_TYPE_LABEL_MAP: Record<string, string> = {
  TUL: "Tül Perde",
  FON: "Fon Perde",
  BLK: "Blackout Perde",
  STN: "Saten Perde",
};

const COLLECTION_HANDLE_MAP: Record<string, string> = {
  TUL: "tul-perdeler",
  FON: "fon-perdeler",
  BLK: "blackout-perdeler",
  STN: "saten-perdeler",
};

// ---------------------------------------------------------------------------
// Executor
// ---------------------------------------------------------------------------

export const shopifySyncExecutor: JobExecutor = async (job: JobRow, log) => {
  const params = job.params as { designId: string };
  const { designId } = params;

  await log(`Starting Shopify sync for design: ${designId}`);

  // Load design from DB
  const designRows = await db.select().from(designs).where(eq(designs.id, designId));
  if (designRows.length === 0) throw new DesignNotFoundError(designId);
  const design = designRows[0];

  const shopifyRows = await db.select().from(shopifyProducts).where(eq(shopifyProducts.designId, designId));
  const shopifyRow = shopifyRows[0] ?? null;

  const variantRows = await db.select().from(variants).where(eq(variants.designId, designId));
  if (variantRows.length === 0) throw new Error(`No variants found for design: ${designId}`);

  await log(`Loaded ${variantRows.length} variant(s)`);

  const client = ShopifyClient.fromEnv();
  const productTypeCode  = design.curtainType; // "FON", "BLK", "STN" — used for Shopify productType field & collection filtering
  const productTypeLabel = PRODUCT_TYPE_LABEL_MAP[design.curtainType] ?? design.curtainType; // used in title only
  const title = `${design.designName} ${productTypeLabel}`;
  const priceStr = String(design.price) + ".00";
  const tags = design.tags ? design.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  const optionNames = (shopifyRow?.options as string[] | null) ?? ["Renk"];

  let shopifyProductId = shopifyRow?.productId ?? null;
  let updatedHandle    = shopifyRow?.handle    ?? null;

  // ---- CREATE or UPDATE product ----
  if (!shopifyProductId) {
    await log(`No Shopify product found — creating via productSet...`);

    // Build productOptions: collect unique values per option slot from variants
    const productOptions = optionNames.map((name, i) => ({
      name,
      values: [...new Set(variantRows.map((v) => (i === 0 ? v.colour : v.finish)).filter(Boolean) as string[])].map((val) => ({ name: val })),
    }));

    const setInput: ProductSetInput = {
      title,
      productType: productTypeCode,
      status:         "DRAFT",
      productOptions,
      variants: variantRows.map((v) => ({
        sku:   v.sku,
        price: priceStr,
        optionValues: optionNames.map((optName, i) => ({
          optionName: optName,
          name: i === 0 ? v.colour : (v.finish ?? v.colour),
        })),
      })),
      ...(design.description ? { descriptionHtml: design.description } : {}),
      ...(tags.length > 0    ? { tags }                                : {}),
    };

    const product = await client.productSet(setInput);

    shopifyProductId = product.id;
    updatedHandle    = product.handle;

    await log(`Created product: ${product.id} (handle: ${product.handle})`);
    await log(`Created ${product.variants.length} variant(s)`);

    // Write product GID back to DB
    await db.execute(sql`
      INSERT INTO shopify_products (design_id, product_id, handle, product_type, status, synced_at)
      VALUES (${designId}, ${product.id}, ${product.handle}, ${productType}, 'DRAFT', now())
      ON CONFLICT (design_id) DO UPDATE SET
        product_id   = EXCLUDED.product_id,
        handle       = EXCLUDED.handle,
        product_type = EXCLUDED.product_type,
        status       = EXCLUDED.status,
        synced_at    = now()
    `);

    // Write variant GIDs back
    for (const sv of product.variants) {
      if (sv.sku) {
        await db.update(variants)
          .set({ shopifyVariantId: sv.id, shopifyStatus: "DRAFT" })
          .where(eq(variants.sku, sv.sku));
      }
    }

  } else {
    await log(`Updating existing product: ${shopifyProductId}`);

    const product = await client.updateProduct(shopifyProductId, {
      title,
      productType: productTypeCode,
      ...(design.description ? { descriptionHtml: design.description } : {}),
      ...(tags.length > 0    ? { tags }                                : {}),
    });
    updatedHandle = product.handle;

    await log(`Updated product: ${product.handle}`);

    // Sync variants: split into update (have shopify_variant_id) vs create (new)
    const toUpdate = variantRows.filter((v) => v.shopifyVariantId);
    const toCreate = variantRows.filter((v) => !v.shopifyVariantId);

    if (toUpdate.length > 0) {
      const updateInputs: ProductVariantBulkInput[] = toUpdate.map((v) => ({
        id:           v.shopifyVariantId!,
        price:        priceStr,
        optionValues: optionNames.map((optName, i) => ({
          optionName: optName,
          name:       i === 0 ? v.colour : (v.finish ?? v.colour),
        })),
        inventoryItem: { sku: v.sku, tracked: false },
        inventoryPolicy: "CONTINUE",
      }));
      const updated = await client.variantsBulkUpdate(shopifyProductId, updateInputs);
      await log(`Updated ${updated.length} existing variant(s)`);
    }

    if (toCreate.length > 0) {
      const createInputs: ProductVariantBulkInput[] = toCreate.map((v) => ({
        price:        priceStr,
        optionValues: optionNames.map((optName, i) => ({
          optionName: optName,
          name:       i === 0 ? v.colour : (v.finish ?? v.colour),
        })),
        inventoryItem: { sku: v.sku, tracked: false },
        inventoryPolicy: "CONTINUE",
      }));
      const created = await client.variantsBulkCreate(shopifyProductId, createInputs);
      await log(`Created ${created.length} new variant(s)`);

      for (const sv of created) {
        if (sv.sku) {
          await db.update(variants)
            .set({ shopifyVariantId: sv.id, shopifyStatus: "DRAFT" })
            .where(eq(variants.sku, sv.sku));
        }
      }
    }

    // Update synced_at
    await db.update(shopifyProducts)
      .set({ handle: updatedHandle, productType: productTypeCode, syncedAt: new Date() })
      .where(eq(shopifyProducts.designId, designId));
  }

  // ---- Assign to collection ----
  const collectionHandle = COLLECTION_HANDLE_MAP[design.curtainType];
  if (collectionHandle && shopifyProductId) {
    try {
      const collectionId = await client.getCollectionByHandle(collectionHandle);
      if (collectionId) {
        await client.addProductToCollection(collectionId, shopifyProductId);
        await log(`Added to collection: ${collectionHandle}`);
      } else {
        await log(`Collection not found: ${collectionHandle} — skipping`);
      }
    } catch (err) {
      // Non-fatal: log and continue
      await log(`Warning: collection assignment failed — ${err instanceof Error ? err.message : String(err)}`);
      logger.warn({ err, collectionHandle }, "Collection assignment failed");
    }
  }

  await log(`Shopify sync complete. Product: ${shopifyProductId}`);
  logger.info({ designId, productId: shopifyProductId }, "Shopify sync complete");

  return { productId: shopifyProductId, handle: updatedHandle };
};
