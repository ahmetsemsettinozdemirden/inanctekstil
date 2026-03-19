import { Hono } from "hono";
import { cors } from "hono/cors";
import { sql } from "./db.ts";

const VALID_PILE_ORANI = new Set([2.0, 2.5, 3.0]);
const ADMIN_API_VERSION = "2025-01";
const CART_TOKEN_RE = /^[a-zA-Z0-9-]{1,64}$/;

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
  const variantRes = await fetch(
    `https://${domain}/admin/api/${ADMIN_API_VERSION}/variants/${variantId}.json?fields=price,product`,
    { headers },
  );
  if (!variantRes.ok) {
    log("WARN", "Variant not found", { variantId, status: variantRes.status });
    return c.json({ error: "VARIANT_NOT_FOUND", message: "Ürün bulunamadı" }, 404);
  }
  const { variant } = await variantRes.json() as { variant: { price: string; product?: { title: string } } };
  const basePricePerMeter = parseFloat(variant.price);
  if (!basePricePerMeter || basePricePerMeter <= 0) {
    log("ERROR", "Invalid variant price", { variantId, price: variant.price });
    return c.json({ error: "INVALID_PRICE", message: "Ürün fiyatı alınamadı" }, 500);
  }
  const productTitle = variant.product?.title ?? "Özel Ölçü Perde";

  // Price formula: (en / 100) × pileOrani × kanatCount × basePricePerMeter
  // boy_cm is stored for cutting reference only — not part of price
  const calculatedPrice = ((en / 100) * pileOrani * kanatCount * basePricePerMeter).toFixed(2);

  log("INFO", "Upserting cart item", { cartToken, variantId, calculatedPrice });

  try {
    await sql`
      INSERT INTO cart_items
        (cart_token, variant_id, product_title, en_cm, boy_cm, pile_stili, pile_orani, kanat, kanat_count, base_price_per_meter, calculated_price)
      VALUES
        (${cartToken}, ${variantId}, ${productTitle}, ${en}, ${boy}, ${pileStili}, ${pileOrani}, ${kanat}, ${kanatCount}, ${basePricePerMeter}, ${calculatedPrice})
      ON CONFLICT (cart_token, variant_id)
      DO UPDATE SET
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

  log("INFO", "Cart item saved", { cartToken, variantId, calculatedPrice });
  return c.json({ ok: true, calculatedPrice });
});
