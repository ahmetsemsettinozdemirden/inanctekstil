/**
 * One-shot hem clearance fix for room-01-v2.
 * Runs a second Kontext pass targeted ONLY at raising the curtain hem.
 */
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import { uploadImage, editWithKontext, downloadImage } from "./lib/fal-client";

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), "..");
const ROOMS_DIR = path.join(ROOT, "assets", "input", "rooms");

const INPUT  = path.join(ROOMS_DIR, "room-01-terracotta-wall-v2.jpg");
const OUTPUT = path.join(ROOMS_DIR, "room-01-terracotta-wall-v3.jpg");

const PROMPT = `Shorten the curtain so the bottom hem ends exactly 15 cm above the floor. \
There must be a large, clearly visible gap of bare herringbone wood floor between the curtain \
hem and the white baseboard — at minimum 15 cm of exposed floor all the way across the full \
width, including the left edge and right edge. The curtain must NOT touch, brush, pool, or \
drape onto the floor at any point. The hem must be perfectly straight and horizontal at the \
same height on both sides. \
Do NOT change anything else: keep the white plaster cornice at the ceiling exactly as it is, \
keep the curtain fabric colour and drape, keep the terracotta orange walls, herringbone parquet \
flooring, gold side table, vase with pampas grass, and all room proportions unchanged.`;

async function main() {
  console.log("Uploading v2 template...");
  const url = await uploadImage(INPUT);
  console.log("Uploaded:", url);

  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`\nKontext attempt ${attempt}/3...`);
    const result = await editWithKontext({
      prompt: PROMPT,
      imageUrl: url,
      numImages: 1,
      outputFormat: "jpeg",
      guidanceScale: 4.5,
    });

    if (result.images.length === 0) {
      console.error("  No images returned");
      continue;
    }

    const savePath = attempt === 1
      ? OUTPUT
      : path.join(ROOMS_DIR, `room-01-terracotta-wall-v3-attempt-${attempt}.jpg`);

    await downloadImage(result.images[0].url, savePath);
    console.log(`  Saved: ${path.relative(ROOT, savePath)}`);
  }

  console.log("\nReview the v3 images, then manually copy the best one over v2 if satisfied.");
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
