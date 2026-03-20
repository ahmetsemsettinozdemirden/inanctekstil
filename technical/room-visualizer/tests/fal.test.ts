import { beforeEach, describe, expect, it, mock } from "bun:test";
import { setEvaluatorClient } from "../src/lib/evaluator.ts";
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

// Mock global fetch for result download
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
};

describe("generateRoomImage", () => {
	beforeEach(() => {
		mockFalSubscribe.mockClear();
		mockFalUpload.mockClear();
	});

	it("returns highest-scored binary when multiple attempts needed", async () => {
		let callCount = 0;
		const mockEval = mock(async () => {
			callCount++;
			// First attempt: bad score
			if (callCount === 1)
				return { score: 4, has_curtains: false, feedback: "poor" };
			// Second attempt: good score
			return { score: 9, has_curtains: true, feedback: "great" };
		});
		setEvaluatorClient({ evaluate: mockEval });

		const imageBuffers = [Buffer.from([10, 20, 30]), Buffer.from([40, 50, 60])];
		let fetchCallCount = 0;
		global.fetch = mock(async () => {
			const buf = imageBuffers[fetchCallCount++] ?? imageBuffers[0];
			return new Response(buf, {
				status: 200,
				headers: { "Content-Type": "image/jpeg" },
			});
		}) as unknown as typeof fetch;

		const result = await generateRoomImage(Buffer.from("room-image"), product);

		expect(result.attemptsUsed).toBe(2);
		expect(result.score).toBe(9);
		// Should return buffer from attempt 2 (highest score)
		expect(result.binary).toEqual(Buffer.from([40, 50, 60]));
	});

	it("has_curtains=false triggers retry even with decent score", async () => {
		let callCount = 0;
		const mockEval = mock(async () => {
			callCount++;
			if (callCount === 1)
				return { score: 7, has_curtains: false, feedback: "no curtains" };
			return { score: 8, has_curtains: true, feedback: "good" };
		});
		setEvaluatorClient({ evaluate: mockEval });

		global.fetch = mock(async () => {
			return new Response(Buffer.from([1, 2, 3]), {
				status: 200,
				headers: { "Content-Type": "image/jpeg" },
			});
		}) as unknown as typeof fetch;

		const result = await generateRoomImage(Buffer.from("room-image"), product);
		expect(result.attemptsUsed).toBeGreaterThanOrEqual(2);
	});

	it("stops after MAX_ATTEMPTS (3) even if all fail quality check", async () => {
		const mockEval = mock(async () => ({
			score: 3,
			has_curtains: false,
			feedback: "bad",
		}));
		setEvaluatorClient({ evaluate: mockEval });

		global.fetch = mock(async () => {
			return new Response(Buffer.from([1, 2, 3]), {
				status: 200,
				headers: { "Content-Type": "image/jpeg" },
			});
		}) as unknown as typeof fetch;

		const result = await generateRoomImage(Buffer.from("room-image"), product);

		// Should still return the best result from 3 attempts
		expect(result.attemptsUsed).toBe(3);
		expect(mockFalSubscribe).toHaveBeenCalledTimes(3);
	});
});
