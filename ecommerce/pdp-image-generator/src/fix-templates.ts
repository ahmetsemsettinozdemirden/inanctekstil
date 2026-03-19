/**
 * One-time room template fixer.
 *
 * Edits each room template image using FLUX Kontext [pro] to:
 *   1. Remove the visible curtain rod and all metal hardware (rings, hooks, brackets)
 *   2. Replace with a smooth plaster ceiling cornice (kartonpiyer)
 *   3. Raise the curtain hem to ~12cm above the floor (no floor contact)
 *
 * Usage:
 *   npx tsx src/fix-templates.ts                  # dry-run: preview only, don't apply
 *   npx tsx src/fix-templates.ts --apply          # edit images and update manifest.json
 *   npx tsx src/fix-templates.ts --room room-01   # process one room only
 *   npx tsx src/fix-templates.ts --apply --room room-01
 *
 * Outputs per room:
 *   assets/input/rooms/{id}-v2.jpg                # fixed image
 *   assets/input/rooms/{id}-v2-attempt-N.jpg      # intermediates (if --attempts N)
 *
 * After reviewing the v2 images, run with --apply to update manifest.json.
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { uploadImage, editWithKontext, downloadImage } from "./lib/fal-client";
import { loadManifest } from "./lib/helpers";

const __filename = fileURLToPath(import.meta.url);
const ROOT       = path.resolve(path.dirname(__filename), "..");
const INPUT_DIR  = path.join(ROOT, "assets", "input");
const ROOMS_DIR  = path.join(INPUT_DIR, "rooms");
const MANIFEST_PATH = path.join(INPUT_DIR, "manifest.json");

// ---------------------------------------------------------------------------
// Edit prompt — applied to every room template
// ---------------------------------------------------------------------------

/**
 * Universal cornice + hem-clearance prompt.
 * Kontext sees the image directly so the instruction can be structural.
 */
const TEMPLATE_FIX_PROMPT = `\
Remove the curtain rod and every piece of visible mounting hardware — \
metal rod, rings, O-rings, hooks, brackets, finials, and any wall-mounted fixtures \
at the top of the curtain. Replace the entire rod area with a smooth rectangular \
plaster cornice box (kartonpiyer) painted the same colour as the ceiling, \
mounted flush against the wall at the ceiling–wall junction, approximately 12–15 cm deep. \
The top of the curtain fabric should disappear cleanly behind this cornice — \
no curtain heading, tape, or hooks should be visible above the cornice line.

Additionally, shorten the curtain so the bottom hem ends 10–12 cm above the floor. \
There must be a clearly visible gap of bare floor between the hem and the baseboard. \
The curtain must not touch, brush, or pool on the floor.

Preserve everything else exactly: wall colour, floor material and texture, \
furniture, plants, decorative objects, window light, and the curtain fabric \
colour, transparency, pattern, and drape.`;

// ---------------------------------------------------------------------------
// Per-room overrides (extra context for models with strong existing rod styles)
// ---------------------------------------------------------------------------

