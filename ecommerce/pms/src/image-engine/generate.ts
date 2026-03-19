/**
 * Quality-focused image generation pipeline.
 *
 * Folder structure:
 *   assets/
 *     input/
 *       manifest.json                   — product + room + banner + collection definitions
 *       swatches/{TYPE}/               — fabric swatch photos (e.g. swatches/TUL/tul-001.jpg)
 *       rooms/                          — room template photos
 *     output/
 *       {TYPE}/{sku}/
 *         {sku}-{room}.webp             — final lifestyle images
 *         {sku}-texture.webp            — final texture image
 *         intermediate/                 — crafted prompts, raw images, evals, log
 *       hero-banners/
 *         {banner-id}.webp              — final composited banner
 *         intermediate/                 — base image, crafted prompt, log
 *       collections/
 *         {collection-id}.png           — final composited card
 *         intermediate/                 — base image, crafted prompt, log
 *     fonts/                            — Inter TTF fonts for text rendering
 *
 * Usage:
 *   npx tsx src/generate.ts --sku BLK-001
 *   npx tsx src/generate.ts --sku BLK-001 --room room-01-terracotta-wall
 *   npx tsx src/generate.ts --sku BLK-001 --flow texture
 *   npx tsx src/generate.ts --banner spring-sale
 *   npx tsx src/generate.ts --collection bahar
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Image } from "@boundaryml/baml";
import { b } from "./baml_client";
import { CurtainType } from "./baml_client/types";
import { uploadImage, generate, downloadImage, type AspectRatio, type Resolution } from "./lib/fal-client";
import { renderHeroBanner, renderCollectionCard } from "./lib/renderer";
import {
  toFabricDescription, toRoomDescription, saveJson,
  loadManifest as loadManifestFile, loadCatalog, findBySku,
  type CatalogDesign, type CatalogVariant, type ManifestRoom, type Catalog,
} from "./lib/helpers";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), "../..");
const ASSETS_DIR = path.join(ROOT, "assets");
const INPUT_DIR = path.join(ASSETS_DIR, "input");
const OUTPUT_DIR = path.join(ASSETS_DIR, "output");
const MANIFEST_PATH = path.join(INPUT_DIR, "manifest.json");
const PRODUCTS_DIR = process.env.PRODUCTS_DIR ?? path.resolve(ROOT, "..", "products");
const CATALOG_PATH = path.join(PRODUCTS_DIR, "catalog.json");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ManifestBanner {
  sku: string;
  room: string;
  headline: string;
  sub_headline: string;
  discount: string;
  cta: string;
  disclaimer?: string;
  logo?: string;
  bg_color?: string;
  text_color?: string;
  accent_color?: string;
}

interface ManifestCollection {
  name: string;
  mood: string;
  skus: string[];
  room?: string;
}

interface Manifest {
  rooms: Record<string, ManifestRoom>;
  banners?: Record<string, ManifestBanner>;
  collections?: Record<string, ManifestCollection>;
}

// ---------------------------------------------------------------------------
// Logger — writes to both console and file, with levels, timing, and summary
// ---------------------------------------------------------------------------

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

interface StepTiming {
  name: string;
  startedAt: number;
  endedAt?: number;
  durationMs?: number;
}

interface RunSummary {
  flow: string;
  startedAt: string;
  endedAt: string;
  totalDurationMs: number;
  steps: { name: string; durationMs: number }[];
  result: "pass" | "fail" | "max_retries" | "error";
  details?: Record<string, unknown>;
}

class Logger {
  private lines: string[] = [];
  private logPath: string;
  private summaryPath: string;
  private minLevel: LogLevel;
  private runStart: number;
  private steps: StepTiming[] = [];
  private currentStep: StepTiming | null = null;
  private flowName: string = "";
  private summaryDetails: Record<string, unknown> = {};
  private result: RunSummary["result"] = "pass";

  constructor(outputDir: string, minLevel: LogLevel = "info") {
    const intDir = path.join(outputDir, "intermediate");
    fs.mkdirSync(intDir, { recursive: true });
    this.logPath = path.join(intDir, "log.txt");
    this.summaryPath = path.join(intDir, "summary.json");
    this.minLevel = minLevel;
    this.runStart = Date.now();
  }

  setFlow(name: string) {
    this.flowName = name;
  }

  setResult(result: RunSummary["result"]) {
    this.result = result;
  }

  addDetail(key: string, value: unknown) {
    this.summaryDetails[key] = value;
  }

  startStep(name: string) {
    this.endStep();
    this.currentStep = { name, startedAt: Date.now() };
    this.info(`--- ${name} ---`);
  }

  endStep() {
    if (this.currentStep) {
      this.currentStep.endedAt = Date.now();
      this.currentStep.durationMs = this.currentStep.endedAt - this.currentStep.startedAt;
      this.steps.push(this.currentStep);
      this.debug(`  [${this.currentStep.name}] completed in ${this.currentStep.durationMs}ms`);
      this.currentStep = null;
    }
  }

  private write(level: LogLevel, msg: string) {
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this.minLevel]) return;
    const ts = new Date().toISOString();
    const tag = level.toUpperCase().padEnd(5);
    const line = `[${ts}] ${tag} ${msg}`;
    if (level === "error") {
      console.error(msg);
    } else if (level === "warn") {
      console.warn(msg);
    } else {
      console.log(msg);
    }
    this.lines.push(line);
  }

  debug(msg: string) { this.write("debug", msg); }
  info(msg: string) { this.write("info", msg); }
  warn(msg: string) { this.write("warn", msg); }
  error(msg: string) { this.write("error", msg); }

  /** Backwards-compatible alias */
  log(msg: string) { this.info(msg); }

  flush() {
    this.endStep();
    const totalMs = Date.now() - this.runStart;
    this.info(`Total duration: ${(totalMs / 1000).toFixed(1)}s`);
    fs.writeFileSync(this.logPath, this.lines.join("\n") + "\n");

    const summary: RunSummary = {
      flow: this.flowName,
      startedAt: new Date(this.runStart).toISOString(),
      endedAt: new Date().toISOString(),
      totalDurationMs: totalMs,
      steps: this.steps.map((s) => ({ name: s.name, durationMs: s.durationMs ?? 0 })),
      result: this.result,
      ...(Object.keys(this.summaryDetails).length > 0 && { details: this.summaryDetails }),
    };
    fs.writeFileSync(this.summaryPath, JSON.stringify(summary, null, 2));
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadManifest(): Manifest {
  return loadManifestFile(MANIFEST_PATH);
}

function loadProductCatalog(): Catalog {
  return loadCatalog(CATALOG_PATH);
}

/** Derive output dir for a product: output/{TYPE}/{SKU}/ e.g. output/TUL/TUL-001/ */
function productOutDir(sku: string): string {
  const typePrefix = sku.split("-")[0];
  return path.join(OUTPUT_DIR, typePrefix, sku);
}

// ---------------------------------------------------------------------------
// Lifestyle flow
// ---------------------------------------------------------------------------

const MAX_RETRIES = 3;

export async function runLifestyle(
  design: CatalogDesign,
  variant: CatalogVariant,
  roomId: string,
  roomDef: ManifestRoom,
  outputDir?: string,
) {
  const sku = variant.sku;
  const outDir = outputDir ?? productOutDir(sku);
  const intDir = path.join(outDir, "intermediate");
  fs.mkdirSync(intDir, { recursive: true });

  const logger = new Logger(outDir);
  logger.setFlow(`lifestyle:${sku}:${roomId}`);
  logger.log(`=== PDP Lifestyle: ${sku} × ${roomId} ===`);

  const fabric = toFabricDescription(design, variant);
  const room = toRoomDescription(roomDef);
  logger.log(`Fabric: ${fabric.color} ${fabric.curtain_type} (${fabric.material})`);
  logger.log(`Room: ${room.room_type} — ${room.wall_color} walls`);

  // Step 1: Upload
  logger.startStep("Upload images");
  const swatchPath = path.join(PRODUCTS_DIR, variant.swatch);
  const roomPath = path.join(INPUT_DIR, roomDef.image);
  const [swatchUrl, roomUrl] = await Promise.all([
    uploadImage(swatchPath),
    uploadImage(roomPath),
  ]);
  logger.log(`  Swatch: ${swatchUrl}`);
  logger.log(`  Room: ${roomUrl}`);

  // Step 2: Craft prompt
  logger.startStep("Craft prompt");
  const crafted = await b.CraftLifestylePrompt(
    fabric,
    room,
    Image.fromUrl(swatchUrl),
    Image.fromUrl(roomUrl)
  );
  logger.log(`  Prompt: ${crafted.prompt}`);
  logger.log(`  Reasoning: ${crafted.reasoning}`);
  logger.log(`  Negative cues: ${crafted.negative_cues.join(", ")}`);

  saveJson(path.join(intDir, `crafted-prompt-${roomId}.json`), crafted);

  // Step 3+4: Generate + Evaluate loop
  let currentPrompt = crafted.prompt;
  const allResults: { url: string; localPath: string; score: any; attempt: number }[] = [];

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    logger.startStep(`Generate + Evaluate (attempt ${attempt}/${MAX_RETRIES})`);

    const aspectRatio: AspectRatio =
      fabric.curtain_type === CurtainType.TUL ? "1:1" : "3:4";

    const result = await generate({
      prompt: currentPrompt,
      imageUrls: [roomUrl, swatchUrl],
      numImages: 2,
      aspectRatio,
      resolution: "2K" as Resolution,
      outputFormat: "webp",
      usePro: true,
      thinkingLevel: attempt > 1 ? "high" : undefined,
    });

    logger.log(`  Generated ${result.images.length} images`);

    // Save raw outputs + evaluate
    logger.log("Evaluating...");
    for (let i = 0; i < result.images.length; i++) {
      const img = result.images[i];

      // Save raw
      const rawPath = path.join(intDir, `${roomId}-attempt-${attempt}-raw-${i + 1}.webp`);
      await downloadImage(img.url, rawPath);
      logger.log(`  Saved raw: ${rawPath}`);

      // Evaluate
      const score = await b.EvaluateLifestyleImage(
        Image.fromUrl(img.url),
        Image.fromUrl(swatchUrl),
        Image.fromUrl(roomUrl),
        fabric,
        currentPrompt
      );

      // Save evaluation
      const evalPath = path.join(intDir, `${roomId}-attempt-${attempt}-eval-${i + 1}.json`);
      saveJson(evalPath, score);

      logger.log(`  Image ${i + 1}: overall=${score.overall} fabric=${score.fabric_fidelity} room=${score.room_coherence} realism=${score.realism} lighting=${score.lighting} drape=${score.curtain_drape} rod=${score.rod_hidden} hem=${score.hem_clearance} pass=${score.pass}`);
      if (score.issues.length > 0) {
        logger.log(`  Issues: ${score.issues.join("; ")}`);
      }

      allResults.push({ url: img.url, localPath: rawPath, score, attempt });
    }

    // Check for passing images
    const passing = allResults.filter((r) => r.score.pass);
    if (passing.length > 0) {
      const best = passing.sort((a, bb) => bb.score.overall - a.score.overall)[0];
      const finalPath = path.join(outDir, `${sku}-${roomId}.webp`);
      fs.copyFileSync(best.localPath, finalPath);
      logger.log(`\n=== PASS — ${finalPath} (overall: ${best.score.overall}) ===`);
      logger.setResult("pass");
      logger.addDetail("bestScore", best.score.overall);
      logger.addDetail("attempts", attempt);
      logger.flush();
      return { finalPath, score: best.score };
    }

    // Retry with improvement
    const bestSoFar = allResults.sort((a, bb) => bb.score.overall - a.score.overall)[0];
    if (bestSoFar.score.improvement) {
      logger.log(`\n  Retrying with: ${bestSoFar.score.improvement}`);
      currentPrompt = `${crafted.prompt}\n\nIMPORTANT CORRECTION: ${bestSoFar.score.improvement}`;
    }
  }

  // Max retries — use best available
  const best = allResults.sort((a, bb) => bb.score.overall - a.score.overall)[0];
  const finalPath = path.join(outDir, `${sku}-${roomId}.webp`);
  fs.copyFileSync(best.localPath, finalPath);
  logger.log(`\n=== MAX RETRIES — best: ${finalPath} (overall: ${best.score.overall}) ===`);
  logger.setResult("max_retries");
  logger.addDetail("bestScore", best.score.overall);
  logger.addDetail("attempts", MAX_RETRIES);
  logger.flush();
  return { finalPath, score: best.score };
}

