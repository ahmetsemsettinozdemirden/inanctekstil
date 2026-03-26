import { beforeEach, describe, expect, it, mock } from "bun:test";
import {
	createVisualizeRoute,
	resetRateLimiter,
} from "../src/routes/visualize.ts";

const mockGenerateRoomImage = mock(async () => ({
	binary: Buffer.from([1, 2, 3, 4]),
}));

const mockGetProductData = mock(async (_id: string) => ({
	title: "HAVUZ Blackout Perde",
	type: "BLACKOUT",
	color: "beyaz",
	imageUrl: "https://cdn.shopify.com/havuz.jpg",
	sku: "blk-havuz",
	threadColors: [] as string[],
	pixelsPerCm: null as number | null,
}));

const mockGetProductDataFromSwatch = mock((_sku: string) => null as ReturnType<typeof import("../src/lib/swatch.ts").getProductDataFromSwatch>);

const visualizeRoute = createVisualizeRoute({
	getProductDataFromSwatch: mockGetProductDataFromSwatch,
	getProductData: mockGetProductData,
	generateRoomImage: mockGenerateRoomImage,
});

function makeMultipart(
	productId: string,
	imageData = Buffer.from("fake-image"),
): FormData {
	const fd = new FormData();
	fd.append("product_id", productId);
	const file = new File([imageData], "room.jpg", { type: "image/jpeg" });
	fd.append("room_image", file);
	return fd;
}

