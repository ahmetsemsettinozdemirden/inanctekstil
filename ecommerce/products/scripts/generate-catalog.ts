/**
 * generate-catalog.ts
 *
 * Generates catalog.json from products.csv.
 * Safe to re-run: preserves existing shopify IDs, fabric descriptions,
 * and image_gen overrides. Only structural fields (price, width, colour,
 * finish, composition) are overwritten from CSV.
 *
 * Usage (from products/ directory):
 *   npx tsx scripts/generate-catalog.ts
 *   npx tsx scripts/generate-catalog.ts --dry-run   # print output, don't write file
 */

import fs from "fs";
import path from "path";

const PRODUCTS_DIR = path.resolve(__dirname, "..");
const CSV_PATH = path.join(PRODUCTS_DIR, "products.csv");
const CATALOG_PATH = path.join(PRODUCTS_DIR, "catalog.json");

const DRY_RUN = process.argv.includes("--dry-run");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CsvRow {
  sku: string;
  finish: string | null;    // Name column: KOYU/AÇIK, DESENLİ/DÜZ, MAT/PARLAK, etc.
  design: string;
  colour: string;
  width: number;
  composition: string | null;
  price: number;
  skuPrefix: string;        // FON, TUL, BLK, STN
}

interface FabricDef {
  material: string;
  transparency: string;
  texture: string | null;   // null = needs manual or AI fill via add-product.ts
  weight: string;
  pattern: string | null;
}

interface VariantDef {
  sku: string;
  colour: string;
  finish: string | null;
  swatch: string;
  shopify: {
    variant_id: string | null;
    status: string;
  };
}

interface DesignDef {
  id: string;
  curtain_type: string;     // FON | TUL | BLACKOUT | STN
  design: string;
  width_cm: number;
  price: number;
  composition: string | null;
  fabric: FabricDef;
  shopify: {
    product_id: string | null;
    handle: string;
    product_type: string;   // SKU prefix: FON, TUL, BLK, STN
    status: string;
    options: string[];      // ["Renk"] or ["Renk", "Görünüm"]
  };
  variants: VariantDef[];
}

