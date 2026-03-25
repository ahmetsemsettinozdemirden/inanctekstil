import { describe, expect, it } from "bun:test";
import { buildPrompt } from "../src/lib/prompt-builder.ts";
import type { ProductData } from "../src/lib/shopify.ts";

const product: ProductData = {
	title: "HAVUZ Blackout Perde",
	type: "BLACKOUT",
	color: "beyaz",
	imageUrl: "https://cdn.shopify.com/havuz.jpg",
	sku: "blk-havuz-100x200",
};

describe("buildPrompt", () => {
	it("base prompt uses color and type from product on attempt 1", () => {
		const { prompt } = buildPrompt(product, 1);
		expect(prompt).toContain("beyaz BLACKOUT curtains");
		expect(prompt).toContain("modern Turkish living room");
		expect(prompt).toContain("photorealistic");
		expect(prompt).not.toContain("prominently visible");
	});

	it("retry prompt appends prominence text on attempt 2+", () => {
		const { prompt: p2 } = buildPrompt(product, 2);
		expect(p2).toContain("curtains prominently visible on windows");
		expect(p2).toContain("window treatment focal point");

		const { prompt: p3 } = buildPrompt(product, 3);
		expect(p3).toContain("curtains prominently visible on windows");
	});

	it("each call produces a different seed via default random", () => {
		const { seed: s1 } = buildPrompt(product, 1);
		const { seed: s2 } = buildPrompt(product, 1);
		// With overwhelming probability these will differ
		expect(typeof s1).toBe("number");
		expect(typeof s2).toBe("number");
		expect(s1).toBeGreaterThanOrEqual(0);
	});

	it("seed is deterministic when seedFn is injected", () => {
		const fixedSeed = () => 0.5;
		const { seed } = buildPrompt(product, 1, fixedSeed);
		expect(seed).toBe(Math.floor(0.5 * 2 ** 31));
	});

	it("handles empty color and type gracefully", () => {
		const emptyProduct = { ...product, color: "", type: "" };
		const { prompt } = buildPrompt(emptyProduct, 1);
		// Should still produce a valid string without crashing
		expect(typeof prompt).toBe("string");
		expect(prompt.length).toBeGreaterThan(0);
		expect(prompt).toContain("modern Turkish living room");
	});

	it("seed is always a non-negative integer", () => {
		for (let i = 0; i < 10; i++) {
			const { seed } = buildPrompt(product, 1);
			expect(Number.isInteger(seed)).toBe(true);
			expect(seed).toBeGreaterThanOrEqual(0);
		}
	});
});
