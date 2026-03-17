/**
 * Update a design's fabric description in catalog.json by analyzing a swatch photo.
 * Run this after generate-catalog.ts to fill in the fabric.texture and other
 * AI-derived fields that can't be inferred from the CSV.
 *
 * Usage:
 *   npx tsx src/add-product.ts --sku FON-001 --swatch /path/to/swatch.jpg
 *
 * What it does:
 *   1. Finds the design that owns the given SKU in catalog.json
 *   2. Uploads the swatch photo to fal.ai for analysis
 *   3. Extracts fabric properties via Bedrock Claude (texture, pattern, material, etc.)
 *   4. Updates design.fabric in catalog.json
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { Image } from "@boundaryml/baml";
import { b } from "./baml_client";
import { uploadImage } from "./lib/fal-client";
import { type Catalog, type CatalogDesign } from "./lib/helpers";

const ROOT = path.resolve(__dirname, "..");
const PRODUCTS_DIR = path.resolve(ROOT, "..", "products");
const CATALOG_PATH = path.join(PRODUCTS_DIR, "catalog.json");

function getFlag(args: string[], name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : undefined;
}

function findDesignBySku(catalog: Catalog, sku: string): CatalogDesign | undefined {
  return catalog.designs.find((d) => d.variants.some((v) => v.sku === sku));
}

async function main() {
  const args = process.argv.slice(2);
  const sku = getFlag(args, "sku");
  const swatchInput = getFlag(args, "swatch");

  if (!sku || !swatchInput) {
    console.log("Usage: npx tsx src/add-product.ts --sku <SKU> --swatch <path>");
    console.log("");
    console.log("Options:");
    console.log("  --sku     Variant SKU (required), e.g. FON-001");
    console.log("  --swatch  Path to swatch photo (required)");
    process.exit(1);
  }

  const swatchAbsolute = path.resolve(swatchInput);
  if (!fs.existsSync(swatchAbsolute)) {
    console.error(`Swatch file not found: ${swatchAbsolute}`);
    process.exit(1);
  }

  // Load catalog
  const catalog: Catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf-8"));
  const design = findDesignBySku(catalog, sku);
  if (!design) {
    console.error(`SKU "${sku}" not found in catalog.json`);
    console.error(`Run: npx tsx ../products/scripts/generate-catalog.ts first`);
    process.exit(1);
  }

  console.log(`Found design: ${design.id} (${design.design})`);

  // Upload and analyze
  console.log("Uploading swatch for analysis...");
  const swatchUrl = await uploadImage(swatchAbsolute);

  console.log("Analyzing fabric with Bedrock Claude...");
  const fabric = await b.AnalyzeSwatch(Image.fromUrl(swatchUrl));

  console.log("");
  console.log("Detected fabric properties:");
  console.log(`  Type:         ${fabric.curtain_type}`);
  console.log(`  Color:        ${fabric.color}`);
  console.log(`  Pattern:      ${fabric.pattern ?? "(solid)"}`);
  console.log(`  Material:     ${fabric.material}`);
  console.log(`  Transparency: ${fabric.transparency}`);
  console.log(`  Texture:      ${fabric.texture}`);
  console.log(`  Weight:       ${fabric.weight}`);

  // Update design.fabric (shared across all variants of this design)
  design.fabric = {
    material:     fabric.material,
    transparency: fabric.transparency,
    texture:      fabric.texture,
    weight:       fabric.weight,
    pattern:      fabric.pattern ?? null,
  };

  // Write catalog
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2) + "\n");
  console.log(`\nUpdated design.fabric for ${design.id} in catalog.json`);
  console.log(`Note: this fabric description applies to all ${design.variants.length} variants of ${design.design}`);
  console.log("");
  console.log("Next steps:");
  console.log(`  npx tsx src/generate.ts --sku ${sku}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
