export const config = {
	FAL_API_KEY: process.env.FAL_API_KEY ?? "",
	FAL_MODEL: process.env.FAL_MODEL ?? "fal-ai/nano-banana-pro",
	SHOPIFY_ACCESS_TOKEN: process.env.SHOPIFY_ACCESS_TOKEN ?? "",
	SHOPIFY_STORE_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN ?? "",
	AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ?? "",
	AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ?? "",
	AWS_REGION: process.env.AWS_REGION ?? "us-east-1",
	SCORE_THRESHOLD: Number(process.env.SCORE_THRESHOLD ?? "7"),
	MAX_ATTEMPTS: Number(process.env.MAX_ATTEMPTS ?? "3"),
	FAL_TIMEOUT_MS: Number(process.env.FAL_TIMEOUT_MS ?? "45000"),
} as const;
