import { Hono } from "hono";
import { generateRoomImage } from "../lib/fal.ts";
import logger from "../lib/logger.ts";
import { getProductData } from "../lib/shopify.ts";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

// In-memory rate limiter: 5 req/min per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
	const now = Date.now();
	const entry = rateLimitMap.get(ip);

	if (!entry || now >= entry.resetAt) {
		rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
		return true;
	}

	if (entry.count >= 5) return false;

	entry.count++;
	return true;
}

const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "https://inanctekstil.store",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
	"Access-Control-Expose-Headers":
		"X-Product-Title, X-Attempts-Used, X-Final-Score",
};

export const visualizeRoute = new Hono();

visualizeRoute.options("/", (c) => {
	return new Response(null, {
		status: 204,
		headers: CORS_HEADERS,
	});
});

visualizeRoute.post("/", async (c) => {
	const ip = c.req.header("x-forwarded-for") ?? "unknown";

	if (!checkRateLimit(ip)) {
		return new Response(
			JSON.stringify({
				success: false,
				error: { code: "RATE_LIMITED", message: "Too many requests" },
			}),
			{
				status: 429,
				headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
			},
		);
	}

	let formData: FormData;
	try {
		formData = await c.req.formData();
	} catch {
		return new Response(
			JSON.stringify({
				success: false,
				error: {
					code: "VALIDATION_ERROR",
					message: "Invalid multipart/form-data",
				},
			}),
			{
				status: 400,
				headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
			},
		);
	}

	const productId = formData.get("product_id");
	const roomImageFile = formData.get("room_image");

	if (!productId || typeof productId !== "string" || productId.trim() === "") {
		return new Response(
			JSON.stringify({
				success: false,
				error: { code: "VALIDATION_ERROR", message: "product_id is required" },
			}),
			{
				status: 400,
				headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
			},
		);
	}

	if (!roomImageFile || !(roomImageFile instanceof File)) {
		return new Response(
			JSON.stringify({
				success: false,
				error: {
					code: "VALIDATION_ERROR",
					message: "room_image file is required",
				},
			}),
			{
				status: 400,
				headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
			},
		);
	}

	if (!ALLOWED_TYPES.includes(roomImageFile.type)) {
		return new Response(
			JSON.stringify({
				success: false,
				error: {
					code: "VALIDATION_ERROR",
					message: "room_image must be jpg, png, or webp",
				},
			}),
			{
				status: 400,
				headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
			},
		);
	}

	if (roomImageFile.size > MAX_IMAGE_SIZE) {
		return new Response(
			JSON.stringify({
				success: false,
				error: {
					code: "VALIDATION_ERROR",
					message: "room_image must be under 10MB",
				},
			}),
			{
				status: 400,
				headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
			},
		);
	}

	logger.info({
		event: "visualize_start",
		product_id: productId,
		image_size_bytes: roomImageFile.size,
	});

	const startMs = Date.now();

	const productData = await getProductData(productId);
	if (!productData) {
		return new Response(
			JSON.stringify({
				success: false,
				error: { code: "PRODUCT_NOT_FOUND", message: "Product not found" },
			}),
			{
				status: 404,
				headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
			},
		);
	}

	const roomImageBuffer = Buffer.from(await roomImageFile.arrayBuffer());

	let result: Awaited<ReturnType<typeof generateRoomImage>>;
	try {
		result = await generateRoomImage(roomImageBuffer, productData);
	} catch (err) {
		logger.error({ event: "generation_failed", product_id: productId, err });
		return new Response(
			JSON.stringify({
				success: false,
				error: {
					code: "GENERATION_FAILED",
					message: "Image generation failed",
				},
			}),
			{
				status: 502,
				headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
			},
		);
	}

	const durationMs = Date.now() - startMs;
	logger.info({
		event: "visualize_complete",
		best_attempt: result.attemptsUsed,
		final_score: result.score,
		duration_ms: durationMs,
	});

	return new Response(result.binary.buffer as ArrayBuffer, {
		status: 200,
		headers: {
			...CORS_HEADERS,
			"Content-Type": "image/jpeg",
			"X-Product-Title": encodeURIComponent(productData.title),
			"X-Attempts-Used": String(result.attemptsUsed),
			"X-Final-Score": String(result.score),
		},
	});
});
