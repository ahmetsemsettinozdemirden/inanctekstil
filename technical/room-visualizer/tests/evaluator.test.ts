import { beforeEach, describe, expect, it, mock } from "bun:test";
import { evaluateImage, setEvaluatorClient } from "../src/lib/evaluator.ts";

const mockEvaluate = mock(
	async (_imageBase64: string, _productName: string) => ({
		score: 8,
		has_curtains: true,
		feedback: "Great quality image with clearly visible curtains",
	}),
);

describe("evaluateImage", () => {
	beforeEach(() => {
		mockEvaluate.mockClear();
		setEvaluatorClient({ evaluate: mockEvaluate });
	});

	it("returns typed EvaluationResult from BAML client", async () => {
		const buffer = Buffer.from("fake-image-data");
		const result = await evaluateImage(buffer, "HAVUZ Blackout Perde");

		expect(result.score).toBe(8);
		expect(result.has_curtains).toBe(true);
		expect(result.feedback).toBe(
			"Great quality image with clearly visible curtains",
		);
		expect(mockEvaluate).toHaveBeenCalledTimes(1);
	});

	it("passes product name to evaluator", async () => {
		const buffer = Buffer.from("fake-image-data");
		await evaluateImage(buffer, "Test Curtain");

		const [, productName] = mockEvaluate.mock.calls[0] as [string, string];
		expect(productName).toBe("Test Curtain");
	});

	it("converts image buffer to base64 before calling evaluator", async () => {
		const buffer = Buffer.from("test-image");
		await evaluateImage(buffer, "Test");

		const [imageBase64] = mockEvaluate.mock.calls[0] as [string, string];
		expect(imageBase64).toBe(buffer.toString("base64"));
	});

	it("returns low score structure when curtains not visible", async () => {
		mockEvaluate.mockImplementation(async () => ({
			score: 3,
			has_curtains: false,
			feedback: "No curtains visible in the image",
		}));

		const result = await evaluateImage(Buffer.from("bad-image"), "Test Perde");
		expect(result.score).toBe(3);
		expect(result.has_curtains).toBe(false);
		expect(result.feedback).toBe("No curtains visible in the image");
	});

	it("score is a number between 1 and 10", async () => {
		mockEvaluate.mockImplementation(async () => ({
			score: 7,
			has_curtains: true,
			feedback: "Good",
		}));

		const result = await evaluateImage(Buffer.from("ok-image"), "Test");
		expect(result.score).toBeGreaterThanOrEqual(1);
		expect(result.score).toBeLessThanOrEqual(10);
	});
});
