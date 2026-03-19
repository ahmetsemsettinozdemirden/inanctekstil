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

interface ShopifyLineItem {
  title: string;
  price: string;
  quantity: number;
  product_id: number;
  variant_id: number;
}

interface ShopifyOrder {
  id: number;
  order_number: number;
  created_at: string;
  total_price: string;
  currency: string;
  customer?: { email?: string } | null;
  line_items: ShopifyLineItem[];
}

app.post("/webhooks/shopify/orders-paid", async (c) => {
  const headerHmac = c.req.header("x-shopify-hmac-sha256") ?? "";
  const rawBody = await c.req.text();

  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    log("ERROR", "SHOPIFY_WEBHOOK_SECRET not set");
    return c.json({ error: "CONFIG_ERROR" }, 500);
  }

  const valid = await verifyShopifyHmac(secret, rawBody, headerHmac);
  if (!valid) {
    log("WARN", "Invalid webhook HMAC — rejected");
    return c.json({ error: "UNAUTHORIZED" }, 401);
  }

  let order: ShopifyOrder;
  try {
    order = JSON.parse(rawBody) as ShopifyOrder;
  } catch {
    log("WARN", "Webhook body is not valid JSON");
    return c.json({ error: "INVALID_JSON" }, 400);
  }

  const distinctId = order.customer?.email ?? `shopify_order_${order.id}`;

  try {
    const posthogRes = await fetch("https://eu.i.posthog.com/capture/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.POSTHOG_API_KEY,
        event: "order_completed",
        distinct_id: distinctId,
        timestamp: order.created_at,
        properties: {
          order_id: String(order.id),
          order_number: order.order_number,
          order_total: parseFloat(order.total_price),
          currency: order.currency,
          item_count: order.line_items.length,
          items: order.line_items.map((item) => ({
            name: item.title,
            price: parseFloat(item.price),
            quantity: item.quantity,
            product_id: String(item.product_id),
            variant_id: String(item.variant_id),
          })),
          $source: "shopify_webhook",
        },
      }),
    });

    if (!posthogRes.ok) {
      log("ERROR", "PostHog capture returned non-2xx", { status: posthogRes.status, orderId: order.id });
    } else {
      log("INFO", "order_completed captured", { orderId: order.id, distinctId });
    }
  } catch (err) {
    // Network failure — log and continue. Must still return 200 to Shopify.
    log("ERROR", "PostHog capture threw", { orderId: order.id, err: String(err) });
  }

  // Always 200 — non-200 causes Shopify to retry up to 19 times over 48h
  return c.json({ ok: true });
});