// ---------------------------------------------------------------------------
// Texture flow
// ---------------------------------------------------------------------------

export async function runTexture(
  design: CatalogDesign,
  variant: CatalogVariant,
  outputDir?: string,
) {
  const sku = variant.sku;
  const outDir = outputDir ?? productOutDir(sku);
  const intDir = path.join(outDir, "intermediate");
  fs.mkdirSync(intDir, { recursive: true });

  const logger = new Logger(outDir);
  logger.setFlow(`texture:${sku}`);
  logger.log(`=== PDP Texture: ${sku} ===`);

  const fabric = toFabricDescription(design, variant);

  // Upload
  logger.startStep("Upload swatch");
  const swatchPath = path.join(PRODUCTS_DIR, variant.swatch);
  const swatchUrl = await uploadImage(swatchPath);
  logger.log(`  Swatch: ${swatchUrl}`);

  // Craft
  logger.startStep("Craft prompt");
  const crafted = await b.CraftTexturePrompt(fabric, Image.fromUrl(swatchUrl));
  logger.log(`  Prompt: ${crafted.prompt}`);
  saveJson(path.join(intDir, "crafted-prompt-texture.json"), crafted);

  // Generate
  logger.startStep("Generate + Evaluate");
  const result = await generate({
    prompt: crafted.prompt,
    imageUrls: [swatchUrl],
    numImages: 2,
    aspectRatio: "1:1",
    resolution: "1K",
    outputFormat: "webp",
  });

  // Save + evaluate
  let bestResult: { rawPath: string; score: any } | null = null;
  for (let i = 0; i < result.images.length; i++) {
    const img = result.images[i];
    const rawPath = path.join(intDir, `texture-raw-${i + 1}.webp`);
    await downloadImage(img.url, rawPath);

    const score = await b.EvaluateTextureImage(
      Image.fromUrl(img.url),
      Image.fromUrl(swatchUrl),
      fabric
    );
    saveJson(path.join(intDir, `texture-eval-${i + 1}.json`), score);

    logger.log(`  Image ${i + 1}: overall=${score.overall} pass=${score.pass}`);

    if (!bestResult || score.overall > bestResult.score.overall) {
      bestResult = { rawPath, score };
    }
    if (score.pass) break;
  }

  const best = bestResult!;
  const finalPath = path.join(outDir, `${sku}-texture.webp`);
  fs.copyFileSync(best.rawPath, finalPath);
  logger.log(`  Final: ${finalPath}`);
  logger.flush();
  return { finalPath, score: best.score };
}