describe("POST /api/visualize", () => {
	beforeEach(() => {
		resetRateLimiter();
		mockGenerateRoomImage.mockReset();
		mockGetProductData.mockReset();
		mockGetProductDataFromSwatch.mockReset();
		mockGetProductDataFromSwatch.mockImplementation(() => null);
		mockGetProductData.mockImplementation(async () => ({
			title: "HAVUZ Blackout Perde",
			type: "BLACKOUT",
			color: "beyaz",
			imageUrl: "https://cdn.shopify.com/havuz.jpg",
			sku: "blk-havuz",
			threadColors: [],
			pixelsPerCm: null,
		}));
		mockGenerateRoomImage.mockImplementation(async () => ({
			binary: Buffer.from([1, 2, 3, 4]),
		}));
	});

	it("returns CORS headers on 400 VALIDATION_ERROR", async () => {
		const req = new Request("http://localhost/", {
			method: "POST",
			body: new FormData(), // no product_id or room_image
		});
		const res = await visualizeRoute.fetch(req);
		expect(res.status).toBe(400);
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
			"https://inanctekstil.store",
		);
		const body = (await res.json()) as {
			success: false;
			error: { code: string };
		};
		expect(body.error.code).toBe("VALIDATION_ERROR");
	});

	it("returns CORS headers on 404 PRODUCT_NOT_FOUND", async () => {
		mockGetProductData.mockImplementation(async () => null as unknown as import("../src/lib/shopify.ts").ProductData);

		const req = new Request("http://localhost/", {
			method: "POST",
			body: makeMultipart("gid://shopify/Product/999"),
		});
		const res = await visualizeRoute.fetch(req);
		expect(res.status).toBe(404);
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
			"https://inanctekstil.store",
		);
		const body = (await res.json()) as {
			success: false;
			error: { code: string };
		};
		expect(body.error.code).toBe("PRODUCT_NOT_FOUND");
	});

	it("returns CORS headers on 502 GENERATION_FAILED", async () => {
		mockGetProductData.mockImplementation(async () => ({
			title: "Test",
			type: "BLACKOUT",
			color: "beyaz",
			imageUrl: "https://example.com/img.jpg",
			sku: "test",
			threadColors: [],
			pixelsPerCm: null,
		}));
		mockGenerateRoomImage.mockImplementation(async () => {
			throw new Error("GENERATION_FAILED");
		});

		const req = new Request("http://localhost/", {
			method: "POST",
			body: makeMultipart("gid://shopify/Product/123"),
		});
		const res = await visualizeRoute.fetch(req);
		expect(res.status).toBe(502);
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
			"https://inanctekstil.store",
		);
		const body = (await res.json()) as {
			success: false;
			error: { code: string };
		};
		expect(body.error.code).toBe("GENERATION_FAILED");
	});

	it("returns image/jpeg binary with custom headers on success", async () => {
		mockGetProductData.mockImplementation(async () => ({
			title: "HAVUZ Blackout Perde",
			type: "BLACKOUT",
			color: "beyaz",
			imageUrl: "https://cdn.shopify.com/havuz.jpg",
			sku: "blk-havuz",
			threadColors: ["#0e101e"],
			pixelsPerCm: 42.3,
		}));
		mockGenerateRoomImage.mockImplementation(async () => ({
			binary: Buffer.from([10, 20, 30]),
		}));

		const req = new Request("http://localhost/", {
			method: "POST",
			body: makeMultipart("gid://shopify/Product/123"),
		});
		const res = await visualizeRoute.fetch(req);
		expect(res.status).toBe(200);
		const ct = res.headers.get("Content-Type") ?? "";
		expect(["image/jpeg", "image/png"]).toContain(ct);
		expect(res.headers.get("X-Product-Title")).toBe(
			encodeURIComponent("HAVUZ Blackout Perde"),
		);
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
			"https://inanctekstil.store",
		);
	});

	it("rejects invalid file type with VALIDATION_ERROR", async () => {
		const fd = new FormData();
		fd.append("product_id", "gid://shopify/Product/123");
		const file = new File([Buffer.from("gif-data")], "room.gif", {
			type: "image/gif",
		});
		fd.append("room_image", file);

		const req = new Request("http://localhost/", { method: "POST", body: fd });
		const res = await visualizeRoute.fetch(req);
		expect(res.status).toBe(400);
		const body = (await res.json()) as { error: { code: string } };
		expect(body.error.code).toBe("VALIDATION_ERROR");
	});

	it("OPTIONS preflight returns 204 with CORS headers", async () => {
		const req = new Request("http://localhost/", { method: "OPTIONS" });
		const res = await visualizeRoute.fetch(req);
		expect(res.status).toBe(204);
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
			"https://inanctekstil.store",
		);
		expect(res.headers.get("Access-Control-Allow-Methods")).toContain("POST");
	});

	it("rejects whitespace-only product_id with VALIDATION_ERROR", async () => {
		const fd = new FormData();
		fd.append("product_id", "   ");
		const file = new File([Buffer.from("img")], "room.jpg", {
			type: "image/jpeg",
		});
		fd.append("room_image", file);

		const req = new Request("http://localhost/", { method: "POST", body: fd });
		const res = await visualizeRoute.fetch(req);
		expect(res.status).toBe(400);
		const body = (await res.json()) as { error: { code: string } };
		expect(body.error.code).toBe("VALIDATION_ERROR");
	});

	it("rejects missing room_image with VALIDATION_ERROR", async () => {
		const fd = new FormData();
		fd.append("product_id", "gid://shopify/Product/123");
		// no room_image

		const req = new Request("http://localhost/", { method: "POST", body: fd });
		const res = await visualizeRoute.fetch(req);
		expect(res.status).toBe(400);
		const body = (await res.json()) as { error: { code: string } };
		expect(body.error.code).toBe("VALIDATION_ERROR");
	});

	it("rejects image over 10MB with VALIDATION_ERROR", async () => {
		const fd = new FormData();
		fd.append("product_id", "gid://shopify/Product/123");
		// 10MB + 1 byte
		const bigBuffer = Buffer.alloc(10 * 1024 * 1024 + 1, 0);
		const file = new File([bigBuffer], "big.jpg", { type: "image/jpeg" });
		fd.append("room_image", file);

		const req = new Request("http://localhost/", { method: "POST", body: fd });
		const res = await visualizeRoute.fetch(req);
		expect(res.status).toBe(400);
		const body = (await res.json()) as { error: { code: string } };
		expect(body.error.code).toBe("VALIDATION_ERROR");
	});

	it("percent-encodes Turkish chars in X-Product-Title header", async () => {
		mockGetProductData.mockImplementation(async () => ({
			title: "İpek Tül Perde – Şeffaf",
			type: "TUL",
			color: "beyaz",
			imageUrl: "https://cdn.shopify.com/test.jpg",
			sku: "tul-test",
			threadColors: [],
			pixelsPerCm: null,
		}));
		mockGenerateRoomImage.mockImplementation(async () => ({
			binary: Buffer.from([1, 2, 3]),
		}));

		const req = new Request("http://localhost/", {
			method: "POST",
			body: makeMultipart("gid://shopify/Product/123"),
		});
		const res = await visualizeRoute.fetch(req);
		expect(res.status).toBe(200);
		const header = res.headers.get("X-Product-Title") ?? "";
		// Must be percent-encoded (no raw non-ASCII)
		expect(header).toBe(encodeURIComponent("İpek Tül Perde – Şeffaf"));
		expect(decodeURIComponent(header)).toBe("İpek Tül Perde – Şeffaf");
	});

	it("rate limiter returns 429 on 6th request from same IP", async () => {
		mockGetProductData.mockImplementation(async () => ({
			title: "Test",
			type: "TUL",
			color: "beyaz",
			imageUrl: "https://cdn.test.com/img.jpg",
			sku: "tul-test",
			threadColors: [],
			pixelsPerCm: null,
		}));
		mockGenerateRoomImage.mockImplementation(async () => ({
			binary: Buffer.from([1]),
		}));

		// Use a unique IP to avoid pollution from other tests
		const uniqueIp = `10.0.0.${Math.floor(Math.random() * 200) + 50}`;
		const makeReq = () =>
			new Request("http://localhost/", {
				method: "POST",
				headers: { "x-forwarded-for": uniqueIp },
				body: makeMultipart("gid://shopify/Product/123"),
			});

		// First 5 should succeed (200 or non-429)
		for (let i = 0; i < 5; i++) {
			const res = await visualizeRoute.fetch(makeReq());
			expect(res.status).not.toBe(429);
		}

		// 6th should be rate limited
		const res = await visualizeRoute.fetch(makeReq());
		expect(res.status).toBe(429);
		const body = (await res.json()) as { error: { code: string } };
		expect(body.error.code).toBe("RATE_LIMITED");
	});
});
