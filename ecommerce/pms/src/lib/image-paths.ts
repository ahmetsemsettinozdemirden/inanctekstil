import path from "path";
import fs from "fs";
import { PRODUCTS_DIR } from "./env.ts";

// Maps DB curtain_type values to filesystem directory codes
const TYPE_DIR: Record<string, string> = {
  BLACKOUT: "BLK",
  FON: "FON",
  STN: "STN",
  TUL: "TUL",
};
function typeDir(curtainType: string): string {
  return TYPE_DIR[curtainType] ?? curtainType;
}

export function swatchAbsPath(sku: string, curtainType: string): string {
  const dir = typeDir(curtainType);
  const ext = dir === "STN" ? "jpeg" : "JPG";
  return path.join(PRODUCTS_DIR, "01-cropped-katalog-images", dir, `${sku}.${ext}`);
}

export function swatchRelPath(sku: string, curtainType: string): string {
  const dir = typeDir(curtainType);
  const ext = dir === "STN" ? "jpeg" : "JPG";
  return `01-cropped-katalog-images/${dir}/${sku}.${ext}`;
}

export function generatedImagesDir(sku: string, curtainType: string): string {
  return path.join(PRODUCTS_DIR, "02-final-katalog-images", typeDir(curtainType), sku);
}

export interface GeneratedImageInfo {
  filename: string;
  absPath: string;
  imageType: "lifestyle" | "texture";
  roomId: string | null;
}

/** Scans the generated images directory for a SKU and returns found files. */
export function findGeneratedImages(sku: string, curtainType: string): GeneratedImageInfo[] {
  const dir = generatedImagesDir(sku, curtainType);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".webp"))
    .map((filename) => {
      const absPath = path.join(dir, filename);
      const isTexture = filename.includes("-texture");
      const roomMatch = filename.match(/-room-(\d{2}-[a-z-]+)\.webp$/);
      return {
        filename,
        absPath,
        imageType: isTexture ? "texture" : "lifestyle",
        roomId: roomMatch ? `room-${roomMatch[1]}` : null,
      };
    });
}
