import { Hono } from "hono";
import { cors } from "hono/cors";
import { sql } from "./db.ts";
import { verifyShopifyHmac } from "./hmac.ts";

const VALID_PILE_ORANI = new Set([1.0, 2.5, 3.0]);
const ADMIN_API_VERSION = "2025-01";
// Shopify cart tokens are alphanumeric with optional ?key=... suffix
// e.g. "hWN9zvzqmHTRwvNxviJXoHPG?key=c8b76dc5c0984b5e472c32826d665c3a"
const CART_TOKEN_RE = /^[a-zA-Z0-9\-_?=]{1,128}$/;

// In-memory rate limiter: max 10 requests per minute per IP for /api/checkout/complete
export const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

function getEnv() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  if (!domain || !clientId || !clientSecret) {
    throw new Error("SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID, and SHOPIFY_CLIENT_SECRET are required");
  }
  return { domain, clientId, clientSecret };
}

function log(level: "DEBUG" | "INFO" | "WARN" | "ERROR", msg: string, data?: Record<string, unknown>) {
  const entry = { time: new Date().toISOString(), level, msg, ...data };
  if (level === "ERROR") {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const app = new Hono();

app.use("*", cors({ origin: "https://inanctekstil.store" }));

// Request logger
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  log("INFO", "request", {
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    ms: Date.now() - start,
  });
});

app.get("/health", (c) =>
  c.json({ status: "ok", uptime: Math.floor(process.uptime()) }),
);

// ---------------------------------------------------------------------------
// POST /api/checkout/item
// ---------------------------------------------------------------------------

interface CartItemBody {
  cartToken: string;
  variantId: number;
  en: number;
  boy: number;
  pileStili: string;
  pileOrani: number;
  kanat: string;
  kanatCount: number;
}

