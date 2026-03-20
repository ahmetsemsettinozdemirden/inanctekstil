import { beforeEach, describe, expect, it, mock } from "bun:test";
import { getProductData } from "../src/lib/shopify.ts";

const mockProduct = {
	title: "HAVUZ Blackout Perde",
	variants: { nodes: [{ sku: "blk-havuz-100x200" }] },
	images: { nodes: [{ url: "https://cdn.shopify.com/havuz.jpg" }] },
	curtainType: { value: "BLACKOUT" },
	curtainColor: { value: "beyaz" },
};

beforeEach(() => {
	mock.restore();
});

describe("getProductData", () => {
	it("returns product data when product is found and PMS returns swatch", async () => {
		global.fetch = mock(async (url: string) => {
			if (String(url).includes("/admin/api")) {
				return new Response(
					JSON.stringify({ data: { product: mockProduct } }),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					},
				);
			}
			// PMS swatch URL
			return new Response(
				JSON.stringify({
					imageUrl: "https://pms.inanctekstil.store/swatch.jpg",
				}),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				},
			);
		}) as unknown as typeof fetch;

		const result = await getProductData("gid://shopify/Product/123");
		expect(result).not.toBeNull();
		expect(result?.title).toBe("HAVUZ Blackout Perde");
		expect(result?.type).toBe("BLACKOUT");
		expect(result?.color).toBe("beyaz");
		expect(result?.imageUrl).toBe("https://pms.inanctekstil.store/swatch.jpg");
		expect(result?.sku).toBe("blk-havuz-100x200");
	});

	it("falls back to Shopify image when PMS returns null", async () => {
		global.fetch = mock(async (url: string) => {
			if (String(url).includes("/admin/api")) {
				return new Response(
					JSON.stringify({ data: { product: mockProduct } }),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					},
				);
			}
			// PMS fails
			return new Response("not found", { status: 404 });
		}) as unknown as typeof fetch;

		const result = await getProductData("gid://shopify/Product/123");
		expect(result).not.toBeNull();
		expect(result?.imageUrl).toBe("https://cdn.shopify.com/havuz.jpg");
	});

	it("returns null when product not found in Shopify", async () => {
		global.fetch = mock(async (_url: string) => {
			return new Response(JSON.stringify({ data: { product: null } }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		}) as unknown as typeof fetch;

		const result = await getProductData("gid://shopify/Product/999");
		expect(result).toBeNull();
	});
});
