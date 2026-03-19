import { Hono } from "hono";
import { cors } from "hono/cors";

const VALID_PILE_ORANI = new Set([2.0, 2.5, 3.0]);
const ADMIN_API_VERSION = "2025-01";

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

app.use("*", cors({ origin: "*" }));

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

interface DraftOrderBody {
  variantId: number;
  en: number;
  boy: number;
  pileStili: string;
  pileOrani: number;
  kanat: string;
  kanatCount: number;
}

app.post("/api/checkout/draft-order", async (c) => {
  let body: DraftOrderBody;
  try {
    body = await c.req.json<DraftOrderBody>();
  } catch {
    return c.json({ error: "INVALID_INPUT", message: "Geçersiz istek gövdesi" }, 400);
  }

  const { variantId, en, boy, pileStili, pileOrani, kanat, kanatCount } = body;

  log("INFO", "Draft order request received", { variantId, en, boy, pileStili, pileOrani, kanat, kanatCount });

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

  log("INFO", "Fetching Shopify access token", { domain });

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
  log("INFO", "Shopify access token obtained");

  // Fetch variant price server-side (never trust client-sent price)
  log("INFO", "Fetching variant price", { variantId });
  const variantRes = await fetch(
    `https://${domain}/admin/api/${ADMIN_API_VERSION}/variants/${variantId}.json`,
    { headers },
  );
  if (!variantRes.ok) {
    log("WARN", "Variant not found", { variantId, status: variantRes.status });
    return c.json({ error: "VARIANT_NOT_FOUND", message: "Ürün bulunamadı" }, 404);
  }
  const { variant } = await variantRes.json() as { variant: { price: string } };
  const basePricePerMeter = parseFloat(variant.price);
  if (!basePricePerMeter || basePricePerMeter <= 0) {
    log("ERROR", "Invalid variant price", { variantId, price: variant.price });
    return c.json({ error: "INVALID_PRICE", message: "Ürün fiyatı alınamadı" }, 500);
  }
  log("INFO", "Variant price fetched", { variantId, basePricePerMeter });

  const calculatedPrice = ((en / 100) * pileOrani * kanatCount * basePricePerMeter).toFixed(2);

  log("INFO", "Creating draft order", {
    variantId,
    en,
    boy,
    pileStili,
    pileOrani,
    kanat,
    kanatCount,
    basePricePerMeter,
    calculatedPrice,
    formula: `(${en}/100) × ${pileOrani} × ${kanatCount} × ${basePricePerMeter}`,
  });

  const draftOrderPayload = {
    draft_order: {
      line_items: [
        {
          variant_id: variantId,
          quantity: 1,
          price: calculatedPrice,
          properties: [
            { name: "En", value: `${en} cm` },
            { name: "Boy", value: `${boy} cm` },
            { name: "Pile Stili", value: `${pileStili} (x${pileOrani})` },
            { name: "Kanat", value: kanat },
          ],
        },
      ],
      note: `Özel ölçü perde — En: ${en}cm, Boy: ${boy}cm, ${pileStili} x${pileOrani}, ${kanat}`,
    },
  };

  log("DEBUG", "Draft order payload", { payload: JSON.stringify(draftOrderPayload) });

  const draftRes = await fetch(
    `https://${domain}/admin/api/${ADMIN_API_VERSION}/draft_orders.json`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(draftOrderPayload),
    },
  );

  if (!draftRes.ok) {
    const errBody = await draftRes.text();
    log("ERROR", "Draft order creation failed", { status: draftRes.status, variantId, body: errBody });
    return c.json({ error: "DRAFT_ORDER_FAILED", message: "Sipariş oluşturulamadı. Lütfen tekrar deneyin." }, 500);
  }

  const { draft_order } = await draftRes.json() as { draft_order: { id: number; invoice_url: string } };
  log("INFO", "Draft order created", { draftOrderId: draft_order.id, variantId, calculatedPrice, checkoutUrl: draft_order.invoice_url });

  return c.json({ checkoutUrl: draft_order.invoice_url });
});
