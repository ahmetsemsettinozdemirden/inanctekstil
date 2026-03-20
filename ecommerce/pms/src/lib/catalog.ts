import { eq, asc } from "drizzle-orm";
import { db } from "../db/client.ts";
import { designs, shopifyProducts, variants } from "../db/schema.ts";
import type { DesignRow, ShopifyProductRow, VariantRow } from "../db/schema.ts";
import { DesignNotFoundError, InvalidUpdateError } from "../errors/catalog.ts";

// ---------------------------------------------------------------------------
// Response types (mirrors CatalogDesign from pdp-image-generator for compat)
// ---------------------------------------------------------------------------

export interface DesignFabric {
  material:     string | null;
  transparency: string | null;
  texture:      string | null;
  weight:       string | null;
  pattern:      string | null;
}

export interface DesignVariant {
  sku:     string;
  colour:  string;
  finish:  string | null;
  swatch:  string | null;
  shopify: { variant_id: string | null; status: string };
}

export interface DesignWithShopify {
  id:          string;
  curtain_type: string;
  design:      string;
  width_cm:    number;
  price:       number;
  composition: string | null;
  description: string | null;
  tags:        string | null;
  fabric:      DesignFabric;
  shopify: {
    product_id:   string | null;
    handle:       string | null;
    product_type: string | null;
    status:       string;
    options:      string[];
    synced_at:    string | null;
  };
  variants: DesignVariant[];
}

export interface UpdateDesignInput {
  price?:       number;
  composition?: string | null;
  description?: string | null;
  tags?:        string | null;
  fabric?:      Partial<DesignFabric>;
}

// ---------------------------------------------------------------------------
// Pure mapper — exported for unit testing
// ---------------------------------------------------------------------------

export function mapRowToDesign(
  design:      DesignRow,
  shopify:     ShopifyProductRow | null,
  variantRows: VariantRow[],
): DesignWithShopify {
  return {
    id:           design.id,
    curtain_type: design.curtainType,
    design:       design.designName,
    width_cm:     design.widthCm,
    price:        design.price,
    composition:  design.composition,
    description:  design.description ?? null,
    tags:         design.tags ?? null,
    fabric: {
      material:     design.fabricMaterial,
      transparency: design.fabricTransparency,
      texture:      design.fabricTexture,
      weight:       design.fabricWeight,
      pattern:      design.fabricPattern,
    },
    shopify: {
      product_id:   shopify?.productId   ?? null,
      handle:       shopify?.handle      ?? null,
      product_type: shopify?.productType ?? null,
      status:       shopify?.status      ?? "DRAFT",
      options:      (shopify?.options as string[]) ?? ["Renk"],
      synced_at:    shopify?.syncedAt?.toISOString() ?? null,
    },
    variants: variantRows.map((v) => ({
      sku:    v.sku,
      colour: v.colour,
      finish: v.finish,
      swatch: v.swatchPath,
      shopify: {
        variant_id: v.shopifyVariantId,
        status:     v.shopifyStatus,
      },
    })),
  };
}

// ---------------------------------------------------------------------------
// DB queries
// ---------------------------------------------------------------------------

async function queryDesigns(designId?: string): Promise<DesignWithShopify[]> {
  let query = db
    .select({ design: designs, shopify: shopifyProducts, variant: variants })
    .from(designs)
    .leftJoin(shopifyProducts, eq(designs.id, shopifyProducts.designId))
    .leftJoin(variants, eq(designs.id, variants.designId))
    .$dynamic();

  if (designId) {
    query = query.where(eq(designs.id, designId));
  } else {
    query = query.orderBy(asc(designs.curtainType), asc(designs.designName));
  }

  const rows = await query;

  const grouped = new Map<string, {
    design:      DesignRow;
    shopify:     ShopifyProductRow | null;
    variantRows: VariantRow[];
  }>();

  for (const row of rows) {
    const id = row.design.id;
    if (!grouped.has(id)) {
      grouped.set(id, { design: row.design, shopify: row.shopify, variantRows: [] });
    }
    if (row.variant !== null) {
      grouped.get(id)!.variantRows.push(row.variant);
    }
  }

  return Array.from(grouped.values()).map(({ design, shopify, variantRows }) =>
    mapRowToDesign(design, shopify, variantRows),
  );
}

export async function getDesigns(): Promise<DesignWithShopify[]> {
  return queryDesigns();
}

export async function getDesign(id: string): Promise<DesignWithShopify> {
  const results = await queryDesigns(id);
  if (results.length === 0) throw new DesignNotFoundError(id);
  return results[0];
}

export async function updateDesign(
  id: string,
  updates: UpdateDesignInput,
): Promise<DesignWithShopify> {
  // Validate
  const ALLOWED_KEYS = ["price", "composition", "description", "tags", "fabric"] as const;
  const unknownKeys = Object.keys(updates).filter(
    (k) => !(ALLOWED_KEYS as readonly string[]).includes(k),
  );
  if (unknownKeys.length > 0) {
    throw new InvalidUpdateError(`Unknown fields: ${unknownKeys.join(", ")}`, unknownKeys);
  }
  if (updates.price !== undefined && (typeof updates.price !== "number" || updates.price <= 0)) {
    throw new InvalidUpdateError("Price must be a positive number");
  }

  // Ensure design exists
  await getDesign(id);

  const patch: Partial<typeof designs.$inferInsert> = { updatedAt: new Date() };
  if (updates.price       !== undefined) patch.price       = updates.price;
  if (updates.composition !== undefined) patch.composition = updates.composition;
  if (updates.description !== undefined) patch.description = updates.description;
  if (updates.tags        !== undefined) patch.tags        = updates.tags;
  if (updates.fabric) {
    const f = updates.fabric;
    if (f.material     !== undefined) patch.fabricMaterial     = f.material;
    if (f.transparency !== undefined) patch.fabricTransparency = f.transparency;
    if (f.texture      !== undefined) patch.fabricTexture      = f.texture;
    if (f.weight       !== undefined) patch.fabricWeight       = f.weight;
    if (f.pattern      !== undefined) patch.fabricPattern      = f.pattern;
  }

  await db.update(designs).set(patch).where(eq(designs.id, id));
  return getDesign(id);
}
