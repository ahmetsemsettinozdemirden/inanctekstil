import { Hono } from "hono";
import { getShopifyClientCredentials } from "../lib/env.ts";
import { logger } from "../lib/logger.ts";

export const checkoutRouter = new Hono();

const VALID_PILE_ORANI = new Set([2.0, 2.5, 3.0]);
const ADMIN_API_VERSION = "2024-01";

interface DraftOrderBody {
  variantId: number;
  productTitle: string;
  en: number;
  boy: number;
  pileStili: string;
  pileOrani: number;
  kanat: string;
  kanatCount: number;
}

/**
 * POST /api/checkout/draft-order
 *
 * Creates a Shopify Draft Order with the server-calculated curtain price
 * and returns the invoice URL for the customer to complete checkout.
 *
 * Price is ALWAYS calculated server-side from the variant's stored price —
 * the client never sends a price, preventing manipulation.
 */
checkoutRouter.post("/draft-order", async (c) => {
  let body: DraftOrderBody;
  try {
    body = await c.req.json<DraftOrderBody>();
  } catch {
    return c.json({ error: "INVALID_INPUT", message: "Geçersiz istek gövdesi" }, 400);
  }

  const { variantId, productTitle, en, boy, pileStili, pileOrani, kanat, kanatCount } = body;

  // Validate inputs
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

  const { domain, clientId, clientSecret } = getShopifyClientCredentials();

  // Fetch a short-lived access token via client_credentials flow (valid 24h)
  const tokenRes = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret }),
  });
  if (!tokenRes.ok) {
    logger.error({ status: tokenRes.status }, "Failed to obtain Shopify access token");
    return c.json({ error: "AUTH_FAILED", message: "Kimlik doğrulama başarısız" }, 500);
  }
  const { access_token: token } = await tokenRes.json() as { access_token: string };
  const headers = { "X-Shopify-Access-Token": token, "Content-Type": "application/json" };

  // Fetch variant price from Shopify (server-side — never trust client-sent price)
  const variantRes = await fetch(
    `https://${domain}/admin/api/${ADMIN_API_VERSION}/variants/${variantId}.json`,
    { headers },
  );
  if (!variantRes.ok) {
    logger.warn({ variantId, status: variantRes.status }, "Variant not found");
    return c.json({ error: "VARIANT_NOT_FOUND", message: "Ürün bulunamadı" }, 404);
  }
  const { variant } = await variantRes.json() as { variant: { price: string; title: string } };
  const basePricePerMeter = parseFloat(variant.price);
  if (!basePricePerMeter || basePricePerMeter <= 0) {
    return c.json({ error: "INVALID_PRICE", message: "Ürün fiyatı alınamadı" }, 500);
  }

  // Calculate price server-side
  const calculatedPrice = ((en / 100) * pileOrani * kanatCount * basePricePerMeter).toFixed(2);

  logger.info(
    { variantId, en, boy, pileOrani, kanatCount, basePricePerMeter, calculatedPrice },
    "Creating draft order",
  );

  // Create Draft Order via Shopify Admin REST API
  const draftRes = await fetch(
    `https://${domain}/admin/api/${ADMIN_API_VERSION}/draft_orders.json`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        draft_order: {
          line_items: [
            {
              title: productTitle || "Özel Ölçü Perde",
              price: calculatedPrice,
              quantity: 1,
              requires_shipping: true,
              taxable: true,
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
      }),
    },
  );

  if (!draftRes.ok) {
    const errBody = await draftRes.text();
    logger.error({ status: draftRes.status, body: errBody }, "Draft order creation failed");
    return c.json({ error: "DRAFT_ORDER_FAILED", message: "Sipariş oluşturulamadı. Lütfen tekrar deneyin." }, 500);
  }

  const { draft_order } = await draftRes.json() as { draft_order: { id: number; invoice_url: string } };
  logger.info({ draftOrderId: draft_order.id, calculatedPrice }, "Draft order created");

  return c.json({ checkoutUrl: draft_order.invoice_url });
});
