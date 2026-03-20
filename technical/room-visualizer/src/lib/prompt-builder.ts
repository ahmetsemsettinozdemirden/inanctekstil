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
	const base = `A modern Turkish living room with ${product.color} ${product.type} curtains hanging on the windows, photorealistic, interior design photography, natural lighting, high quality`;

	const prompt =
		attempt > 1
			? `${base}, curtains prominently visible on windows, window treatment focal point`
			: base;

	const seed = Math.floor(seedFn() * 2 ** 31);

	return { prompt, seed };
}
