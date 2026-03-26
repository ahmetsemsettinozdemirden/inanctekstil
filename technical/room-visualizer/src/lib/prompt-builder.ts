import type { ProductData } from "./shopify.ts";

export interface PromptResult {
	prompt: string;
	seed: number;
}

export function buildPrompt(
	product: ProductData,
	seedFn: () => number = Math.random,
	hasTextureImage = false,
): PromptResult {
	const parts = [
		`Add ${product.color} ${product.type} curtains to all windows in this room, floor-length drapes, neatly hanging, photorealistic, interior design photography`,
	];

	if (hasTextureImage) {
		parts.push("replicate the fabric texture pattern from the reference image exactly");
	}

	if (product.threadColors.length > 0) {
		parts.push(`thread tones: ${product.threadColors.join(", ")}`);
	}

	if (product.pixelsPerCm !== null) {
		parts.push(`fabric scale: ${product.pixelsPerCm}px/cm`);
	}

	const prompt = parts.join(", ");
	const seed = Math.floor(seedFn() * 2 ** 31);

	return { prompt, seed };
}
