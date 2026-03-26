/**
 * Local E2E variant selection test.
 *
 * Uses the REAL swatch lookup (no mock) and a mocked fal.ai call.
 * Verifies that sending different product_sku values produces
 * different product data and different prompts.
 *
 * Run with:
 *   bun test tests/e2e-variant.test.ts
 */

import { beforeEach, describe, expect, it, mock } from "bun:test";
import { createVisualizeRoute, resetRateLimiter } from "../src/routes/visualize.ts";
import { getProductDataFromSwatch } from "../src/lib/swatch.ts";
import type { ProductData } from "../src/lib/shopify.ts";

// Capture what productData was passed to generateRoomImage
const capturedProductData: ProductData[] = [];

const mockGenerateRoomImage = mock(async (_buf: Buffer, productData: ProductData) => {
	capturedProductData.push(productData);
	return { binary: Buffer.from([0xff, 0xd8, 0x00]) }; // fake JPEG magic bytes
});

const mockGetProductData = mock(async (_id: string) => null as ProductData | null);

// Use the REAL swatch lookup
const route = createVisualizeRoute({
	getProductDataFromSwatch,
	getProductData: mockGetProductData,
	generateRoomImage: mockGenerateRoomImage,
});

function makeRequest(sku: string): Request {
	const fd = new FormData();
	fd.append("product_id", `gid://shopify/Product/test-${sku}`);
	fd.append("product_sku", sku);
	fd.append("product_title", `Test product ${sku}`);
	fd.append("product_type", "BLACKOUT");
	fd.append("product_color", "");
	const file = new File([Buffer.from("fake-image-data")], "room.jpg", { type: "image/jpeg" });
	fd.append("room_image", file);
	return new Request("http://localhost/", { method: "POST", body: fd });
}

describe("Variant selection → swatch lookup → prompt pipeline", () => {
	beforeEach(() => {
		resetRateLimiter();
		mockGenerateRoomImage.mockClear();
		mockGetProductData.mockClear();
		capturedProductData.length = 0;
	});

	it("BLK-073 swatch lookup enriches productData with correct color and thread colors", async () => {
		const res = await route.fetch(makeRequest("BLK-073"));
		expect(res.status).toBe(200);

		expect(capturedProductData).toHaveLength(1);
		const pd = capturedProductData[0];

		// Swatch lookup should find BLK-073
		expect(pd.sku).toBe("BLK-073");
		expect(pd.type).toBe("BLACKOUT");
		// raw_colors[0] from BLK-073 meta.json
		expect(pd.color).toBe("#3b5080");
		// thread_colors from BLK-073 meta.json
		expect(pd.threadColors).toContain("#0e101e");
		expect(pd.threadColors).toContain("#262b40");
		// pixels_per_cm from HERMES BLACKOUT design meta.json
		expect(pd.pixelsPerCm).toBe(42.3);
	});

	it("FON-002 swatch lookup enriches productData with different color than BLK-073", async () => {
		const res = await route.fetch(makeRequest("FON-002"));
		expect(res.status).toBe(200);

		expect(capturedProductData).toHaveLength(1);
		const pd = capturedProductData[0];

		expect(pd.sku).toBe("FON-002");
		expect(pd.type).toBe("OPAQUE");
		// Should be a different color from BLK-073
		expect(pd.color).not.toBe("#3b5080");
		expect(pd.color).toMatch(/^#[0-9a-f]{6}$/i);
	});

	it("different SKUs produce different productData colors", async () => {
		await route.fetch(makeRequest("BLK-073"));
		resetRateLimiter();
		await route.fetch(makeRequest("FON-002"));

		expect(capturedProductData).toHaveLength(2);
		const [blk, fon] = capturedProductData;

		expect(blk.color).not.toBe(fon.color);
		expect(blk.type).not.toBe(fon.type);
		expect(blk.sku).toBe("BLK-073");
		expect(fon.sku).toBe("FON-002");
	});

	it("unknown SKU falls back to client-provided product_title", async () => {
		const fd = new FormData();
		fd.append("product_id", "gid://shopify/Product/test-unknown");
		fd.append("product_sku", "UNKNOWN-999");
		fd.append("product_title", "My Custom Product");
		fd.append("product_type", "OPAQUE");
		fd.append("product_color", "beyaz");
		const file = new File([Buffer.from("fake")], "room.jpg", { type: "image/jpeg" });
		fd.append("room_image", file);

		const res = await route.fetch(
			new Request("http://localhost/", { method: "POST", body: fd }),
		);
		expect(res.status).toBe(200);

		const pd = capturedProductData[0];
		// swatch not found → falls back to client fields
		expect(pd.title).toBe("My Custom Product");
		expect(pd.color).toBe("beyaz");
		expect(pd.type).toBe("OPAQUE");
	});

	it("missing product_sku with no Shopify fallback returns 404", async () => {
		const fd = new FormData();
		fd.append("product_id", "gid://shopify/Product/no-sku");
		// no product_sku, no product_title → swatch fails, client fails, Shopify returns null
		const file = new File([Buffer.from("fake")], "room.jpg", { type: "image/jpeg" });
		fd.append("room_image", file);

		mockGetProductData.mockImplementation(async () => null);

		const res = await route.fetch(
			new Request("http://localhost/", { method: "POST", body: fd }),
		);
		expect(res.status).toBe(404);
	});
});
