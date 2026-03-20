import { fal } from "@fal-ai/client";
import { config } from "../config.ts";
import { evaluateImage } from "./evaluator.ts";
import logger from "./logger.ts";
import { buildPrompt } from "./prompt-builder.ts";
import type { ProductData } from "./shopify.ts";

export interface GenerationResult {
	binary: Buffer;
	score: number;
	attemptsUsed: number;
}

interface FalOutput {
	images?: { url: string }[];
	image?: { url: string };
}

type AttemptResult = {
	binary: Buffer;
	score: number;
};

export async function generateRoomImage(
	roomImageBuffer: Buffer,
	productData: ProductData,
): Promise<GenerationResult> {
	fal.config({ credentials: config.FAL_API_KEY });

	// Upload room image to fal.ai storage
	const roomBlob = new Blob([roomImageBuffer.buffer as ArrayBuffer], {
		type: "image/jpeg",
	});
	const roomImageUrl = await fal.storage.upload(roomBlob);

	const attempts: AttemptResult[] = [];
	let attemptsUsed = 0;

	for (let attempt = 1; attempt <= config.MAX_ATTEMPTS; attempt++) {
		attemptsUsed = attempt;
		const { prompt, seed } = buildPrompt(productData, attempt);

		logger.info({ event: "fal_call", attempt, model: config.FAL_MODEL, seed });

		try {
			const controller = new AbortController();
			const timeout = setTimeout(
				() => controller.abort(),
				config.FAL_TIMEOUT_MS,
			);

			let result: { data: FalOutput };
			try {
				result = await fal.subscribe(config.FAL_MODEL, {
					input: {
						prompt,
						seed,
						image_url: roomImageUrl,
						reference_image_url: productData.imageUrl,
					},
					abortSignal: controller.signal,
				});
			} finally {
				clearTimeout(timeout);
			}

			const imageUrl = result.data.images?.[0]?.url ?? result.data.image?.url;
			if (!imageUrl) {
				logger.warn({ event: "fal_no_image", attempt });
				continue;
			}

			// Download result as binary immediately
			const imageRes = await fetch(imageUrl);
			const binary = Buffer.from(await imageRes.arrayBuffer());

			logger.info({ event: "fal_downloaded", attempt, bytes: binary.length });

			// Evaluate quality
			const evalResult = await evaluateImage(binary, productData.title);
			logger.info({
				event: "eval_result",
				attempt,
				score: evalResult.score,
				has_curtains: evalResult.has_curtains,
			});

			attempts.push({ binary, score: evalResult.score });

			// Stop if quality is good enough
			if (
				evalResult.score >= config.SCORE_THRESHOLD &&
				evalResult.has_curtains
			) {
				break;
			}
		} catch (err) {
			logger.warn({ event: "fal_attempt_failed", attempt, err });
		}
	}

	if (attempts.length === 0) {
		throw new Error("GENERATION_FAILED");
	}

	// Return binary with highest score
	const best = attempts.reduce((a, b) => (a.score >= b.score ? a : b));

	return {
		binary: best.binary,
		score: best.score,
		attemptsUsed,
	};
}
