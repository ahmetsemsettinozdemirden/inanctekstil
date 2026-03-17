import { fal } from "@fal-ai/client";
import fs from "fs";
import path from "path";

// Initialize fal.ai with API key from environment
fal.config({ credentials: process.env.FAL_KEY! });

const ENDPOINT = "fal-ai/nano-banana-2/edit" as const;

export type AspectRatio =
  | "auto" | "1:1" | "3:4" | "4:3" | "3:2" | "2:3"
  | "16:9" | "9:16" | "21:9" | "4:1" | "1:4" | "5:4" | "4:5";

export type Resolution = "0.5K" | "1K" | "2K" | "4K";

export interface GenerateOptions {
  prompt: string;
  imageUrls: string[];
  numImages?: number;
  aspectRatio?: AspectRatio;
  resolution?: Resolution;
  outputFormat?: "png" | "jpeg" | "webp";
  seed?: number;
  thinkingLevel?: "minimal" | "high";
}

export interface GeneratedImage {
  url: string;
  contentType: string;
  width: number;
  height: number;
  fileSize: number;
}

export interface GenerateResult {
  images: GeneratedImage[];
  description: string;
}

/**
 * Upload a local file to fal.ai storage and return its URL.
 * Nano Banana 2 requires publicly accessible URLs for image_urls.
 */
export async function uploadImage(filePath: string): Promise<string> {
  const absolutePath = path.resolve(filePath);
  const file = new File(
    [fs.readFileSync(absolutePath)],
    path.basename(absolutePath),
    { type: getMimeType(absolutePath) }
  );
  const url = await fal.storage.upload(file);
  return url;
}

/**
 * Generate images using Nano Banana 2 Edit.
 */
export async function generate(options: GenerateOptions): Promise<GenerateResult> {
  const result = await fal.subscribe(ENDPOINT, {
    input: {
      prompt: options.prompt,
      image_urls: options.imageUrls,
      num_images: options.numImages ?? 1,
      aspect_ratio: options.aspectRatio ?? "auto",
      resolution: options.resolution ?? "1K",
      output_format: options.outputFormat ?? "webp",
      ...(options.seed !== undefined && { seed: options.seed }),
      ...(options.thinkingLevel && { thinking_level: options.thinkingLevel }),
    },
  });

  const data = result.data as any;
  return {
    images: data.images.map((img: any) => ({
      url: img.url,
      contentType: img.content_type,
      width: img.width,
      height: img.height,
      fileSize: img.file_size,
    })),
    description: data.description ?? "",
  };
}

/**
 * Download a generated image to a local file.
 */
export async function downloadImage(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, buffer);
}

export function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
  };
  return mimeTypes[ext] ?? "image/jpeg";
}
