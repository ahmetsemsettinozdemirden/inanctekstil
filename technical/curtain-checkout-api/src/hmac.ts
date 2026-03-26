import { timingSafeEqual } from "node:crypto";

/**
 * Verify Shopify webhook HMAC-SHA256 signature.
 * Uses node:crypto timingSafeEqual — NOT crypto.subtle.timingSafeEqual.
 */
export async function verifyShopifyHmac(
  secret: string,
  rawBody: string,
  headerHmac: string,
): Promise<boolean> {
  if (!headerHmac) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
  const a = Buffer.from(computed);
  const b = Buffer.from(headerHmac);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
