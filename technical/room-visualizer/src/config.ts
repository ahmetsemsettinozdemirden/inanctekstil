export const config = {
	FAL_API_KEY: process.env.FAL_API_KEY ?? "",
	FAL_MODEL: process.env.FAL_MODEL ?? "fal-ai/nano-banana-2/edit",
	SHOPIFY_ACCESS_TOKEN: process.env.SHOPIFY_ACCESS_TOKEN ?? "",
	SHOPIFY_STORE_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN ?? "",
	FAL_TIMEOUT_MS: Number(process.env.FAL_TIMEOUT_MS ?? "45000"),
} as const;
