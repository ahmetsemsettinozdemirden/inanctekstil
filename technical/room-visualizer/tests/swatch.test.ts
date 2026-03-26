import { describe, expect, it } from "bun:test";
import { getProductDataFromSwatch, listSkus } from "../src/lib/swatch.ts";

describe("getProductDataFromSwatch", () => {
	it("returns product data for a known SKU (BLK-073)", () => {
		const data = getProductDataFromSwatch("BLK-073");
		expect(data).not.toBeNull();
		expect(data!.sku).toBe("BLK-073");
		expect(data!.title).toBe("HERMES BLACKOUT – 5026");
		expect(data!.type).toBe("BLACKOUT");
		expect(data!.color).toBe("#3b5080");
		expect(data!.imageUrl).toContain("BLK-073");
		expect(data!.imageUrl).toContain("swatch-corrected.jpg");
	});

	it("includes thread_colors from variant meta.json", () => {
		const data = getProductDataFromSwatch("BLK-073");
		expect(data).not.toBeNull();
		expect(Array.isArray(data!.threadColors)).toBe(true);
		expect(data!.threadColors.length).toBeGreaterThan(0);
		expect(data!.threadColors[0]).toMatch(/^#[0-9a-f]{6}$/i);
		// BLK-073 (HERMES BLACKOUT) has 2 thread colors
		expect(data!.threadColors).toContain("#0e101e");
		expect(data!.threadColors).toContain("#262b40");
	});

	it("includes pixels_per_cm from design meta.json", () => {
		const data = getProductDataFromSwatch("BLK-073");
		expect(data).not.toBeNull();
		// HERMES BLACKOUT design has pixels_per_cm: 42.3
		expect(data!.pixelsPerCm).toBe(42.3);
	});

	it("returns product data for a FON SKU", () => {
		const data = getProductDataFromSwatch("FON-002");
		expect(data).not.toBeNull();
		expect(data!.sku).toBe("FON-002");
		expect(data!.type).toBe("OPAQUE");
		expect(data!.color).toMatch(/^#[0-9a-f]{6}$/i);
		expect(Array.isArray(data!.threadColors)).toBe(true);
		// ENZA design has pixels_per_cm
		expect(typeof data!.pixelsPerCm).toBe("number");
	});

	it("returns null for unknown SKU", () => {
		const data = getProductDataFromSwatch("FAKE-999");
		expect(data).toBeNull();
	});
});

describe("listSkus", () => {
	it("returns a non-empty list of SKU strings", () => {
		const skus = listSkus();
		expect(skus.length).toBeGreaterThan(200);
		expect(skus.some((s) => s.startsWith("BLK-"))).toBe(true);
		expect(skus.some((s) => s.startsWith("FON-"))).toBe(true);
	});
});
