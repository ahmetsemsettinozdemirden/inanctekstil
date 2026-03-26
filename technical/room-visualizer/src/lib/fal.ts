import { fal } from "@fal-ai/client";
import { existsSync, readFileSync } from "node:fs";
import { config } from "../config.ts";
import logger from "./logger.ts";
import { buildPrompt } from "./prompt-builder.ts";
import type { ProductData } from "./shopify.ts";

export interface GenerationResult {
	binary: Buffer;
}

interface FalOutput {
	images?: { url: string }[];
	image?: { url: string };
}

export async function generateRoomImage(
	roomImageBuffer: Buffer,
	productData: ProductData,
): Promise<GenerationResult> {
	fal.config({ credentials: config.FAL_API_KEY });

	const roomBlob = new Blob([roomImageBuffer.buffer as ArrayBuffer], {
		type: "image/jpeg",
	});
	const roomImageUrl = await fal.storage.upload(roomBlob);

	// Upload texture image as reference if available
	const imageUrls: string[] = [roomImageUrl];
	let hasTexture = false;

	if (productData.imageUrl && existsSync(productData.imageUrl)) {
		const textureBuffer = readFileSync(productData.imageUrl);
		const textureBlob = new Blob([textureBuffer.buffer as ArrayBuffer], {
			type: "image/jpeg",
		});
		const textureUrl = await fal.storage.upload(textureBlob);
		imageUrls.push(textureUrl);
		hasTexture = true;
		logger.info({ event: "fal_texture_uploaded", sku: productData.sku, texture_path: productData.imageUrl });
	} else {
		logger.warn({ event: "fal_texture_missing", sku: productData.sku, image_url: productData.imageUrl || "(empty)" });
	}

	const { prompt, seed } = buildPrompt(productData, Math.random, hasTexture);

	logger.info({
		event: "fal_call",
		model: config.FAL_MODEL,
		has_texture: hasTexture,
		thread_colors: productData.threadColors,
		pixels_per_cm: productData.pixelsPerCm,
		prompt,
	});

	const result = await fal.subscribe(config.FAL_MODEL, {
		input: {
			prompt,
			seed,
			image_urls: imageUrls,
		},
	}) as { data: FalOutput };

	const imageUrl = result.data.images?.[0]?.url ?? result.data.image?.url;
	if (!imageUrl) {
		logger.error({ event: "fal_no_image" });
		throw new Error("GENERATION_FAILED");
	}

	const imageRes = await fetch(imageUrl);
	const binary = Buffer.from(await imageRes.arrayBuffer());

	logger.info({ event: "fal_downloaded", bytes: binary.length });

	return { binary };
}