app.post("/api/checkout/item", async (c) => {
  let body: CartItemBody;
  try {
    body = await c.req.json<CartItemBody>();
  } catch {
    return c.json({ error: "INVALID_INPUT", message: "Geçersiz istek gövdesi" }, 400);
  }

  const { cartToken, variantId, en, boy, pileStili, pileOrani, kanat, kanatCount } = body;

  // Validate cartToken
  if (!cartToken || cartToken === "") {
    return c.json({ error: "MISSING_CART_TOKEN", message: "Sepet tokeni gereklidir" }, 400);
  }
  if (!CART_TOKEN_RE.test(cartToken)) {
    return c.json({ error: "INVALID_INPUT", message: "Geçersiz sepet tokeni" }, 400);
  }

  log("INFO", "Cart item request received", { cartToken, variantId, en, boy, pileStili, pileOrani, kanat, kanatCount });

  if (!variantId || typeof variantId !== "number") {
    return c.json({ error: "INVALID_INPUT", message: "Geçersiz ürün" }, 400);
  }
  if (!en || en < 50 || en > 1000) {
    return c.json({ error: "INVALID_INPUT", message: "En 50–1000 cm arasında olmalıdır" }, 400);
  }
  if (!boy || boy < 1 || boy > 600) {
    return c.json({ error: "INVALID_INPUT", message: "Boy 1–600 cm arasında olmalıdır" }, 400);
  }
  if (!VALID_PILE_ORANI.has(pileOrani)) {
    return c.json({ error: "INVALID_INPUT", message: "Geçersiz pile oranı" }, 400);
  }
  if (kanatCount !== 1 && kanatCount !== 2) {
    return c.json({ error: "INVALID_INPUT", message: "Kanat sayısı 1 veya 2 olmalıdır" }, 400);
  }

  const { domain, clientId, clientSecret } = getEnv();

  // Obtain short-lived access token via client_credentials flow
  const tokenRes = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!tokenRes.ok) {
    log("ERROR", "Shopify auth failed", { domain, status: tokenRes.status });
    return c.json({ error: "AUTH_FAILED", message: "Kimlik doğrulama başarısız" }, 500);
  }
  const { access_token: token } = await tokenRes.json() as { access_token: string };
  const headers = { "X-Shopify-Access-Token": token, "Content-Type": "application/json" };

  // Fetch variant price server-side (never trust client-sent price)
  // Fetch full variant object (no ?fields= filter) to ensure product_id is always present
  log("DEBUG", "Fetching variant", { variantId });
  const variantRes = await fetch(
    `https://${domain}/admin/api/${ADMIN_API_VERSION}/variants/${variantId}.json`,
    { headers },
  );
  if (!variantRes.ok) {
    log("WARN", "Variant not found", { variantId, status: variantRes.status });
    return c.json({ error: "VARIANT_NOT_FOUND", message: "Ürün bulunamadı" }, 404);
  }
  const { variant } = await variantRes.json() as { variant: { price: string; product_id: number } };
  log("DEBUG", "Variant fetched", { variantId, price: variant.price, productId: variant.product_id });

  const basePricePerMeter = parseFloat(variant.price);
  if (!basePricePerMeter || basePricePerMeter <= 0) {
    log("ERROR", "Invalid variant price", { variantId, price: variant.price });
    return c.json({ error: "INVALID_PRICE", message: "Ürün fiyatı alınamadı" }, 500);
  }

  // Fetch product title (variants only carry product_id, not title)
  let productTitle = "Özel Ölçü Perde";
  const productRes = await fetch(
    `https://${domain}/admin/api/${ADMIN_API_VERSION}/products/${variant.product_id}.json?fields=id,title`,
    { headers },
  );
  if (productRes.ok) {
    const { product } = await productRes.json() as { product: { title: string } };
    productTitle = product?.title ?? "Özel Ölçü Perde";
    log("INFO", "Product title fetched", { productId: variant.product_id, productTitle });
  } else {
    log("WARN", "Product title fetch failed, using fallback", { productId: variant.product_id, status: productRes.status });
  }

  // Price formula: (en / 100) × pileOrani × kanatCount × basePricePerMeter
  // boy_cm is stored for cutting reference only — not part of price
  const calculatedPrice = ((en / 100) * pileOrani * kanatCount * basePricePerMeter).toFixed(2);
  const productId = variant.product_id;

  log("INFO", "Upserting cart item", { cartToken, variantId, productId, productTitle, calculatedPrice });

  try {
    await sql`
      INSERT INTO cart_items
        (cart_token, variant_id, product_id, product_title, en_cm, boy_cm, pile_stili, pile_orani, kanat, kanat_count, base_price_per_meter, calculated_price)
      VALUES
        (${cartToken}, ${variantId}, ${productId}, ${productTitle}, ${en}, ${boy}, ${pileStili}, ${pileOrani}, ${kanat}, ${kanatCount}, ${basePricePerMeter}, ${calculatedPrice})
      ON CONFLICT (cart_token, variant_id)
      DO UPDATE SET
        product_id = EXCLUDED.product_id,
        product_title = EXCLUDED.product_title,
        en_cm = EXCLUDED.en_cm,
        boy_cm = EXCLUDED.boy_cm,
        pile_stili = EXCLUDED.pile_stili,
        pile_orani = EXCLUDED.pile_orani,
        kanat = EXCLUDED.kanat,
        kanat_count = EXCLUDED.kanat_count,
        base_price_per_meter = EXCLUDED.base_price_per_meter,
        calculated_price = EXCLUDED.calculated_price,
        created_at = NOW()
    `;
  } catch (err) {
    log("ERROR", "DB upsert failed", { cartToken, variantId, err: String(err) });
    return c.json({ error: "DB_ERROR", message: "Veritabanı hatası" }, 500);
  }

  log("INFO", "Cart item saved", { cartToken, variantId, productId, productTitle, calculatedPrice });
  return c.json({ ok: true, calculatedPrice });
});

// ---------------------------------------------------------------------------
// POST /api/checkout/complete
// ---------------------------------------------------------------------------

interface CartItemRow {
  product_title: string;
  variant_id: string;
  product_id: string | null;
  en_cm: number;
  boy_cm: number;
  pile_stili: string;
  pile_orani: string;
  kanat: string;
  kanat_count: number;
  calculated_price: string;
}

