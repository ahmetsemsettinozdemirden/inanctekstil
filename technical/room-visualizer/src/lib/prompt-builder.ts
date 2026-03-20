import type { ProductData } from "./shopify.ts";

export interface PromptResult {
	prompt: string;
	seed: number;
}

export function buildPrompt(
	product: ProductData,
	attempt: number,
	seedFn: () => number = Math.random,
): PromptResult {
	const base = `Add ${product.color} ${product.type} curtains to all windows in this room, floor-length drapes, neatly hanging, photorealistic, interior design photography`;

	const prompt =
		attempt > 1
			? `${base}, curtains clearly visible on every window, elegant window treatment`
			: base;

	const seed = Math.floor(seedFn() * 2 ** 31);

	return { prompt, seed };
}
