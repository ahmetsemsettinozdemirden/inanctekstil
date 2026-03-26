import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { ProductData } from "../src/lib/shopify.ts";

const mockFalSubscribe = mock(async () => ({
	data: { images: [{ url: "https://fal.ai/result.jpg" }] },
	requestId: "test-123",
}));

const mockFalUpload = mock(async () => "https://fal.ai/uploaded-room.jpg");

mock.module("@fal-ai/client", () => ({
	fal: {
		config: mock(() => {}),
		subscribe: mockFalSubscribe,
		storage: { upload: mockFalUpload },
	},
}));

global.fetch = mock(async (_url: string) => {
	return new Response(new Uint8Array([1, 2, 3, 4]), {
		status: 200,
		headers: { "Content-Type": "image/jpeg" },
	});
}) as unknown as typeof fetch;

const { generateRoomImage } = await import("../src/lib/fal.ts");

const product: ProductData = {
	title: "HAVUZ Blackout Perde",
	type: "BLACKOUT",
	color: "beyaz",
	imageUrl: "https://cdn.shopify.com/havuz.jpg",
	sku: "blk-havuz",
	threadColors: ["#0e101e", "#262b40"],
	pixelsPerCm: 42.3,
};

describe("generateRoomImage", () => {
	beforeEach(() => {
		mockFalSubscribe.mockReset();
		mockFalUpload.mockReset();
		mockFalSubscribe.mockImplementation(async () => ({
			data: { images: [{ url: "https://fal.ai/result.jpg" }] },
			requestId: "test-123",
		}));
		mockFalUpload.mockImplementation(
			async () => "https://fal.ai/uploaded-room.jpg",
		);
		global.fetch = mock(async (_url: string) => {
			return new Response(new Uint8Array([1, 2, 3, 4]), {
				status: 200,
				headers: { "Content-Type": "image/jpeg" },
			});
		}) as unknown as typeof fetch;
	});

	it("returns binary on success", async () => {
		global.fetch = mock(async () => {
			return new Response(Buffer.from([10, 20, 30]), {
				status: 200,
				headers: { "Content-Type": "image/jpeg" },
			});
		}) as unknown as typeof fetch;

		const result = await generateRoomImage(Buffer.from("room-image"), product);

		expect(mockFalSubscribe).toHaveBeenCalledTimes(1);
		expect(result.binary).toEqual(Buffer.from([10, 20, 30]));
	});

	it("calls fal with image_url and prompt", async () => {
		await generateRoomImage(Buffer.from("room-image"), product);

		expect(mockFalSubscribe).toHaveBeenCalledTimes(1);
		const [, callArgs] = mockFalSubscribe.mock.calls[0] as [string, { input: Record<string, unknown> }];
		expect(callArgs.input).toHaveProperty("image_urls");
		expect(callArgs.input).toHaveProperty("prompt");
		expect(callArgs.input).toHaveProperty("seed");
	});

	it("throws GENERATION_FAILED when fal returns no image URL", async () => {
		mockFalSubscribe.mockImplementation(async () => ({
			data: { images: [] },
			requestId: "empty",
		}));

		await expect(
			generateRoomImage(Buffer.from("room-image"), product),
		).rejects.toThrow("GENERATION_FAILED");
	});

	it("throws GENERATION_FAILED when fal call throws", async () => {
		mockFalSubscribe.mockImplementation(async () => {
			throw new Error("fal network error");
		});

		await expect(
			generateRoomImage(Buffer.from("room-image"), product),
		).rejects.toThrow();
	});
});