// ---------------------------------------------------------------------------
// Hero Banner flow (AI base image + Satori text overlay)
// ---------------------------------------------------------------------------

async function runHeroBanner(
  bannerId: string,
  bannerDef: ManifestBanner,
  manifest: Manifest,
  catalog: Catalog,
) {
  const outDir = path.join(OUTPUT_DIR, "hero-banners");
  const intDir = path.join(outDir, "intermediate");
  fs.mkdirSync(intDir, { recursive: true });

  const logger = new Logger(outDir);
  logger.setFlow(`hero-banner:${bannerId}`);
  logger.log(`=== Hero Banner: ${bannerId} ===`);

  let design: CatalogDesign;
  let variant: CatalogVariant;
  try {
    ({ design, variant } = findBySku(catalog, bannerDef.sku));
  } catch {
    logger.log(`  ERROR: SKU "${bannerDef.sku}" not found in catalog.json`);
    logger.flush();
    return;
  }

  const roomDef = manifest.rooms[bannerDef.room];
  if (!roomDef) {
    logger.log(`  ERROR: Room "${bannerDef.room}" not found in manifest.json`);
    logger.flush();
    return;
  }

  const fabric = toFabricDescription(design, variant);
  const room = toRoomDescription(roomDef);

  // Step 1: Upload images
  logger.startStep("Upload images");
  const swatchPath = path.join(PRODUCTS_DIR, variant.swatch);
  const roomPath = path.join(INPUT_DIR, roomDef.image);
  const [swatchUrl, roomUrl] = await Promise.all([
    uploadImage(swatchPath),
    uploadImage(roomPath),
  ]);
  logger.log(`  Swatch: ${swatchUrl}`);
  logger.log(`  Room: ${roomUrl}`);

  // Step 2: Craft banner prompt (text zone on left, scene on right)
  logger.startStep("Craft banner prompt");
  const crafted = await b.CraftBannerPrompt(
    fabric,
    room,
    Image.fromUrl(swatchUrl),
    Image.fromUrl(roomUrl),
    "left"
  );
  logger.log(`  Prompt: ${crafted.prompt}`);
  logger.log(`  Reasoning: ${crafted.reasoning}`);
  saveJson(path.join(intDir, `crafted-prompt-${bannerId}.json`), crafted);

  // Step 3: Generate base image (21:9 wide)
  logger.startStep("Generate base image");
  const result = await generate({
    prompt: crafted.prompt,
    imageUrls: [roomUrl, swatchUrl],
    numImages: 2,
    aspectRatio: "21:9",
    resolution: "2K",
    outputFormat: "png",
  });
  logger.log(`  Generated ${result.images.length} images`);

  // Save raw base images, pick the first one (no quality eval for banners —
  // the text overlay is deterministic and the base just needs to be decent)
  const baseImagePaths: string[] = [];
  for (let i = 0; i < result.images.length; i++) {
    const rawPath = path.join(intDir, `${bannerId}-base-${i + 1}.png`);
    await downloadImage(result.images[i].url, rawPath);
    baseImagePaths.push(rawPath);
    logger.log(`  Saved base: ${rawPath}`);
  }

  // Step 4: Render text overlay with Satori
  logger.startStep("Render text overlay");
  const logoPath = bannerDef.logo
    ? path.join(INPUT_DIR, bannerDef.logo)
    : undefined;

  // Render a banner for each base image variant
  for (let i = 0; i < baseImagePaths.length; i++) {
    const finalBuffer = await renderHeroBanner({
      baseImagePath: baseImagePaths[i],
      headline: bannerDef.headline,
      subHeadline: bannerDef.sub_headline,
      discount: bannerDef.discount,
      cta: bannerDef.cta,
      disclaimer: bannerDef.disclaimer,
      logoPath,
      bgColor: bannerDef.bg_color,
      textColor: bannerDef.text_color,
      accentColor: bannerDef.accent_color,
    });

    const finalPath = path.join(
      outDir,
      baseImagePaths.length === 1
        ? `${bannerId}.webp`
        : `${bannerId}-${i + 1}.webp`
    );
    fs.writeFileSync(finalPath, finalBuffer);
    logger.log(`  Final: ${finalPath} (${(finalBuffer.length / 1024).toFixed(0)} KB)`);
  }

  logger.log(`\n=== DONE — Hero Banner: ${bannerId} ===`);
  logger.flush();
}

