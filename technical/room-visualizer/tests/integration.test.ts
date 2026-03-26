/**
 * End-to-end integration test — hits the live visualizer service.
 * No mocks. Requires network access to visualizer.inanctekstil.store.
 *
 * Assets (tests/assets/):
 *   room-without-blackout.png — input room photo
 *   room-with-blackout.png   — reference output (HERMES BLACKOUT navy blue)
 *
 * Run with:
 *   bun test tests/integration.test.ts --timeout 120000
 *
 * Output saved to: tests/assets/integration-result-<sku>.jpg
 */

import { describe, expect, it } from "bun:test";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE_URL = "https://visualizer.inanctekstil.store";
const API_URL = `${BASE_URL}/api/visualize`;
const ASSETS = join(import.meta.dir, "assets");
const PRODUCT_ID = "gid://shopify/Product/integration-test";

async function visualize(sku: string): Promise<Response> {
	const imageBytes = readFileSync(join(ASSETS, "room-without-blackout.png"));
	const file = new File([imageBytes], "room-without-blackout.png", {
		type: "image/png",
	});
	const fd = new FormData();
	fd.append("product_id", PRODUCT_ID);
	fd.append("product_sku", sku);
	fd.append("room_image", file);
	return fetch(API_URL, { method: "POST", body: fd });
}

describe("E2E: POST /api/visualize", () => {
	it(
		"health endpoint is reachable",
		async () => {
			const res = await fetch(`${BASE_URL}/health`);
			expect(res.status).toBe(200);
			const body = (await res.json()) as { ok: boolean };
			expect(body.ok).toBe(true);
		},
		{ timeout: 10_000 },
	);

	it(
		"BLK-073 (HERMES BLACKOUT): swatch resolved, image returned with texture",
		async () => {
			const res = await visualize("BLK-073");

			expect(res.status).toBe(200);

			const contentType = res.headers.get("Content-Type") ?? "";
			expect(["image/jpeg", "image/png"]).toContain(contentType);

			const productTitle = decodeURIComponent(res.headers.get("X-Product-Title") ?? "");
			expect(productTitle).toContain("HERMES");

			const binary = Buffer.from(await res.arrayBuffer());
			expect(binary.length).toBeGreaterThan(10_000);

			const isJpeg = binary[0] === 0xff && binary[1] === 0xd8;
			const isPng = binary[0] === 0x89 && binary[1] === 0x50;
			expect(isJpeg || isPng).toBe(true);

			const ext = isPng ? "png" : "jpg";
			const outPath = join(ASSETS, `integration-result-BLK-073.${ext}`);
			writeFileSync(outPath, binary);
			console.log(`BLK-073 result: ${outPath} (${binary.length} bytes, ${contentType})`);
			console.log(`Title: ${productTitle}`);
		},
		{ timeout: 120_000 },
	);

	it(
		"FON-003 (ENZA): swatch resolved, image returned with texture",
		async () => {
			const res = await visualize("FON-003");

			expect(res.status).toBe(200);

			const contentType = res.headers.get("Content-Type") ?? "";
			expect(["image/jpeg", "image/png"]).toContain(contentType);

			const productTitle = decodeURIComponent(res.headers.get("X-Product-Title") ?? "");
			expect(productTitle).toContain("ENZA");

			const binary = Buffer.from(await res.arrayBuffer());
			expect(binary.length).toBeGreaterThan(10_000);

			const isJpeg = binary[0] === 0xff && binary[1] === 0xd8;
			const isPng = binary[0] === 0x89 && binary[1] === 0x50;
			expect(isJpeg || isPng).toBe(true);

			const ext = isPng ? "png" : "jpg";
			const outPath = join(ASSETS, `integration-result-FON-003.${ext}`);
			writeFileSync(outPath, binary);
			console.log(`FON-003 result: ${outPath} (${binary.length} bytes, ${contentType})`);
			console.log(`Title: ${productTitle}`);
		},
		{ timeout: 120_000 },
	);

	it(
		"unknown SKU with client fields falls back gracefully (client_fields source)",
		async () => {
			const imageBytes = readFileSync(join(ASSETS, "room-without-blackout.png"));
			const file = new File([imageBytes], "room.png", { type: "image/png" });
			const fd = new FormData();
			fd.append("product_id", PRODUCT_ID);
			fd.append("product_sku", "UNKNOWN-SKU-999");
			fd.append("product_title", "Test Perde");
			fd.append("product_type", "BLACKOUT");
			fd.append("product_color", "#1a1a2e");
			fd.append("room_image", file);

			const res = await fetch(API_URL, { method: "POST", body: fd });

			expect(res.status).toBe(200);
			const productTitle = decodeURIComponent(res.headers.get("X-Product-Title") ?? "");
			expect(productTitle).toBe("Test Perde");

			const binary = Buffer.from(await res.arrayBuffer());
			expect(binary.length).toBeGreaterThan(10_000);
			console.log(`Fallback result: ${binary.length} bytes, title: ${productTitle}`);
		},
		{ timeout: 120_000 },
	);
});
