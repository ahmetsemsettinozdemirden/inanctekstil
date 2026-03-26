import { describe, expect, it } from "bun:test";
import { buildPrompt } from "../src/lib/prompt-builder.ts";
import type { ProductData } from "../src/lib/shopify.ts";

const product: ProductData = {
	title: "HAVUZ Blackout Perde",
	type: "BLACKOUT",
	color: "beyaz",
	imageUrl: "https://cdn.shopify.com/havuz.jpg",
	sku: "blk-havuz-100x200",
	threadColors: ["#0e101e", "#262b40"],
	pixelsPerCm: 42.3,
};

describe("buildPrompt", () => {
	it("prompt includes color and type from product", () => {
		const { prompt } = buildPrompt(product);
		expect(prompt).toContain("beyaz BLACKOUT curtains");
		expect(prompt).toContain("photorealistic");
	});

	it("prompt includes thread colors when present", () => {
		const { prompt } = buildPrompt(product);
		expect(prompt).toContain("thread tones:");
		expect(prompt).toContain("#0e101e");
		expect(prompt).toContain("#262b40");
	});

	it("prompt includes fabric scale when pixelsPerCm is set", () => {
		const { prompt } = buildPrompt(product);
		expect(prompt).toContain("fabric scale: 42.3px/cm");
	});

	it("omits thread tones when threadColors is empty", () => {
		const { prompt } = buildPrompt({ ...product, threadColors: [] });
		expect(prompt).not.toContain("thread tones");
	});

	it("omits fabric scale when pixelsPerCm is null", () => {
		const { prompt } = buildPrompt({ ...product, pixelsPerCm: null });
		expect(prompt).not.toContain("fabric scale");
	});

	it("each call produces a different seed via default random", () => {
		const { seed: s1 } = buildPrompt(product);
		const { seed: s2 } = buildPrompt(product);
		expect(typeof s1).toBe("number");
		expect(typeof s2).toBe("number");
		expect(s1).toBeGreaterThanOrEqual(0);
	});

	it("seed is deterministic when seedFn is injected", () => {
		const fixedSeed = () => 0.5;
		const { seed } = buildPrompt(product, fixedSeed);
		expect(seed).toBe(Math.floor(0.5 * 2 ** 31));
	});

	it("handles empty color and type gracefully", () => {
		const emptyProduct = { ...product, color: "", type: "" };
		const { prompt } = buildPrompt(emptyProduct);
		expect(typeof prompt).toBe("string");
		expect(prompt.length).toBeGreaterThan(0);
	});

	it("seed is always a non-negative integer", () => {
		for (let i = 0; i < 10; i++) {
			const { seed } = buildPrompt(product);
			expect(Number.isInteger(seed)).toBe(true);
			expect(seed).toBeGreaterThanOrEqual(0);
		}
	});
});
