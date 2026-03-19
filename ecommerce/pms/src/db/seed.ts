import { db } from "./client.ts";
import { designs, shopifyProducts, variants } from "./schema.ts";
import { count } from "drizzle-orm";
import { logger } from "../lib/logger.ts";
import { PRODUCTS_DIR } from "../lib/env.ts";
import fs from "fs";
import path from "path";

interface CatalogVariant {
  sku: string;
  colour: string;
  finish: string | null;
  swatch: string;
  shopify: { variant_id: string | null; status: string };
}

interface CatalogFabric {
  material: string;
  transparency: string;
  texture: string | null;
  weight: string;
  pattern: string | null;
}

interface CatalogDesign {
  id: string;
  curtain_type: string;
  design: string;
  width_cm: number;
  price: number;
  composition: string | null;
  fabric: CatalogFabric;
  shopify: {
    product_id: string | null;
    handle: string;
    product_type: string;
    status: string;
    options: string[];
  };
  variants: CatalogVariant[];
}

export async function seed(): Promise<void> {
  const [row] = await db.select({ value: count() }).from(designs);
  const existingCount = Number(row.value);

  if (existingCount > 0) {
    logger.info({ count: existingCount }, "Database already seeded, skipping");
    return;
  }

  const catalogPath = path.join(PRODUCTS_DIR, "catalog.json");
  if (!fs.existsSync(catalogPath)) {
    logger.warn({ catalogPath }, "catalog.json not found — skipping seed");
    return;
  }

  const catalog: { designs: CatalogDesign[] } = JSON.parse(
    fs.readFileSync(catalogPath, "utf-8"),
  );

  logger.info({ designs: catalog.designs.length }, "Seeding database from catalog.json");

  for (const design of catalog.designs) {
    await db.insert(designs).values({
      id:                 design.id,
      curtainType:        design.curtain_type,
      designName:         design.design,
      widthCm:            design.width_cm,
      price:              design.price,
      composition:        design.composition,
      fabricMaterial:     design.fabric.material,
      fabricTransparency: design.fabric.transparency,
      fabricTexture:      design.fabric.texture,
      fabricWeight:       design.fabric.weight,
      fabricPattern:      design.fabric.pattern,
    });

    await db.insert(shopifyProducts).values({
      designId:    design.id,
      productId:   design.shopify.product_id,
      handle:      design.shopify.handle,
      productType: design.shopify.product_type,
      status:      design.shopify.status,
      options:     design.shopify.options,
    });

    for (const v of design.variants) {
      await db.insert(variants).values({
        sku:              v.sku,
        designId:         design.id,
        colour:           v.colour,
        finish:           v.finish,
        swatchPath:       v.swatch,
        shopifyVariantId: v.shopify.variant_id,
        shopifyStatus:    v.shopify.status,
      });
    }
  }

  logger.info("Database seeding completed");
}

// Allow running directly: bun run src/db/seed.ts
if (import.meta.main) {
  await seed();
  process.exit(0);
}
