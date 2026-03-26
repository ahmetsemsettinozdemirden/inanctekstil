import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import logger from "./logger.ts";
import type { ProductData } from "./shopify.ts";

const SWATCH_DIR = join(import.meta.dir, "../../swatch-assets");

interface SwatchMeta {
	sku: string;
	design: string;
	colour_code: string;
	appearance: string | null;
	width_cm: number;
	price: string;
	transparency_pct: number;
	transparency_class: "blackout" | "opaque" | "sheer";
	pattern_repeat_cm: number | null;
	raw_colors: string[];
	thread_colors: string[];
}

interface DesignMeta {
	design: string;
	pixels_per_cm: number;
}

// Build design-name → pixels_per_cm map once at module load
const designPixelsPerCm = new Map<string, number>();
(function loadDesignMeta() {
	const designsDir = join(SWATCH_DIR, "designs");
	if (!existsSync(designsDir)) return;
	for (const entry of readdirSync(designsDir)) {
		const metaPath = join(designsDir, entry, "meta.json");
		if (!existsSync(metaPath)) continue;
		try {
			const dm = JSON.parse(readFileSync(metaPath, "utf8")) as DesignMeta;
			if (dm.design && typeof dm.pixels_per_cm === "number") {
				designPixelsPerCm.set(dm.design, dm.pixels_per_cm);
			}
		} catch {
			// skip malformed entries
		}
	}
	logger.info({ event: "design_meta_loaded", count: designPixelsPerCm.size });
})();

export function getProductDataFromSwatch(sku: string): ProductData | null {
	const metaPath = join(SWATCH_DIR, sku, "meta.json");
	if (!existsSync(metaPath)) {
		logger.warn({ event: "swatch_not_found", sku });
		return null;
	}

	let meta: SwatchMeta;
	try {
		meta = JSON.parse(readFileSync(metaPath, "utf8")) as SwatchMeta;
	} catch {
		logger.error({ event: "swatch_meta_parse_error", sku });
		return null;
	}

	const title = `${meta.design} – ${meta.colour_code}`;
	const type = meta.transparency_class.toUpperCase();
	const color = meta.raw_colors[0] ?? "";
	const threadColors = meta.thread_colors ?? [];
	const pixelsPerCm = designPixelsPerCm.get(meta.design) ?? null;

	// Prefer texture-512.jpg (tileable fabric tile) for AI reference; fall back to swatch-corrected.jpg
	const texturePath = join(SWATCH_DIR, sku, "texture-512.jpg");
	const swatchPath = join(SWATCH_DIR, sku, "swatch-corrected.jpg");
	const imageUrl = existsSync(texturePath)
		? texturePath
		: existsSync(swatchPath)
			? swatchPath
			: "";

	logger.info({
		event: "swatch_lookup",
		sku,
		design: meta.design,
		type,
		color,
		thread_colors: threadColors,
		pixels_per_cm: pixelsPerCm,
		texture_path: imageUrl || null,
	});

	return { title, type, color, imageUrl, sku, threadColors, pixelsPerCm };
}

export function listSkus(): string[] {
	if (!existsSync(SWATCH_DIR)) return [];
	return readdirSync(SWATCH_DIR).filter((entry) =>
		existsSync(join(SWATCH_DIR, entry, "meta.json")),
	);
}
