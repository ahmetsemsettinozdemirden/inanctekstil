import { Hono } from "hono";
import type { GenerationResult } from "../lib/fal.ts";
import logger from "../lib/logger.ts";
import type { ProductData } from "../lib/shopify.ts";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

// In-memory rate limiter: 5 req/min per IP (single-instance, resets on restart)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function resetRateLimiter(): void {
	rateLimitMap.clear();
}

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
	"Access-Control-Expose-Headers": "X-Product-Title",
};

export interface VisualizeDeps {
	getProductDataFromSwatch: (sku: string) => ProductData | null;
	getProductData: (id: string) => Promise<ProductData | null>;
	generateRoomImage: (
		buf: Buffer,
		product: ProductData,
	) => Promise<GenerationResult>;
}

export function createVisualizeRoute(deps: VisualizeDeps): Hono {
	const route = new Hono();

	route.options("/", (c) => {
		return new Response(null, {
			status: 204,
			headers: CORS_HEADERS,
		});
	});

	route.post("/", async (c) => {
		const ip = c.req.header("x-forwarded-for") ?? "unknown";

		if (!checkRateLimit(ip)) {
			logger.warn({ event: "rate_limited", ip });
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

		if (
			!productId ||
			typeof productId !== "string" ||
			productId.trim() === ""
		) {
			return new Response(
				JSON.stringify({
					success: false,
					error: {
						code: "VALIDATION_ERROR",
						message: "product_id is required",
					},
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

		const clientSku = (formData.get("product_sku") as string | null)?.trim() ?? "";

		logger.info({
			event: "visualize_start",
			product_id: productId,
			product_sku: clientSku,
			image_size_bytes: roomImageFile.size,
			image_type: roomImageFile.type,
			image_name: roomImageFile.name,
		});

		const startMs = Date.now();

		// Resolve product data: swatch-assets → client fields → Shopify API
		let productData: ProductData | null = null;
		let resolvedSource = "not_found";

		if (clientSku) {
			productData = deps.getProductDataFromSwatch(clientSku);
			if (productData) resolvedSource = "swatch";
		}

		if (!productData) {
			const clientTitle = formData.get("product_title");
			if (typeof clientTitle === "string" && clientTitle.trim()) {
				const rawThreadColors = formData.get("product_thread_colors");
				let threadColors: string[] = [];
				if (typeof rawThreadColors === "string" && rawThreadColors.trim()) {
					try {
						threadColors = JSON.parse(rawThreadColors) as string[];
					} catch {
						// ignore malformed JSON
					}
				}
				const rawPixelsPerCm = formData.get("product_pixels_per_cm");
				const pixelsPerCm =
					typeof rawPixelsPerCm === "string" && rawPixelsPerCm.trim()
						? Number(rawPixelsPerCm)
						: null;
				productData = {
					title: clientTitle,
					type: (formData.get("product_type") as string) ?? "",
					color: (formData.get("product_color") as string) ?? "",
					imageUrl: (formData.get("product_image_url") as string) ?? "",
					sku: clientSku,
					threadColors,
					pixelsPerCm: pixelsPerCm !== null && !isNaN(pixelsPerCm) ? pixelsPerCm : null,
				};
				resolvedSource = "client_fields";
			}
		}

		if (!productData) {
			const shopifyData = await deps.getProductData(productId);
			if (shopifyData) {
				// Attempt swatch enrichment with the SKU returned by Shopify
				const swatchData = shopifyData.sku
					? deps.getProductDataFromSwatch(shopifyData.sku)
					: null;
				productData = swatchData ?? shopifyData;
				resolvedSource = swatchData ? "shopify_swatch" : "shopify_api";
			}
		}

		logger.info({
			event: "product_resolved",
			product_id: productId,
			product_sku: clientSku,
			resolved_sku: productData?.sku ?? "",
			source: resolvedSource,
		});

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

		logger.info({
			event: "product_fetched",
			product_id: productId,
			title: productData.title,
			type: productData.type,
			color: productData.color,
			thread_colors: productData.threadColors,
			pixels_per_cm: productData.pixelsPerCm,
		});

		const roomImageBuffer = Buffer.from(await roomImageFile.arrayBuffer());

		let result: GenerationResult;
		try {
			result = await deps.generateRoomImage(roomImageBuffer, productData);
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
		logger.info({ event: "visualize_complete", duration_ms: durationMs });

		// Detect image format from magic bytes
		const isPng = result.binary[0] === 0x89 && result.binary[1] === 0x50;
		const contentType = isPng ? "image/png" : "image/jpeg";

		return new Response(result.binary.buffer as ArrayBuffer, {
			status: 200,
			headers: {
				...CORS_HEADERS,
				"Content-Type": contentType,
				"X-Product-Title": encodeURIComponent(productData.title),
			},
		});
	});

	return route;
}

// Default export for production use
import { generateRoomImage } from "../lib/fal.ts";
import { getProductData } from "../lib/shopify.ts";
import { getProductDataFromSwatch } from "../lib/swatch.ts";
export const visualizeRoute = createVisualizeRoute({
	getProductDataFromSwatch,
	getProductData,
	generateRoomImage,
});