app.post("/api/checkout/complete", async (c) => {
  // Rate limiting per IP
  const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    log("WARN", "Rate limit exceeded", { ip });
    return c.json({ error: "RATE_LIMITED", message: "Çok fazla istek. Lütfen bir dakika bekleyin." }, 429);
  }

  let body: { cartToken?: string };
  try {
    body = await c.req.json<{ cartToken?: string }>();
  } catch {
    return c.json({ error: "MISSING_CART_TOKEN", message: "Sepet tokeni gereklidir" }, 400);
  }

  const { cartToken } = body;

  if (!cartToken || cartToken === "") {
    return c.json({ error: "MISSING_CART_TOKEN", message: "Sepet tokeni gereklidir" }, 400);
  }
  if (!CART_TOKEN_RE.test(cartToken)) {
    return c.json({ error: "MISSING_CART_TOKEN", message: "Geçersiz sepet tokeni" }, 400);
  }

  log("INFO", "Checkout complete request", { cartToken });

  // Guard: return existing pending draft order if one already exists.
  // Prevents duplicate draft orders when user clicks checkout multiple times.
  let pendingRows: Array<{ shopify_draft_order_id: number; invoice_url: string; status: string }>;
  try {
    pendingRows = await sql<typeof pendingRows>`
      SELECT shopify_draft_order_id, invoice_url, status
      FROM draft_orders
      WHERE cart_token = ${cartToken} AND status = 'pending'
      LIMIT 1
    `;
  } catch (err) {
    log("ERROR", "DB pending draft order check failed", { cartToken, err: String(err) });
    return c.json({ error: "DB_ERROR", message: "Veritabanı hatası" }, 500);
  }

  if (pendingRows.length > 0) {
    log("INFO", "Returning existing pending draft order", {
      cartToken,
      draftOrderId: pendingRows[0].shopify_draft_order_id,
    });
    return c.json({ checkoutUrl: pendingRows[0].invoice_url });
  }

  // Read all cart items for this token
  let rows: CartItemRow[];
  try {
    rows = await sql<CartItemRow[]>`
      SELECT product_title, variant_id, product_id, en_cm, boy_cm, pile_stili, pile_orani, kanat, kanat_count, calculated_price
      FROM cart_items
      WHERE cart_token = ${cartToken}
    `;
  } catch (err) {
    log("ERROR", "DB read failed", { cartToken, err: String(err) });
    return c.json({ error: "DB_ERROR", message: "Veritabanı hatası" }, 500);
  }

  if (rows.length === 0) {
    log("INFO", "No items found for cart token", { cartToken });
    return c.json({ error: "NO_ITEMS", message: "Sepette yapılandırılmış ürün bulunamadı" }, 404);
  }
  log("INFO", "Cart items found", { cartToken, count: rows.length, prices: rows.map((r) => r.calculated_price) });

  const { domain, clientId, clientSecret } = getEnv();

  // Obtain short-lived access token
  const tokenRes = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!tokenRes.ok) {
    log("ERROR", "Shopify auth failed", { domain, status: tokenRes.status });
    return c.json({ error: "AUTH_FAILED", message: "Kimlik doğrulama başarısız" }, 500);
  }
  const { access_token: token } = await tokenRes.json() as { access_token: string };
  const shopifyHeaders = { "X-Shopify-Access-Token": token, "Content-Type": "application/json" };

  // Build draft order line items from all cart rows.
  // title and price override the variant defaults so configured dimensions and
  // calculated price are honoured even though the variant has a different base price.
  const lineItems = rows.map((row) => ({
    title: row.product_title,
    quantity: 1,
    price: row.calculated_price,
    requires_shipping: true,
    taxable: true,
    properties: [
      { name: "En", value: `${row.en_cm} cm` },
      { name: "Boy", value: `${row.boy_cm} cm` },
      { name: "Pile Stili", value: `${row.pile_stili} (x${row.pile_orani})` },
      { name: "Kanat", value: row.kanat },
    ],
  }));

  // Order note: one line per item so the admin sees what was configured
  const note = rows
    .map((row) => `${row.product_title}: ${row.en_cm}cm × ${row.pile_stili} (x${row.pile_orani}) × ${row.kanat}`)
    .join("\n");

  log("INFO", "Creating draft order", { cartToken, itemCount: rows.length, note });

  const draftRes = await fetch(
    `https://${domain}/admin/api/${ADMIN_API_VERSION}/draft_orders.json`,
    {
      method: "POST",
      headers: shopifyHeaders,
      body: JSON.stringify({
        draft_order: {
          line_items: lineItems,
          note,
          // Embeds cart_token so the orders/paid webhook can find these cart_items
          note_attributes: [{ name: "cart_token", value: cartToken }],
        },
      }),
    },
  );

  if (!draftRes.ok) {
    const errBody = await draftRes.text();
    log("ERROR", "Draft order creation failed", { status: draftRes.status, cartToken, body: errBody });
    return c.json({ error: "DRAFT_ORDER_FAILED", message: "Sipariş oluşturulamadı. Lütfen tekrar deneyin." }, 500);
  }

  const { draft_order } = await draftRes.json() as { draft_order: { id: number; invoice_url: string } };
  log("INFO", "Draft order created", { draftOrderId: draft_order.id, cartToken, checkoutUrl: draft_order.invoice_url });

  // Save draft order record — cart_items are NOT deleted here.
  // The orders/paid webhook deletes cart_items after confirmed payment.
  try {
    await sql`
      INSERT INTO draft_orders (cart_token, shopify_draft_order_id, invoice_url)
      VALUES (${cartToken}, ${draft_order.id}, ${draft_order.invoice_url})
    `;
  } catch (err) {
    // Log but don't fail — cart_items TTL will clean up orphaned rows after 7 days
    log("WARN", "DB insert draft_orders failed", { cartToken, draftOrderId: draft_order.id, err: String(err) });
  }

  return c.json({ checkoutUrl: draft_order.invoice_url });
});