interface Catalog {
  designs: DesignDef[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// SKU prefix → semantic curtain type (as expected by the image generator's BAML)
const CURTAIN_TYPE_MAP: Record<string, string> = {
  FON: "FON",
  TUL: "TUL",
  BLK: "BLACKOUT",
  STN: "STN",
};

// Sensible fabric defaults per curtain type.
// texture is left null because it varies within a type and needs manual/AI input.
const FABRIC_DEFAULTS: Record<string, Omit<FabricDef, "texture" | "pattern">> = {
  FON:     { material: "polyester", transparency: "opaque",   weight: "heavy"  },
  TUL:     { material: "polyester", transparency: "sheer",    weight: "light"  },
  BLACKOUT:{ material: "polyester", transparency: "blackout", weight: "heavy"  },
  STN:     { material: "polyester", transparency: "opaque",   weight: "medium" },
};

// STN has a well-known texture; others need per-design fill-in.
const FABRIC_TEXTURE_DEFAULTS: Record<string, string | null> = {
  STN:     "smooth satin",
  FON:     null,
  TUL:     null,
  BLACKOUT:null,
};


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toSlug(str: string): string {
  return str
    // Replace Turkish chars BEFORE toLowerCase() to avoid the İ → i+combining-dot issue
    .replace(/Ş/g, "s").replace(/ş/g, "s")
    .replace(/Ö/g, "o").replace(/ö/g, "o")
    .replace(/Ü/g, "u").replace(/ü/g, "u")
    .replace(/Ç/g, "c").replace(/ç/g, "c")
    .replace(/Ğ/g, "g").replace(/ğ/g, "g")
    .replace(/İ/g, "i").replace(/ı/g, "i").replace(/I\u0307?/g, "i")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function designId(skuPrefix: string, design: string): string {
  return `${skuPrefix.toLowerCase()}-${toSlug(design)}`;
}

// Extension varies by type — check actual files on disk if needed, but these are known
const SWATCH_EXT: Record<string, string> = {
  STN: "jpeg",
};

function swatchPath(sku: string, skuPrefix: string): string {
  const ext = SWATCH_EXT[skuPrefix] ?? "JPG";
  return `01-cropped-katalog-images/${skuPrefix}/${sku}.${ext}`;
}

// ---------------------------------------------------------------------------
// CSV parsing
// ---------------------------------------------------------------------------

function parseCsv(csvText: string): CsvRow[] {
  // Strip BOM if present
  const text = csvText.replace(/^\uFEFF/, "");
  const lines = text.trim().split(/\r?\n/);
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(",");
    const sku         = parts[0]?.trim() ?? "";
    const finishRaw   = parts[1]?.trim() ?? "";
    const design      = parts[2]?.trim() ?? "";
    const colour      = parts[3]?.trim() ?? "";
    const widthRaw    = parts[4]?.trim() ?? "";
    const compRaw     = parts[5]?.trim() ?? "";
    const priceRaw    = parts[6]?.trim() ?? "";

    if (!sku || !design || !colour) continue;

    rows.push({
      sku,
      finish:      finishRaw  || null,
      design,
      colour,
      width:       parseInt(widthRaw, 10) || 0,
      composition: compRaw    || null,
      price:       parseInt(priceRaw, 10) || 0,
      skuPrefix:   sku.split("-")[0],
    });
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Grouping
// ---------------------------------------------------------------------------

function groupByDesign(rows: CsvRow[]): Map<string, CsvRow[]> {
  const groups = new Map<string, CsvRow[]>();
  for (const row of rows) {
    const key = designId(row.skuPrefix, row.design);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  return groups;
}

// ---------------------------------------------------------------------------
// Build design entry, merging with existing data
// ---------------------------------------------------------------------------

function buildDesign(id: string, rows: CsvRow[], existing?: DesignDef): DesignDef {
  const first = rows[0];
  const { skuPrefix, design, width, price, composition } = first;
  const curtainType = CURTAIN_TYPE_MAP[skuPrefix] ?? skuPrefix;

  // Detect if any variant has a finish value → needs a second Shopify option axis
  const hasFinish = rows.some((r) => r.finish !== null);
  const options = hasFinish ? ["Renk", "Görünüm"] : ["Renk"];

  // Preserve existing fabric if it was previously filled in (manually or via AI).
  // Otherwise initialise with sensible defaults.
  const defaults = FABRIC_DEFAULTS[curtainType] ?? FABRIC_DEFAULTS.FON;
  const fabric: FabricDef = existing?.fabric ?? {
    material:     defaults.material,
    transparency: defaults.transparency,
    texture:      FABRIC_TEXTURE_DEFAULTS[curtainType] ?? null,
    weight:       defaults.weight,
    pattern:      null,
  };

  // Build variant list, preserving existing shopify variant_id values
  const existingVariantMap = new Map(
    (existing?.variants ?? []).map((v) => [v.sku, v])
  );

  const variants: VariantDef[] = rows.map((row) => {
    const prev = existingVariantMap.get(row.sku);
    return {
      sku:    row.sku,
      colour: row.colour,
      finish: row.finish,
      swatch: swatchPath(row.sku, row.skuPrefix),
      shopify: {
        variant_id: prev?.shopify.variant_id ?? null,
        status:     prev?.shopify.status     ?? "ACTIVE",
      },
    };
  });

  return {
    id,
    curtain_type: curtainType,
    design,
    width_cm:    width,
    price,
    composition,
    fabric,
    shopify: {
      product_id:   existing?.shopify.product_id ?? null,
      handle:       existing?.shopify.handle     ?? id,
      product_type: skuPrefix,
      status:       existing?.shopify.status     ?? "ACTIVE",
      options,
    },
    variants,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  // --- Read CSV ---
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`CSV not found: ${CSV_PATH}`);
    process.exit(1);
  }
  const csvText = fs.readFileSync(CSV_PATH, "utf-8");
  const rows = parseCsv(csvText);
  console.log(`Parsed ${rows.length} SKUs from products.csv`);

  // --- Load existing catalog for merge ---
  let existing: Catalog | null = null;
  if (fs.existsSync(CATALOG_PATH)) {
    existing = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf-8")) as Catalog;
    console.log(`Found existing catalog.json with ${existing.designs.length} designs — merging`);
  }

  const existingDesignMap = new Map(
    (existing?.designs ?? []).map((d) => [d.id, d])
  );

  // --- Group CSV rows by design and build ---
  const groups = groupByDesign(rows);
  const designs: DesignDef[] = [];

  for (const [id, designRows] of groups) {
    designs.push(buildDesign(id, designRows, existingDesignMap.get(id)));
  }

  const catalog: Catalog = { designs };

  // --- Stats ---
  const totalVariants = designs.reduce((n, d) => n + d.variants.length, 0);
  const missingFabric = designs.filter((d) => d.fabric.texture === null);
  const missingSwatches = designs
    .flatMap((d) => d.variants)
    .filter((v) => !fs.existsSync(path.join(PRODUCTS_DIR, v.swatch)));

  const byType = designs.reduce<Record<string, number>>((acc, d) => {
    acc[d.curtain_type] = (acc[d.curtain_type] ?? 0) + 1;
    return acc;
  }, {});

  const output = JSON.stringify(catalog, null, 2) + "\n";

  if (DRY_RUN) {
    console.log("\n--- DRY RUN — catalog.json not written ---\n");
    console.log(output);
  } else {
    fs.writeFileSync(CATALOG_PATH, output);
    console.log(`\nWrote catalog.json`);
  }

  console.log(`\nSummary:`);
  console.log(`  ${designs.length} designs  (${Object.entries(byType).map(([t, n]) => `${n} ${t}`).join(", ")})`);
  console.log(`  ${totalVariants} total variants (SKUs)`);

  if (missingFabric.length > 0) {
    console.log(`\n  ${missingFabric.length} designs need fabric.texture filled in:`);
    missingFabric.forEach((d) => console.log(`    - ${d.id}`));
    console.log(`  Run: npx tsx ../pdp-image-generator/src/add-product.ts (per SKU)`);
    console.log(`  Or edit catalog.json fabric blocks manually.`);
  }

  if (missingSwatches.length > 0) {
    console.log(`\n  ${missingSwatches.length} variants have no swatch image yet:`);
    missingSwatches.slice(0, 10).forEach((v) => console.log(`    - ${v.sku} (${v.swatch})`));
    if (missingSwatches.length > 10) {
      console.log(`    ... and ${missingSwatches.length - 10} more`);
    }
  }

  console.log("");
}

main();
