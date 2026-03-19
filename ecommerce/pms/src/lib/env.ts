import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve products/ directory relative to this file's location
// src/lib/env.ts → ../../.. → ecommerce/ → products/
const defaultProductsDir = path.resolve(__dirname, "../../..", "products");

export const PRODUCTS_DIR  = process.env.PRODUCTS_DIR  ?? defaultProductsDir;
export const DATABASE_URL  = process.env.DATABASE_URL  ?? "postgres://pms:pms@localhost:5432/pms";
export const PORT          = parseInt(process.env.PORT ?? "3000", 10);
export const LOG_LEVEL     = process.env.LOG_LEVEL     ?? "info";
export const NODE_ENV      = process.env.NODE_ENV      ?? "development";

/** Returns Shopify credentials — throws if env vars are missing. */
export function getShopifyConfig(): { domain: string; token: string } {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token  = process.env.SHOPIFY_ACCESS_TOKEN;
  if (!domain || !token) {
    throw new Error(
      "SHOPIFY_STORE_DOMAIN and SHOPIFY_ACCESS_TOKEN are required for Shopify operations",
    );
  }
  return { domain, token };
}

/**
 * Returns Shopify client credentials for the client_credentials OAuth flow.
 * Throws if env vars are missing.
 */
export function getShopifyClientCredentials(): { domain: string; clientId: string; clientSecret: string } {
  const domain       = process.env.SHOPIFY_STORE_DOMAIN;
  const clientId     = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  if (!domain || !clientId || !clientSecret) {
    throw new Error(
      "SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID, and SHOPIFY_CLIENT_SECRET are required",
    );
  }
  return { domain, clientId, clientSecret };
}
