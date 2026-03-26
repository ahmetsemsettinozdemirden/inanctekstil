import { describe, expect, it, mock } from "bun:test";

// Restore any module mocks from other test files before importing the real implementation
mock.restore();

const { getProductData } = await import("../src/lib/shopify.ts");

const mockProduct = {
	title: "HAVUZ Blackout Perde",
	variants: { nodes: [{ sku: "blk-havuz-100x200" }] },
	images: { nodes: [{ url: "https://cdn.shopify.com/havuz.jpg" }] },
	curtainType: { value: "BLACKOUT" },
	curtainColor: { value: "beyaz" },
};

describe("getProductData", () => {
	it("returns product data from Shopify", async () => {
		global.fetch = mock(async (_url: string) => {
			return new Response(
				JSON.stringify({ data: { product: mockProduct } }),
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
		expect(result?.imageUrl).toBe("https://cdn.shopify.com/havuz.jpg");
		expect(result?.sku).toBe("blk-havuz-100x200");
		// Shopify API path defaults — enriched by swatch lookup if SKU matches
		expect(result?.threadColors).toEqual([]);
		expect(result?.pixelsPerCm).toBeNull();
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

	it("returns null when Shopify returns HTTP 500", async () => {
		global.fetch = mock(async (_url: string) => {
			return new Response("Internal Server Error", { status: 500 });
		}) as unknown as typeof fetch;

		const result = await getProductData("gid://shopify/Product/123");
		expect(result).toBeNull();
	});

	it("returns null when Shopify returns GraphQL errors", async () => {
		global.fetch = mock(async (_url: string) => {
			return new Response(
				JSON.stringify({ errors: [{ message: "Access denied" }] }),
				{ status: 200, headers: { "Content-Type": "application/json" } },
			);
		}) as unknown as typeof fetch;

		const result = await getProductData("gid://shopify/Product/123");
		expect(result).toBeNull();
	});

	it("returns null when fetch throws (network error)", async () => {
		global.fetch = mock(async (_url: string) => {
			throw new Error("network error");
		}) as unknown as typeof fetch;

		const result = await getProductData("gid://shopify/Product/123");
		expect(result).toBeNull();
	});

	it("uses Shopify image when product has no SKU", async () => {
		const productNoSku = {
			...mockProduct,
			variants: { nodes: [{ sku: "" }] },
		};

		global.fetch = mock(async (_url: string) => {
			return new Response(
				JSON.stringify({ data: { product: productNoSku } }),
				{ status: 200, headers: { "Content-Type": "application/json" } },
			);
		}) as unknown as typeof fetch;

		const result = await getProductData("gid://shopify/Product/123");
		expect(result).not.toBeNull();
		expect(result?.imageUrl).toBe("https://cdn.shopify.com/havuz.jpg");
		expect(result?.sku).toBe("");
	});
});
