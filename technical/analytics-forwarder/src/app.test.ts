import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { app, verifyShopifyHmac } from './app.ts';

// Generate a real HMAC for test vectors using Web Crypto
async function makeHmac(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

describe('verifyShopifyHmac', () => {
  const SECRET = 'test_webhook_secret';
  const BODY = '{"id":1,"total_price":"1250.00"}';

  test('returns true for a valid HMAC', async () => {
    const hmac = await makeHmac(SECRET, BODY);
    const result = await verifyShopifyHmac(SECRET, BODY, hmac);
    expect(result).toBe(true);
  });

  test('returns false for a tampered body', async () => {
    const hmac = await makeHmac(SECRET, BODY);
    const result = await verifyShopifyHmac(SECRET, BODY + 'x', hmac);
    expect(result).toBe(false);
  });

  test('returns false for a wrong secret', async () => {
    const hmac = await makeHmac('wrong_secret', BODY);
    const result = await verifyShopifyHmac(SECRET, BODY, hmac);
    expect(result).toBe(false);
  });

  test('returns false for empty hmac header', async () => {
    const result = await verifyShopifyHmac(SECRET, BODY, '');
    expect(result).toBe(false);
  });
});

describe('GET /health', () => {
  test('returns 200 with { status: "ok" }', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('ok');
  });
});

// Helper — valid Shopify order payload
const SAMPLE_ORDER = {
  id: 12345,
  order_number: 1001,
  created_at: "2026-03-19T10:00:00Z",
  total_price: "1350.00",
  currency: "TRY",
  customer: { email: "ali@example.com" },
  line_items: [
    { title: "Saten Perde", price: "1350.00", quantity: 1, product_id: 42, variant_id: 99 },
  ],
};

async function postWebhook(body: string, hmac: string) {
  return app.request('/webhooks/shopify/orders-paid', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-shopify-hmac-sha256': hmac,
    },
    body,
  });
}

describe('POST /webhooks/shopify/orders-paid', () => {
  const SECRET = 'webhook_secret_test';

  beforeEach(() => {
    process.env.SHOPIFY_WEBHOOK_SECRET = SECRET;
    process.env.POSTHOG_API_KEY = 'phc_test_key';
  });

  afterEach(() => {
    delete process.env.SHOPIFY_WEBHOOK_SECRET;
    delete process.env.POSTHOG_API_KEY;
  });

  test('returns 401 when HMAC header is missing', async () => {
    const res = await app.request('/webhooks/shopify/orders-paid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    expect(res.status).toBe(401);
  });

  test('returns 401 when HMAC is invalid', async () => {
    const body = JSON.stringify(SAMPLE_ORDER);
    const res = await postWebhook(body, 'invalid_hmac');
    expect(res.status).toBe(401);
  });

  test('returns 200 and calls PostHog with order_completed for valid webhook', async () => {
    const posthogCalls: RequestInit[] = [];
    globalThis.fetch = ((_url: string, init?: RequestInit) => {
      posthogCalls.push(init!);
      return Promise.resolve(new Response('{}', { status: 200 }));
    }) as unknown as typeof fetch;

    const body = JSON.stringify(SAMPLE_ORDER);
    const hmac = await makeHmac(SECRET, body);
    const res = await postWebhook(body, hmac);

    expect(res.status).toBe(200);
    expect(posthogCalls.length).toBe(1);

    const payload = JSON.parse(posthogCalls[0].body as string) as {
      event: string;
      distinct_id: string;
      properties: { order_id: string; order_total: number; currency: string };
    };
    expect(payload.event).toBe('order_completed');
    expect(payload.distinct_id).toBe('ali@example.com');
    expect(payload.properties.order_id).toBe('12345');
    expect(payload.properties.order_total).toBe(1350.0);
    expect(payload.properties.currency).toBe('TRY');
  });

  test('uses shopify_order_<id> as distinct_id when customer email is absent', async () => {
    const guestOrder = { ...SAMPLE_ORDER, customer: null };
    const posthogCalls: RequestInit[] = [];
    globalThis.fetch = ((_url: string, init?: RequestInit) => {
      posthogCalls.push(init!);
      return Promise.resolve(new Response('{}', { status: 200 }));
    }) as unknown as typeof fetch;

    const body = JSON.stringify(guestOrder);
    const hmac = await makeHmac(SECRET, body);
    const res = await postWebhook(body, hmac);

    expect(res.status).toBe(200);
    const payload = JSON.parse(posthogCalls[0].body as string) as { distinct_id: string };
    expect(payload.distinct_id).toBe('shopify_order_12345');
  });

  test('returns 200 even when PostHog call fails (Shopify must not retry)', async () => {
    globalThis.fetch = (() =>
      Promise.resolve(new Response('Internal Server Error', { status: 500 }))
    ) as unknown as typeof fetch;

    const body = JSON.stringify(SAMPLE_ORDER);
    const hmac = await makeHmac(SECRET, body);
    const res = await postWebhook(body, hmac);

    // Must still return 200 — PostHog failure must not cause Shopify retries
    expect(res.status).toBe(200);
  });

  test('returns 200 even when PostHog fetch throws a network error', async () => {
    globalThis.fetch = (() => Promise.reject(new Error('network error'))) as unknown as typeof fetch;

    const body = JSON.stringify(SAMPLE_ORDER);
    const hmac = await makeHmac(SECRET, body);
    const res = await postWebhook(body, hmac);

    expect(res.status).toBe(200);
  });

  test('line items are mapped with parseFloat prices, not strings', async () => {
    const posthogCalls: RequestInit[] = [];
    globalThis.fetch = ((_url: string, init?: RequestInit) => {
      posthogCalls.push(init!);
      return Promise.resolve(new Response('{}', { status: 200 }));
    }) as unknown as typeof fetch;

    const body = JSON.stringify(SAMPLE_ORDER);
    const hmac = await makeHmac(SECRET, body);
    await postWebhook(body, hmac);

    const payload = JSON.parse(posthogCalls[0].body as string) as {
      properties: { items: Array<{ price: number; name: string }> };
    };
    expect(typeof payload.properties.items[0].price).toBe('number');
    expect(payload.properties.items[0].price).toBe(1350.0);
    expect(payload.properties.items[0].name).toBe('Saten Perde');
  });
});