// ---------------------------------------------------------------------------
// Collection Card flow (AI base image + Satori text overlay)
// ---------------------------------------------------------------------------

async function runCollectionCard(
  collectionId: string,
  collectionDef: ManifestCollection,
  manifest: Manifest,
  catalog: Catalog,
) {
  const outDir = path.join(OUTPUT_DIR, "collections");
  const intDir = path.join(outDir, "intermediate");
  fs.mkdirSync(intDir, { recursive: true });

  const logger = new Logger(outDir);
  logger.setFlow(`collection:${collectionId}`);
  logger.log(`=== Collection Card: ${collectionId} — "${collectionDef.name}" ===`);

  // Gather swatches from collection SKUs
  const swatchPaths: string[] = [];
  for (const sku of collectionDef.skus) {
    try {
      const { variant } = findBySku(catalog, sku);
      swatchPaths.push(path.join(PRODUCTS_DIR, variant.swatch));
    } catch {
      logger.log(`  WARNING: SKU "${sku}" not found in catalog.json, skipping`);
    }
  }

  if (swatchPaths.length === 0) {
    logger.log("  ERROR: No valid swatches found");
    logger.flush();
    return;
  }

  // Upload swatches
  logger.startStep("Upload swatches");
  const swatchUrls: string[] = [];
  for (const sp of swatchPaths) {
    const url = await uploadImage(sp);
    swatchUrls.push(url);
    logger.log(`  ${path.basename(sp)}: ${url}`);
  }

  // If a room is specified, upload it and use CraftBannerPrompt for richer context
  // Otherwise, craft a collection-specific prompt directly
  let roomUrl: string | undefined;
  let roomDef: ManifestRoom | undefined;
  if (collectionDef.room) {
    roomDef = manifest.rooms[collectionDef.room];
    if (roomDef) {
      const roomPath = path.join(INPUT_DIR, roomDef.image);
      roomUrl = await uploadImage(roomPath);
      logger.log(`  Room: ${roomUrl}`);
    }
  }

  // Step 2: Craft collection prompt
  logger.startStep("Craft collection prompt");
  const moodPrompts: Record<string, string> = {
    "outdoor-natural":
      "Create an artistic lifestyle photograph for a curtain fabric collection. Show a sunlit outdoor garden setting with the fabrics from the provided images draped elegantly over natural elements like tree branches, stone surfaces, or garden furniture. The scene should feel editorial, aspirational, and natural. Warm golden-hour sunlight, shallow depth of field. The fabrics should be clearly visible and prominent. Professional fashion/lifestyle photography. 5:4 composition.",
    "indoor-warm":
      "Create a lifestyle photograph for a curtain fabric collection. Show a cozy, warm interior with the fabrics from the provided images displayed as curtains and draped textiles. Warm tones with styled furniture and decor. The textiles should be the visual focus. Professional interior lifestyle photography, warm natural lighting. 5:4 composition.",
    "minimal-modern":
      "Create a minimal, modern lifestyle photograph for a curtain fabric collection. Show the fabrics from the provided images elegantly draped and arranged on a clean surface and hung from a simple rod. Architectural setting with clean lines and natural light. Professional textile photography, bright and airy. 5:4 composition.",
  };

  const basePrompt = moodPrompts[collectionDef.mood] ?? moodPrompts["indoor-warm"];

  // Use BAML CraftBannerPrompt if room context is available, otherwise use mood prompt directly
  let prompt: string;
  if (roomUrl && roomDef) {
    const firstSku = collectionDef.skus[0] ?? catalog.designs[0]?.variants[0]?.sku;
    const { design: firstDesign, variant: firstVariant } = findBySku(catalog, firstSku);
    const fabric = toFabricDescription(firstDesign, firstVariant);
    const room = toRoomDescription(roomDef);

    const crafted = await b.CraftBannerPrompt(
      fabric,
      room,
      Image.fromUrl(swatchUrls[0]),
      Image.fromUrl(roomUrl),
      "bottom"
    );
    prompt = crafted.prompt;
    logger.log(`  Prompt (BAML crafted): ${prompt}`);
    saveJson(path.join(intDir, `crafted-prompt-${collectionId}.json`), crafted);
  } else {
    prompt = basePrompt;
    logger.log(`  Prompt (mood template): ${prompt}`);
    saveJson(path.join(intDir, `crafted-prompt-${collectionId}.json`), { prompt, mood: collectionDef.mood });
  }

  // Step 3: Generate base image
  logger.startStep("Generate collection image");
  const imageUrls = roomUrl ? [roomUrl, ...swatchUrls] : swatchUrls;

  const result = await generate({
    prompt,
    imageUrls,
    numImages: 2,
    aspectRatio: "5:4",
    resolution: "1K",
    outputFormat: "png",
  });
  logger.log(`  Generated ${result.images.length} images`);

  // Save raw base images
  const baseImagePaths: string[] = [];
  for (let i = 0; i < result.images.length; i++) {
    const rawPath = path.join(intDir, `${collectionId}-base-${i + 1}.png`);
    await downloadImage(result.images[i].url, rawPath);
    baseImagePaths.push(rawPath);
    logger.log(`  Saved base: ${rawPath}`);
  }

  // Step 4: Render text overlay with Satori
  logger.startStep("Render text overlay");

  for (let i = 0; i < baseImagePaths.length; i++) {
    const finalBuffer = await renderCollectionCard({
      baseImagePath: baseImagePaths[i],
      collectionName: collectionDef.name,
    });

    const finalPath = path.join(
      outDir,
      baseImagePaths.length === 1
        ? `${collectionId}.png`
        : `${collectionId}-${i + 1}.png`
    );
    fs.writeFileSync(finalPath, finalBuffer);
    logger.log(`  Final: ${finalPath} (${(finalBuffer.length / 1024).toFixed(0)} KB)`);
  }

  logger.log(`\n=== DONE — Collection Card: ${collectionId} ===`);
  logger.flush();
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);

  const getFlag = (name: string): string | undefined => {
    const idx = args.indexOf(`--${name}`);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const sku = getFlag("sku");
  const flowFilter = getFlag("flow");
  const roomFilter = getFlag("room");
  const bannerId = getFlag("banner");
  const collectionId = getFlag("collection");

  if (!sku && !bannerId && !collectionId) {
    console.log("Usage:");
    console.log("  npx tsx src/generate.ts --sku BLK-001");
    console.log("  npx tsx src/generate.ts --sku BLK-001 --room room-01-terracotta-wall");
    console.log("  npx tsx src/generate.ts --sku BLK-001 --flow texture");
    console.log("  npx tsx src/generate.ts --banner spring-sale");
    console.log("  npx tsx src/generate.ts --collection bahar");
    console.log("");
    console.log("Reads from assets/input/manifest.json. Outputs to assets/output/");
    process.exit(1);
  }

  const manifest = loadManifest();
  const catalog = loadProductCatalog();

  // --- Banner flow ---
  if (bannerId) {
    if (!manifest.banners) {
      console.error("No banners defined in manifest.json");
      process.exit(1);
    }
    const bannerDef = manifest.banners[bannerId];
    if (!bannerDef) {
      console.error(`Banner "${bannerId}" not found in manifest.json`);
      console.error(`Available: ${Object.keys(manifest.banners).join(", ")}`);
      process.exit(1);
    }
    await runHeroBanner(bannerId, bannerDef, manifest, catalog);
    console.log("\nDone. Output in:", path.join(OUTPUT_DIR, "hero-banners"));
    return;
  }

  // --- Collection flow ---
  if (collectionId) {
    if (!manifest.collections) {
      console.error("No collections defined in manifest.json");
      process.exit(1);
    }
    const collectionDef = manifest.collections[collectionId];
    if (!collectionDef) {
      console.error(`Collection "${collectionId}" not found in manifest.json`);
      console.error(`Available: ${Object.keys(manifest.collections).join(", ")}`);
      process.exit(1);
    }
    await runCollectionCard(collectionId, collectionDef, manifest, catalog);
    console.log("\nDone. Output in:", path.join(OUTPUT_DIR, "collections"));
    return;
  }

  // --- Product flows (lifestyle, texture) ---
  let design: CatalogDesign;
  let variant: CatalogVariant;
  try {
    ({ design, variant } = findBySku(catalog, sku!));
  } catch {
    console.error(`SKU "${sku}" not found in catalog.json`);
    process.exit(1);
  }

  const flows = flowFilter ? [flowFilter] : ["lifestyle", "texture"];
  const allRooms = Object.keys(manifest.rooms);
  const rooms = roomFilter
    ? [roomFilter]
    : [allRooms[Math.floor(Math.random() * allRooms.length)]];

  for (const flow of flows) {
    if (flow === "lifestyle") {
      for (const roomId of rooms) {
        const roomDef = manifest.rooms[roomId];
        if (!roomDef) {
          console.error(`Room "${roomId}" not found in manifest.json`);
          continue;
        }
        await runLifestyle(design, variant, roomId, roomDef);
      }
    } else if (flow === "texture") {
      await runTexture(design, variant);
    }
  }

  console.log("\nDone. Output in:", productOutDir(sku!));
}

// ---------------------------------------------------------------------------
// Analyze swatch (exported for PMS)
// ---------------------------------------------------------------------------

export async function analyzeSwatch(swatchAbsPath: string): Promise<{
  material:     string;
  transparency: string;
  texture:      string | null;
  weight:       string;
  pattern:      string | null;
}> {
  const swatchUrl = await uploadImage(swatchAbsPath);
  const result = await b.AnalyzeSwatch(Image.fromUrl(swatchUrl));
  return {
    material:     result.material,
    transparency: result.transparency,
    texture:      result.texture ?? null,
    weight:       result.weight,
    pattern:      result.pattern ?? null,
  };
}

// Only run CLI when this file is the entry point (not when imported as a module)
if (process.argv[1] === __filename) {
  main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}

// Re-export manifest room type for consumers
export type { ManifestRoom } from "./lib/helpers";
