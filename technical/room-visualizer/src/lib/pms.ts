import logger from "./logger.ts";

export async function getPmsSwatchUrl(sku: string): Promise<string | null> {
	try {
		const url = `http://pms.inanctekstil.store/api/products/${encodeURIComponent(sku)}/swatch`;
		const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
		if (!res.ok) return null;
		const data = (await res.json()) as { imageUrl?: string };
		if (data.imageUrl) {
			logger.info({ event: "pms_swatch_fetched", sku }, "PMS swatch fetched");
		}
		return data.imageUrl ?? null;
	} catch (err) {
		logger.warn(
			{ event: "pms_swatch_failed", sku, err },
			"PMS swatch fetch failed",
		);
		return null;
	}
}