const ROOM_OVERRIDES: Record<string, string> = {
  // Room 01 has a gold brass rod with large decorative rings
  "room-01-terracotta-wall": `${TEMPLATE_FIX_PROMPT} \
Note: the rod in this image is gold/brass with large decorative rings — \
remove all of it completely, including the finial end-caps.`,

  // Room 03 has a black double rod (sheer inner + main outer)
  "room-03-blue-wall": `${TEMPLATE_FIX_PROMPT} \
Note: this room has a double rod system (two parallel black rails). \
Remove both rails and all their hardware, replacing with a single \
smooth white plaster cornice that accommodates both curtain layers.`,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRoomPrompt(roomId: string): string {
  return ROOM_OVERRIDES[roomId] ?? TEMPLATE_FIX_PROMPT;
}

function v2Path(originalImagePath: string): string {
  const dir  = path.dirname(originalImagePath);
  const base = path.basename(originalImagePath, path.extname(originalImagePath));
  const ext  = path.extname(originalImagePath);
  return path.join(dir, `${base}-v2${ext}`);
}

function attemptPath(originalImagePath: string, n: number): string {
  const dir  = path.dirname(originalImagePath);
  const base = path.basename(originalImagePath, path.extname(originalImagePath));
  const ext  = path.extname(originalImagePath);
  return path.join(dir, `${base}-v2-attempt-${n}${ext}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function fixRoom(
  roomId: string,
  roomDef: { image: string },
  apply: boolean,
  numAttempts: number,
): Promise<boolean> {
  const imagePath = path.join(INPUT_DIR, roomDef.image);

  if (!fs.existsSync(imagePath)) {
    console.error(`  [${roomId}] ERROR: image not found at ${imagePath}`);
    return false;
  }

  const outPath = v2Path(imagePath);

  // Skip if v2 already exists and we're not forcing
  if (fs.existsSync(outPath) && !process.argv.includes("--force")) {
    console.log(`  [${roomId}] v2 already exists at ${path.relative(ROOT, outPath)} — skip (use --force to redo)`);
    return true;
  }

  console.log(`\n[${roomId}] Uploading original...`);
  const imageUrl = await uploadImage(imagePath);
  console.log(`  Uploaded: ${imageUrl}`);

  const prompt = getRoomPrompt(roomId);
  console.log(`  Prompt (${prompt.length} chars): ${prompt.slice(0, 120)}...`);

  const generatedPaths: string[] = [];

  for (let attempt = 1; attempt <= numAttempts; attempt++) {
    console.log(`  Generating attempt ${attempt}/${numAttempts}...`);

    const result = await editWithKontext({
      prompt,
      imageUrl,
      numImages: 1,
      outputFormat: "jpeg",
      guidanceScale: 3.5,
    });

    if (result.images.length === 0) {
      console.error(`  Attempt ${attempt}: no images returned`);
      continue;
    }

    const img      = result.images[0];
    const savePath = numAttempts > 1 ? attemptPath(imagePath, attempt) : outPath;
    await downloadImage(img.url, savePath);
    generatedPaths.push(savePath);
    console.log(`  Saved: ${path.relative(ROOT, savePath)} (${img.width}×${img.height}, ${(img.fileSize / 1024).toFixed(0)} KB)`);
  }

  if (generatedPaths.length === 0) {
    console.error(`  [${roomId}] All attempts failed`);
    return false;
  }

  // If multiple attempts, the user reviews and picks manually — copy attempt-1 as default v2
  if (numAttempts > 1 && !fs.existsSync(outPath)) {
    fs.copyFileSync(generatedPaths[0], outPath);
    console.log(`  Defaulted attempt-1 as v2. Review all attempts and overwrite ${path.relative(ROOT, outPath)} with your preferred one.`);
  }

  console.log(`  [${roomId}] Done → ${path.relative(ROOT, outPath)}`);

  if (!apply) {
    console.log(`  [${roomId}] DRY RUN — manifest.json not updated. Review the image, then run with --apply.`);
  }

  return true;
}

async function main() {
  const args = process.argv.slice(2);

  const apply      = args.includes("--apply");
  const force      = args.includes("--force");
  const roomFilter = (() => { const i = args.indexOf("--room"); return i !== -1 ? args[i + 1] : undefined; })();
  const numAttempts = (() => {
    const i = args.indexOf("--attempts");
    return i !== -1 ? parseInt(args[i + 1], 10) : 1;
  })();

  console.log("=== Room Template Fixer ===");
  console.log(`Mode: ${apply ? "APPLY (will update manifest.json)" : "DRY RUN (manifest unchanged)"}`);
  if (force) console.log("Force mode: will regenerate even if v2 already exists");
  if (roomFilter) console.log(`Filtering to room: ${roomFilter}`);
  if (numAttempts > 1) console.log(`Generating ${numAttempts} attempts per room for review`);
  console.log();

  const manifest = loadManifest(MANIFEST_PATH) as { rooms: Record<string, { image: string; [key: string]: unknown }> };
  const rooms    = Object.entries(manifest.rooms);
  const toProcess = roomFilter ? rooms.filter(([id]) => id === roomFilter) : rooms;

  if (toProcess.length === 0) {
    console.error(`No rooms found matching: ${roomFilter}`);
    process.exit(1);
  }

  const results: Record<string, boolean> = {};

  for (const [roomId, roomDef] of toProcess) {
    const ok = await fixRoom(roomId, roomDef, apply, numAttempts);
    results[roomId] = ok;
  }

  // Apply: update manifest.json to point to v2 images
  if (apply) {
    console.log("\nApplying manifest.json updates...");
    const raw = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")) as {
      rooms: Record<string, { image: string; [key: string]: unknown }>;
      [key: string]: unknown;
    };

    let updated = 0;
    for (const [roomId, ok] of Object.entries(results)) {
      if (!ok) continue;
      const roomDef     = raw.rooms[roomId];
      const origImage   = roomDef.image;  // e.g. "rooms/room-01-terracotta-wall.jpg"
      const ext         = path.extname(origImage);
      const base        = path.basename(origImage, ext);
      const dir         = path.dirname(origImage);
      const v2Image     = `${dir}/${base}-v2${ext}`;
      const v2AbsPath   = path.join(INPUT_DIR, v2Image);

      if (!fs.existsSync(v2AbsPath)) {
        console.warn(`  SKIP ${roomId}: v2 file not found at ${v2AbsPath}`);
        continue;
      }

      // Preserve old image under original_image key (for rollback)
      if (!roomDef.original_image) {
        raw.rooms[roomId].original_image = origImage;
      }
      raw.rooms[roomId].image = v2Image;
      updated++;
      console.log(`  ${roomId}: ${origImage} → ${v2Image}`);
    }

    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(raw, null, 2));
    console.log(`\nUpdated manifest.json (${updated} rooms changed)`);
    console.log("Original image paths saved under \"original_image\" key for rollback.");
  }

  // Summary
  console.log("\n=== Summary ===");
  for (const [roomId, ok] of Object.entries(results)) {
    const status = ok ? "✓" : "✗";
    const origDef = manifest.rooms[roomId];
    const v2 = v2Path(path.join(INPUT_DIR, origDef.image));
    console.log(`  ${status} ${roomId} → ${path.relative(ROOT, v2)}`);
  }

  if (!apply) {
    console.log("\nReview the generated v2 images, then run with --apply to update manifest.json.");
    console.log("Example: npx tsx src/fix-templates.ts --apply");
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
