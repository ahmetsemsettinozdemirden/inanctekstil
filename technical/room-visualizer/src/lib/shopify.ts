import { config } from "../config.ts";
import logger from "./logger.ts";
import { getPmsSwatchUrl } from "./pms.ts";

export interface ProductData {
	title: string;
	type: string;
	color: string;
	imageUrl: string;
	sku: string;
}

const PRODUCT_QUERY = `
query GetProduct($id: ID!) {
  product(id: $id) {
    title
    variants(first: 1) {
      nodes {
        sku
      }
    }
    images(first: 1) {
      nodes {
        url
      }
    }
    curtainType: metafield(namespace: "curtain", key: "type") {
      value
    }
    curtainColor: metafield(namespace: "curtain", key: "color") {
      value
    }
  }
}
`;

interface ShopifyResponse {
	data?: {
		product?: {
			title: string;
			variants: { nodes: { sku: string }[] };
			images: { nodes: { url: string }[] };
			curtainType?: { value: string } | null;
			curtainColor?: { value: string } | null;
		} | null;
	};
	errors?: unknown[];
}

export async function getProductData(
	productId: string,
): Promise<ProductData | null> {
	const url = `https://${config.SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/graphql.json`;

	let res: Response;
	try {
		res = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Shopify-Access-Token": config.SHOPIFY_ACCESS_TOKEN,
			},
			body: JSON.stringify({
				query: PRODUCT_QUERY,
				variables: { id: productId },
			}),
		});
	} catch (err) {
		logger.error(
			{ event: "shopify_fetch_failed", productId, err },
			"Shopify API request failed",
		);
		return null;
	}

	if (!res.ok) {
		logger.error(
			{ event: "shopify_http_error", productId, status: res.status },
			"Shopify API error",
		);
		return null;
	}

	const body = (await res.json()) as ShopifyResponse;

	if (body.errors || !body.data?.product) {
		return null;
	}

	const product = body.data.product;
	const sku = product.variants.nodes[0]?.sku ?? "";
	const shopifyImageUrl = product.images.nodes[0]?.url ?? "";

	// Prefer PMS swatch over Shopify image
	const pmsUrl = sku ? await getPmsSwatchUrl(sku) : null;
	const imageUrl = pmsUrl ?? shopifyImageUrl;

	return {
		title: product.title,
		type: product.curtainType?.value ?? "",
		color: product.curtainColor?.value ?? "",
		imageUrl,
		sku,
	};
}