// ---------------------------------------------------------------------------
// POST /api/webhooks/orders/paid
// ---------------------------------------------------------------------------

interface ShopifyOrderWebhook {
  id: number;
  order_number: number;
  source_name?: string;
  note_attributes?: Array<{ name: string; value: string }>;
}

app.post("/api/webhooks/orders/paid", async (c) => {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    log("ERROR", "SHOPIFY_WEBHOOK_SECRET not set");
    return c.json({ error: "CONFIG_ERROR" }, 500);
  }

  const headerHmac = c.req.header("x-shopify-hmac-sha256") ?? "";
  // Read raw body as text BEFORE any JSON parse — HMAC is computed over raw bytes
  const rawBody = await c.req.text();

  const valid = await verifyShopifyHmac(secret, rawBody, headerHmac);
  if (!valid) {
    log("WARN", "Webhook HMAC invalid — rejected");
    return c.json({ error: "UNAUTHORIZED" }, 401);
  }

  let order: ShopifyOrderWebhook;
  try {
    order = JSON.parse(rawBody) as ShopifyOrderWebhook;
  } catch {
    log("WARN", "Webhook body is not valid JSON");
    // Return 200 anyway — malformed payload won't get better on retry
    return c.json({ ok: true });
  }

  const cartTokenAttr = order.note_attributes?.find((a) => a.name === "cart_token");
  if (!cartTokenAttr) {
    // Not a curtain draft order — ignore silently
    log("INFO", "Webhook: no cart_token in note_attributes, skipping", { orderId: order.id });
    return c.json({ ok: true });
  }

  const cartToken = cartTokenAttr.value;
  log("INFO", "Webhook: order paid, cleaning up cart", { orderId: order.id, cartToken });

  try {
    await sql`DELETE FROM cart_items WHERE cart_token = ${cartToken}`;
    await sql`UPDATE draft_orders SET status = 'paid' WHERE cart_token = ${cartToken} AND status = 'pending'`;
    log("INFO", "Webhook: cart cleanup complete", { cartToken });
  } catch (err) {
    // Log but return 200 — a failed cleanup is not worth a Shopify retry storm
    log("ERROR", "Webhook: DB cleanup failed", { cartToken, err: String(err) });
  }

  // Always 200 — non-200 causes Shopify to retry up to 19 times over 48h
  return c.json({ ok: true });
});
