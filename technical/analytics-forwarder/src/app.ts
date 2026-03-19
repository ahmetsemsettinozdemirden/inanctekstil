import { timingSafeEqual } from "node:crypto";
import { Hono } from "hono";

function log(level: "INFO" | "WARN" | "ERROR", msg: string, data?: Record<string, unknown>) {
  const entry = { time: new Date().toISOString(), level, msg, ...data };
  if (level === "ERROR") console.error(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}

export { log };

/**
 * Constant-time HMAC-SHA256 verification.
 * Uses Node.js crypto.timingSafeEqual — NOT crypto.subtle.timingSafeEqual
 * (timingSafeEqual is a Node.js API, not part of Web Crypto).
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

  // Constant-time comparison via Node.js crypto module (available in Bun)
  const a = Buffer.from(computed);
  const b = Buffer.from(headerHmac);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const app = new Hono();

app.get("/health", (c) => c.json({ status: "ok" }));
