import { beforeEach, describe, expect, it, mock } from "bun:test";

const mockGenerateRoomImage = mock(async () => ({
	binary: Buffer.from([1, 2, 3, 4]),
	score: 8,
	attemptsUsed: 1,
}));

const mockGetProductData = mock(async (_id: string) => ({
	title: "HAVUZ Blackout Perde",
	type: "BLACKOUT",
	color: "beyaz",
	imageUrl: "https://cdn.shopify.com/havuz.jpg",
	sku: "blk-havuz",
}));

mock.module("../src/lib/fal.ts", () => ({
	generateRoomImage: mockGenerateRoomImage,
}));

mock.module("../src/lib/shopify.ts", () => ({
	getProductData: mockGetProductData,
}));

const { visualizeRoute } = await import("../src/routes/visualize.ts");

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
		mockGenerateRoomImage.mockClear();
		mockGetProductData.mockClear();
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
		mockGetProductData.mockImplementation(
			async () =>
				null as unknown as {
					title: string;
					type: string;
					color: string;
					imageUrl: string;
					sku: string;
				},
		);

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
		}));
		mockGenerateRoomImage.mockImplementation(async () => ({
			binary: Buffer.from([10, 20, 30]),
			score: 9,
			attemptsUsed: 2,
		}));

		const req = new Request("http://localhost/", {
			method: "POST",
			body: makeMultipart("gid://shopify/Product/123"),
		});
		const res = await visualizeRoute.fetch(req);
		expect(res.status).toBe(200);
		expect(res.headers.get("Content-Type")).toBe("image/jpeg");
		expect(res.headers.get("X-Attempts-Used")).toBe("2");
		expect(res.headers.get("X-Final-Score")).toBe("9");
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
});
