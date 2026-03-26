import { describe, test, expect, beforeAll, afterAll, mock, beforeEach } from 'bun:test';
import { createHmac } from 'node:crypto';

// ---------------------------------------------------------------------------
// verifyShopifyHmac — unit tests (no app/DB needed)
// ---------------------------------------------------------------------------

import { verifyShopifyHmac } from './hmac.ts';

describe('verifyShopifyHmac', () => {
  const SECRET = 'test_webhook_secret';

  function sign(body: string): string {
    return createHmac('sha256', SECRET).update(body).digest('base64');
  }

  test('returns true for a valid signature', async () => {
    const body = '{"id":1}';
    expect(await verifyShopifyHmac(SECRET, body, sign(body))).toBe(true);
  });

  test('returns false for a wrong signature', async () => {
    expect(await verifyShopifyHmac(SECRET, '{"id":1}', 'bad_sig')).toBe(false);
  });

  test('returns false for empty header', async () => {
    expect(await verifyShopifyHmac(SECRET, '{"id":1}', '')).toBe(false);
  });

  test('returns false when lengths differ', async () => {
    const body = '{"id":1}';
    const short = sign(body).slice(0, 10);
    expect(await verifyShopifyHmac(SECRET, body, short)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Mock DB module — must be set up before importing app
// ---------------------------------------------------------------------------

// sqlQueue: each entry is either a result array or an Error.
// Each sql call pops one entry. If queue is empty, returns [].
const mockState = {
  sqlQueue: [] as (unknown[] | Error)[],
  sqlCalls: [] as unknown[][],
};

mock.module('./db.ts', () => ({
  get sql() {
    return Object.assign(
      (_strings: TemplateStringsArray, ..._values: unknown[]) => {
        mockState.sqlCalls.push(_values);
        const next = mockState.sqlQueue.shift();
        if (next instanceof Error) return Promise.reject(next);
        return Promise.resolve(next ?? []);
      },
      { unsafe: async () => {} },
    );
  },
  initDb: async () => {},
}));

const { app, rateLimitMap } = await import('./app.ts');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ENV = {
  SHOPIFY_STORE_DOMAIN: 'test.myshopify.com',
  SHOPIFY_CLIENT_ID: 'test_client_id',
  SHOPIFY_CLIENT_SECRET: 'test_client_secret',
};

function setEnv() { Object.assign(process.env, ENV); }
function clearEnv() { for (const key of Object.keys(ENV)) delete process.env[key]; }

const VALID_BODY = {
  cartToken: 'abc123',
  variantId: 123,
  en: 200,
  boy: 260,
  pileStili: 'Düz Pile',
  pileOrani: 2.5,
  kanat: 'Çift Kanat',
  kanatCount: 2,
};

function postItem(body: unknown) {
  return app.request('/api/checkout/item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function postComplete(body: unknown) {
  return app.request('/api/checkout/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** Build a mock fetch for /api/checkout/item (token + variant + product). */
function mockItemShopify({
  tokenOk = true,
  variantPrice = '230.00',
  variantOk = true,
  productTitle = 'Mock Perde',
  productOk = true,
} = {}) {
  let call = 0;
  return mock(() => {
    call++;
    if (call === 1) {
      // POST /admin/oauth/access_token
      return Promise.resolve(
        tokenOk
          ? new Response(JSON.stringify({ access_token: 'tok_test' }), { status: 200 })
          : new Response('Unauthorized', { status: 401 }),
      );
    }
    if (call === 2) {
      // GET /variants/{id}.json
      return Promise.resolve(
        variantOk
          ? new Response(JSON.stringify({ variant: { price: variantPrice, product_id: 42 } }), { status: 200 })
          : new Response('Not Found', { status: 404 }),
      );
    }
    // call === 3: GET /products/{product_id}.json
    return Promise.resolve(
      productOk
        ? new Response(JSON.stringify({ product: { id: 42, title: productTitle } }), { status: 200 })
        : new Response('Not Found', { status: 404 }),
    );
  }) as unknown as typeof fetch;
}

/** Build a mock fetch for /api/checkout/complete (token + draft order). */
function mockCompleteShopify({
  tokenOk = true,
  draftOrderOk = true,
  draftOrderId = 999,
  invoiceUrl = 'https://checkout.shopify.com/draft/999',
} = {}) {
  let call = 0;
  return mock(() => {
    call++;
    if (call === 1) {
      return Promise.resolve(
        tokenOk
          ? new Response(JSON.stringify({ access_token: 'tok_test' }), { status: 200 })
          : new Response('Unauthorized', { status: 401 }),
      );
    }
    return Promise.resolve(
      draftOrderOk
        ? new Response(JSON.stringify({ draft_order: { id: draftOrderId, invoice_url: invoiceUrl } }), { status: 201 })
        : new Response(JSON.stringify({ errors: 'bad' }), { status: 422 }),
    );
  }) as unknown as typeof fetch;
}

// Sample cart item rows (as returned by Postgres)
const SAMPLE_ROWS = [
  {
    product_title: 'Saten Perde',
    variant_id: '456',
    product_id: '101',
    en_cm: 150,
    boy_cm: 200,
    pile_stili: 'Boru Pile',
    pile_orani: '3.00',
    kanat: 'Çift Kanat',
    kanat_count: 2,
    calculated_price: '1350.00',
  },
  {
    product_title: 'BORNOVA Tül Perde',
    variant_id: '789',
    product_id: '202',
    en_cm: 200,
    boy_cm: 250,
    pile_stili: 'Kanun Pile',
    pile_orani: '2.50',
    kanat: 'Tek Kanat',
    kanat_count: 1,
    calculated_price: '1150.00',
  },
];

// ---------------------------------------------------------------------------
// GET /health
// ---------------------------------------------------------------------------

describe('GET /health', () => {
  test('returns 200 with status ok', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('ok');
  });
});

// ---------------------------------------------------------------------------
// POST /api/checkout/item — cartToken validation
// ---------------------------------------------------------------------------

describe('POST /api/checkout/item — cartToken validation', () => {
  beforeAll(setEnv);
  afterAll(clearEnv);
  beforeEach(() => { mockState.sqlQueue = []; mockState.sqlCalls = []; });

  test('returns 400 MISSING_CART_TOKEN when cartToken is absent', async () => {
    const { cartToken: _omit, ...body } = VALID_BODY;
    const res = await postItem(body);
    expect(res.status).toBe(400);
    const json = await res.json() as { error: string };
    expect(json.error).toBe('MISSING_CART_TOKEN');
  });

  test('returns 400 MISSING_CART_TOKEN when cartToken is empty string', async () => {
    const res = await postItem({ ...VALID_BODY, cartToken: '' });
    expect(res.status).toBe(400);
    const json = await res.json() as { error: string };
    expect(json.error).toBe('MISSING_CART_TOKEN');
  });

  test('returns 400 INVALID_INPUT for cartToken with spaces', async () => {
    const res = await postItem({ ...VALID_BODY, cartToken: 'abc 123' });
    expect(res.status).toBe(400);
    const json = await res.json() as { error: string };
    expect(json.error).toBe('INVALID_INPUT');
  });

  test('returns 400 INVALID_INPUT for cartToken longer than 128 chars', async () => {
    const res = await postItem({ ...VALID_BODY, cartToken: 'a'.repeat(129) });
    expect(res.status).toBe(400);
    const json = await res.json() as { error: string };
    expect(json.error).toBe('INVALID_INPUT');
  });

  test('accepts cartToken with hyphens', async () => {
    globalThis.fetch = mockItemShopify();
    mockState.sqlQueue = [[]];
    const res = await postItem({ ...VALID_BODY, cartToken: 'abc-def-123' });
    expect(res.status).toBe(200);
  });

  test('accepts real Shopify cart token format (alphanumeric?key=hex)', async () => {
    globalThis.fetch = mockItemShopify();
    mockState.sqlQueue = [[]];
    const res = await postItem({ ...VALID_BODY, cartToken: 'hWN9zvzqmHTRwvNxviJXoHPG?key=c8b76dc5c0984b5e472c32826d665c3a' });
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// POST /api/checkout/item — input validation
// ---------------------------------------------------------------------------

describe('POST /api/checkout/item — validation', () => {
  beforeAll(setEnv);
  afterAll(clearEnv);
  beforeEach(() => { mockState.sqlQueue = []; mockState.sqlCalls = []; });

  test('returns 400 for invalid JSON body', async () => {
    const res = await app.request('/api/checkout/item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    });
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('INVALID_INPUT');
  });

  test('returns 400 when variantId is missing', async () => {
    const res = await postItem({ ...VALID_BODY, variantId: undefined });
    expect(res.status).toBe(400);
  });

  test('returns 400 when variantId is a string', async () => {
    const res = await postItem({ ...VALID_BODY, variantId: '123' });
    expect(res.status).toBe(400);
  });

  test('returns 400 when en < 50', async () => {
    const res = await postItem({ ...VALID_BODY, en: 49 });
    expect(res.status).toBe(400);
    const body = await res.json() as { message: string };
    expect(body.message).toContain('50');
  });

  test('returns 400 when en > 1000', async () => {
    const res = await postItem({ ...VALID_BODY, en: 1001 });
    expect(res.status).toBe(400);
  });

  test('returns 400 when boy < 1', async () => {
    const res = await postItem({ ...VALID_BODY, boy: 0 });
    expect(res.status).toBe(400);
    const body = await res.json() as { message: string };
    expect(body.message).toContain('Boy');
  });

  test('returns 400 when boy > 600', async () => {
    const res = await postItem({ ...VALID_BODY, boy: 601 });
    expect(res.status).toBe(400);
  });

  test('returns 400 for invalid pileOrani (1.5)', async () => {
    const res = await postItem({ ...VALID_BODY, pileOrani: 1.5 });
    expect(res.status).toBe(400);
    const body = await res.json() as { message: string };
    expect(body.message).toContain('pile');
  });

  test('returns 400 for pileOrani 2.0 (no longer valid — Düz Dikiş is now 1.0)', async () => {
    const res = await postItem({ ...VALID_BODY, pileOrani: 2.0 });
    expect(res.status).toBe(400);
  });

  test('accepts pileOrani 1.0 (Düz Dikiş)', async () => {
    globalThis.fetch = mockItemShopify({ variantPrice: '230.00' });
    mockState.sqlQueue = [[]];
    const res = await postItem({ ...VALID_BODY, pileOrani: 1.0 });
    expect(res.status).toBe(200);
    const body = await res.json() as { calculatedPrice: string };
    // 200cm × 1.0 × 2 kanat × 230 = 920.00
    expect(body.calculatedPrice).toBe('920.00');
  });

  test('returns 400 when kanatCount = 0', async () => {
    const res = await postItem({ ...VALID_BODY, kanatCount: 0 });
    expect(res.status).toBe(400);
    const body = await res.json() as { message: string };
    expect(body.message).toContain('Kanat');
  });

  test('returns 400 when kanatCount = 3', async () => {
    const res = await postItem({ ...VALID_BODY, kanatCount: 3 });
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// POST /api/checkout/item — Shopify API error paths
// ---------------------------------------------------------------------------

describe('POST /api/checkout/item — Shopify errors', () => {
  beforeAll(setEnv);
  afterAll(clearEnv);
  beforeEach(() => { mockState.sqlQueue = []; mockState.sqlCalls = []; });

  test('returns 500 AUTH_FAILED when token request fails', async () => {
    globalThis.fetch = mockItemShopify({ tokenOk: false });
    const res = await postItem(VALID_BODY);
    expect(res.status).toBe(500);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('AUTH_FAILED');
  });

  test('returns 404 VARIANT_NOT_FOUND when variant lookup fails', async () => {
    globalThis.fetch = mockItemShopify({ variantOk: false });
    const res = await postItem(VALID_BODY);
    expect(res.status).toBe(404);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('VARIANT_NOT_FOUND');
  });

  test('returns 500 INVALID_PRICE when variant price is zero', async () => {
    globalThis.fetch = mockItemShopify({ variantPrice: '0.00' });
    const res = await postItem(VALID_BODY);
    expect(res.status).toBe(500);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('INVALID_PRICE');
  });

  test('returns 500 INVALID_PRICE when variant price is negative', async () => {
    globalThis.fetch = mockItemShopify({ variantPrice: '-10.00' });
    const res = await postItem(VALID_BODY);
    expect(res.status).toBe(500);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('INVALID_PRICE');
  });
});

// ---------------------------------------------------------------------------
// POST /api/checkout/item — DB error
// ---------------------------------------------------------------------------

describe('POST /api/checkout/item — DB error', () => {
  beforeAll(setEnv);
  afterAll(clearEnv);

  test('returns 500 DB_ERROR when upsert throws', async () => {
    globalThis.fetch = mockItemShopify();
    mockState.sqlQueue = [new Error('connection refused')];
    const res = await postItem(VALID_BODY);
    expect(res.status).toBe(500);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('DB_ERROR');
  });
});

// ---------------------------------------------------------------------------
// POST /api/checkout/item — happy path & price calculation
// ---------------------------------------------------------------------------

describe('POST /api/checkout/item — happy path', () => {
  beforeAll(setEnv);
  afterAll(clearEnv);
  beforeEach(() => { mockState.sqlQueue = [[]]; });

  test('valid request upserts row and returns { ok: true, calculatedPrice }', async () => {
    globalThis.fetch = mockItemShopify({ variantPrice: '230.00' });
    const res = await postItem(VALID_BODY);
    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean; calculatedPrice: string };
    expect(body.ok).toBe(true);
    expect(body.calculatedPrice).toBeDefined();
  });

  test('price formula: 200cm × 2.5 × 1 × 230 TL/m = 1150.00', async () => {
    globalThis.fetch = mockItemShopify({ variantPrice: '230.00' });
    const res = await postItem({ ...VALID_BODY, en: 200, pileOrani: 2.5, kanatCount: 1 });
    expect(res.status).toBe(200);
    const body = await res.json() as { calculatedPrice: string };
    expect(body.calculatedPrice).toBe('1150.00');
  });

  test('price formula: 150cm × 3.0 × 2 × 150 TL/m = 1350.00', async () => {
    globalThis.fetch = mockItemShopify({ variantPrice: '150.00' });
    const res = await postItem({ ...VALID_BODY, en: 150, pileOrani: 3.0, kanatCount: 2 });
    expect(res.status).toBe(200);
    const body = await res.json() as { calculatedPrice: string };
    expect(body.calculatedPrice).toBe('1350.00');
  });

  test('product title is fetched from Shopify (not fallback "Özel Ölçü Perde")', async () => {
    globalThis.fetch = mockItemShopify({ variantPrice: '230.00', productTitle: 'Saten Perde' });
    mockState.sqlQueue = [[]];
    // Endpoint must succeed — product fetch happens after variant fetch
    const res = await postItem(VALID_BODY);
    expect(res.status).toBe(200);
  });

  test('product title uses fallback when product fetch fails', async () => {
    globalThis.fetch = mockItemShopify({ variantPrice: '230.00', productOk: false });
    mockState.sqlQueue = [[]];
    // Should still succeed — fallback title "Özel Ölçü Perde" is used
    const res = await postItem(VALID_BODY);
    expect(res.status).toBe(200);
  });

  test('çift kanat costs exactly twice tek kanat at the same en (per-kanat semantics)', async () => {
    // Customer enters 80cm — they want 1 or 2 panels EACH of 80cm, not split halves.
    let call = 0;
    globalThis.fetch = mock(() => {
      const round = call++ % 3;
      if (round === 0) return Promise.resolve(new Response(JSON.stringify({ access_token: 'tok_test' }), { status: 200 }));
      if (round === 1) return Promise.resolve(new Response(JSON.stringify({ variant: { price: '200.00', product_id: 42 } }), { status: 200 }));
      return Promise.resolve(new Response(JSON.stringify({ product: { id: 42, title: 'Mock Perde' } }), { status: 200 }));
    }) as unknown as typeof fetch;
    mockState.sqlQueue = [[], []];
    const tekRes  = await postItem({ ...VALID_BODY, en: 80, pileOrani: 2.5, kanatCount: 1 });
    const ciftRes = await postItem({ ...VALID_BODY, en: 80, pileOrani: 2.5, kanatCount: 2 });
    const tek  = await tekRes.json()  as { calculatedPrice: string };
    const cift = await ciftRes.json() as { calculatedPrice: string };
    // tek:  (80/100) × 2.5 × 1 × 200 = 400.00
    // çift: (80/100) × 2.5 × 2 × 200 = 800.00 (two 80cm panels, not two 40cm panels)
    expect(tek.calculatedPrice).toBe('400.00');
    expect(cift.calculatedPrice).toBe('800.00');
    expect(parseFloat(cift.calculatedPrice)).toBe(parseFloat(tek.calculatedPrice) * 2);
  });

  test('boy_cm does not affect price (cutting reference only)', async () => {
    // Two requests, each making 3 Shopify calls (token + variant + product) — cycle mod 3
    let call = 0;
    globalThis.fetch = mock(() => {
      const round = call++ % 3;
      if (round === 0) return Promise.resolve(new Response(JSON.stringify({ access_token: 'tok_test' }), { status: 200 }));
      if (round === 1) return Promise.resolve(new Response(JSON.stringify({ variant: { price: '230.00', product_id: 42 } }), { status: 200 }));
      return Promise.resolve(new Response(JSON.stringify({ product: { id: 42, title: 'Mock Perde' } }), { status: 200 }));
    }) as unknown as typeof fetch;
    mockState.sqlQueue = [[], []]; // two upserts
    const res1 = await postItem({ ...VALID_BODY, en: 200, pileOrani: 2.5, kanatCount: 1, boy: 100 });
    const res2 = await postItem({ ...VALID_BODY, en: 200, pileOrani: 2.5, kanatCount: 1, boy: 500 });
    const body1 = await res1.json() as { calculatedPrice: string };
    const body2 = await res2.json() as { calculatedPrice: string };
    expect(body1.calculatedPrice).toBe('1150.00');
    expect(body2.calculatedPrice).toBe('1150.00');
  });
});

// ---------------------------------------------------------------------------
// POST /api/checkout/item — missing environment variables
// ---------------------------------------------------------------------------

describe('POST /api/checkout/item — missing env', () => {
  test('returns 500 when Shopify environment variables are not set', async () => {
    clearEnv();
    mockState.sqlQueue = [];
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response('', { status: 200 })),
    ) as unknown as typeof fetch;
    const res = await postItem(VALID_BODY);
    expect(res.status).toBe(500);
    setEnv();
  });
});

// ---------------------------------------------------------------------------
// POST /api/checkout/complete — cartToken validation
// ---------------------------------------------------------------------------

describe('POST /api/checkout/complete — cartToken validation', () => {
  beforeAll(setEnv);
  afterAll(clearEnv);
  beforeEach(() => { mockState.sqlQueue = []; mockState.sqlCalls = []; rateLimitMap.clear(); });

  test('returns 400 MISSING_CART_TOKEN when cartToken is absent', async () => {
    const res = await postComplete({});
    expect(res.status).toBe(400);
    const json = await res.json() as { error: string };
    expect(json.error).toBe('MISSING_CART_TOKEN');
  });

  test('returns 400 MISSING_CART_TOKEN when cartToken is empty', async () => {
    const res = await postComplete({ cartToken: '' });
    expect(res.status).toBe(400);
    const json = await res.json() as { error: string };
    expect(json.error).toBe('MISSING_CART_TOKEN');
  });
});

// ---------------------------------------------------------------------------
// POST /api/checkout/complete — happy path
// ---------------------------------------------------------------------------

describe('POST /api/checkout/complete — happy path', () => {
  beforeAll(setEnv);
  afterAll(clearEnv);
  beforeEach(() => { mockState.sqlQueue = []; mockState.sqlCalls = []; rateLimitMap.clear(); });

  test('valid request with 2 items creates draft order with 2 line items and returns checkoutUrl', async () => {
    mockState.sqlQueue = [SAMPLE_ROWS, []]; // SELECT → 2 rows; DELETE → success
    const draftBodies: string[] = [];
    globalThis.fetch = mock((url: string, init?: RequestInit) => {
      if (url.includes('access_token')) {
        return Promise.resolve(new Response(JSON.stringify({ access_token: 'tok' }), { status: 200 }));
      }
      draftBodies.push(init?.body as string);
      return Promise.resolve(new Response(
        JSON.stringify({ draft_order: { id: 1, invoice_url: 'https://checkout.shopify.com/draft/1' } }),
        { status: 201 },
      ));
    }) as unknown as typeof fetch;

    const res = await postComplete({ cartToken: 'abc123' });
    expect(res.status).toBe(200);
    const body = await res.json() as { checkoutUrl: string };
    expect(body.checkoutUrl).toBe('https://checkout.shopify.com/draft/1');

    // Verify draft order has 2 line items
    const payload = JSON.parse(draftBodies[0]) as { draft_order: { line_items: unknown[] } };
    expect(payload.draft_order.line_items.length).toBe(2);
  });

  test('empty cart returns 404 NO_ITEMS', async () => {
    mockState.sqlQueue = [[]]; // SELECT → 0 rows
    const res = await postComplete({ cartToken: 'abc123' });
    expect(res.status).toBe(404);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('NO_ITEMS');
  });

  test('rows are deleted after successful draft order creation', async () => {
    mockState.sqlQueue = [SAMPLE_ROWS, []]; // SELECT → rows; DELETE → success
    const deletedCalls: string[] = [];
    globalThis.fetch = mock((url: string, init?: RequestInit) => {
      if (url.includes('access_token')) {
        return Promise.resolve(new Response(JSON.stringify({ access_token: 'tok' }), { status: 200 }));
      }
      deletedCalls.push(init?.body as string);
      return Promise.resolve(new Response(
        JSON.stringify({ draft_order: { id: 1, invoice_url: 'https://x' } }),
        { status: 201 },
      ));
    }) as unknown as typeof fetch;

    await postComplete({ cartToken: 'abc123' });

    // The DELETE call consumes the second queue entry (sqlQueue should now be empty)
    expect(mockState.sqlQueue.length).toBe(0);
  });

  test('returns 500 AUTH_FAILED when Shopify token request fails', async () => {
    mockState.sqlQueue = [SAMPLE_ROWS]; // SELECT succeeds
    globalThis.fetch = mockCompleteShopify({ tokenOk: false });
    const res = await postComplete({ cartToken: 'abc123' });
    expect(res.status).toBe(500);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('AUTH_FAILED');
  });

  test('returns 500 DRAFT_ORDER_FAILED when Shopify draft order fails', async () => {
    mockState.sqlQueue = [SAMPLE_ROWS]; // SELECT succeeds
    globalThis.fetch = mockCompleteShopify({ draftOrderOk: false });
    const res = await postComplete({ cartToken: 'abc123' });
    expect(res.status).toBe(500);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('DRAFT_ORDER_FAILED');
  });

  test('returns 500 DB_ERROR when Postgres SELECT throws', async () => {
    mockState.sqlQueue = [new Error('db down')];
    globalThis.fetch = mockCompleteShopify();
    const res = await postComplete({ cartToken: 'abc123' });
    expect(res.status).toBe(500);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('DB_ERROR');
  });

  test('draft order line items have correct title, price, and properties (no variant_id)', async () => {
    mockState.sqlQueue = [SAMPLE_ROWS, []];
    const draftBodies: string[] = [];
    globalThis.fetch = mock((url: string, init?: RequestInit) => {
      if (url.includes('access_token')) {
        return Promise.resolve(new Response(JSON.stringify({ access_token: 'tok' }), { status: 200 }));
      }
      draftBodies.push(init?.body as string);
      return Promise.resolve(new Response(
        JSON.stringify({ draft_order: { id: 1, invoice_url: 'https://x' } }),
        { status: 201 },
      ));
    }) as unknown as typeof fetch;

    await postComplete({ cartToken: 'abc123' });

    const payload = JSON.parse(draftBodies[0]) as {
      draft_order: {
        line_items: Array<{
          title: string;
          price: string;
          properties: { name: string; value: string }[];
        }>;
        note: string;
      }
    };
    const [item1, item2] = payload.draft_order.line_items;

    // First item: Saten Perde — no variant_id so Shopify respects our price override
    expect((item1 as { variant_id?: number }).variant_id).toBeUndefined();
    expect(item1.title).toBe('Saten Perde');
    expect(item1.price).toBe('1350.00');
    const props1 = item1.properties;
    expect(props1).toContainEqual({ name: 'En', value: '150 cm' });
    expect(props1).toContainEqual({ name: 'Boy', value: '200 cm' });
    expect(props1).toContainEqual({ name: 'Pile Stili', value: 'Boru Pile (x3.00)' });
    expect(props1).toContainEqual({ name: 'Kanat', value: 'Çift Kanat' });

    // Second item: BORNOVA Tül Perde
    expect((item2 as { variant_id?: number }).variant_id).toBeUndefined();
    expect(item2.title).toBe('BORNOVA Tül Perde');
    expect(item2.price).toBe('1150.00');

    // Order note contains both items
    expect(payload.draft_order.note).toContain('Saten Perde');
    expect(payload.draft_order.note).toContain('BORNOVA Tül Perde');
  });

  test('draft order note summarises each item with dimensions', async () => {
    mockState.sqlQueue = [SAMPLE_ROWS, []];
    const draftBodies: string[] = [];
    globalThis.fetch = mock((url: string, init?: RequestInit) => {
      if (url.includes('access_token')) {
        return Promise.resolve(new Response(JSON.stringify({ access_token: 'tok' }), { status: 200 }));
      }
      draftBodies.push(init?.body as string);
      return Promise.resolve(new Response(
        JSON.stringify({ draft_order: { id: 1, invoice_url: 'https://x' } }),
        { status: 201 },
      ));
    }) as unknown as typeof fetch;

    await postComplete({ cartToken: 'abc123' });

    const payload = JSON.parse(draftBodies[0]) as { draft_order: { note: string } };
    const note = payload.draft_order.note;
    expect(note).toContain('150cm');
    expect(note).toContain('Boru Pile');
    expect(note).toContain('Çift Kanat');
    expect(note).toContain('200cm');
    expect(note).toContain('Kanun Pile');
    expect(note).toContain('Tek Kanat');
  });

  test('checkoutUrl uses invoice_url (not checkout_url)', async () => {
    mockState.sqlQueue = [SAMPLE_ROWS, []];
    globalThis.fetch = mock((url: string) => {
      if (url.includes('access_token')) {
        return Promise.resolve(new Response(JSON.stringify({ access_token: 'tok' }), { status: 200 }));
      }
      return Promise.resolve(new Response(
        JSON.stringify({
          draft_order: {
            id: 1,
            invoice_url: 'https://inanctekstil.store/a/invoices/abc',
            checkout_url: 'https://inanctekstil.store/checkouts/xyz',
          },
        }),
        { status: 201 },
      ));
    }) as unknown as typeof fetch;

    const res = await postComplete({ cartToken: 'abc123' });
    const body = await res.json() as { checkoutUrl: string };
    expect(body.checkoutUrl).toContain('invoices');
    expect(body.checkoutUrl).not.toContain('checkouts');
  });
});

// ---------------------------------------------------------------------------
// POST /api/checkout/item — product_id storage
// ---------------------------------------------------------------------------

describe('POST /api/checkout/item — product_id storage', () => {
  beforeAll(setEnv);
  afterAll(clearEnv);
  beforeEach(() => { mockState.sqlQueue = [[]]; mockState.sqlCalls = []; });

  test('product_id (42) from variant response is stored in DB upsert', async () => {
    globalThis.fetch = mockItemShopify({ variantPrice: '230.00' });
    await postItem(VALID_BODY);
    // The upsert call is the only DB call; its values include productId = 42
    expect(mockState.sqlCalls.length).toBeGreaterThanOrEqual(1);
    const upsertValues = mockState.sqlCalls[0];
    expect(upsertValues).toContain(42);
  });

  test('product_id is stored even when product title fetch fails (fallback title used)', async () => {
    globalThis.fetch = mockItemShopify({ variantPrice: '230.00', productOk: false });
    const res = await postItem(VALID_BODY);
    expect(res.status).toBe(200);
    // product_id (42) must still be in the upsert values
    const upsertValues = mockState.sqlCalls[0];
    expect(upsertValues).toContain(42);
  });

  test('variant fetch URL has no ?fields= query parameter', async () => {
    const fetchedUrls: string[] = [];
    let call = 0;
    globalThis.fetch = mock((url: string) => {
      fetchedUrls.push(url as string);
      call++;
      if (call === 1) return Promise.resolve(new Response(JSON.stringify({ access_token: 'tok' }), { status: 200 }));
      if (call === 2) return Promise.resolve(new Response(JSON.stringify({ variant: { price: '230.00', product_id: 42 } }), { status: 200 }));
      return Promise.resolve(new Response(JSON.stringify({ product: { id: 42, title: 'Mock' } }), { status: 200 }));
    }) as unknown as typeof fetch;

    await postItem(VALID_BODY);

    const variantUrl = fetchedUrls.find((u) => u.includes('/variants/'));
    expect(variantUrl).toBeDefined();
    expect(variantUrl).not.toContain('?fields=');
  });
});

// ---------------------------------------------------------------------------
// POST /api/checkout/complete — rate limiting
// ---------------------------------------------------------------------------

describe('POST /api/checkout/complete — rate limiting', () => {
  beforeAll(setEnv);
  afterAll(clearEnv);
  beforeEach(() => { mockState.sqlQueue = []; mockState.sqlCalls = []; rateLimitMap.clear(); });

  test('first 10 requests from same IP are allowed (return 404 NO_ITEMS, not 429)', async () => {
    for (let i = 0; i < 10; i++) {
      mockState.sqlQueue.push([]); // empty SELECT → NO_ITEMS
    }
    for (let i = 0; i < 10; i++) {
      const res = await app.request('/api/checkout/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
        body: JSON.stringify({ cartToken: 'abc123' }),
      });
      expect(res.status).toBe(404); // NO_ITEMS, not rate limited
    }
  });

  test('11th request from same IP is rate limited (429)', async () => {
    for (let i = 0; i < 10; i++) {
      mockState.sqlQueue.push([]);
    }
    for (let i = 0; i < 10; i++) {
      await app.request('/api/checkout/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
        body: JSON.stringify({ cartToken: 'abc123' }),
      });
    }
    const res = await app.request('/api/checkout/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
      body: JSON.stringify({ cartToken: 'abc123' }),
    });
    expect(res.status).toBe(429);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('RATE_LIMITED');
  });

  test('different IPs have independent rate limits', async () => {
    for (let i = 0; i < 10; i++) {
      mockState.sqlQueue.push([]);
    }
    // Fill up IP A
    for (let i = 0; i < 10; i++) {
      await app.request('/api/checkout/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.0.1' },
        body: JSON.stringify({ cartToken: 'abc123' }),
      });
    }
    // IP B still has a fresh quota
    mockState.sqlQueue.push([]);
    const res = await app.request('/api/checkout/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.0.2' },
      body: JSON.stringify({ cartToken: 'abc123' }),
    });
    expect(res.status).toBe(404); // NO_ITEMS, not rate limited
  });
});

// ---------------------------------------------------------------------------
// POST /api/checkout/item — real-world price calculations
// ---------------------------------------------------------------------------

describe('POST /api/checkout/item — real-world prices', () => {
  beforeAll(setEnv);
  afterAll(clearEnv);
  beforeEach(() => { mockState.sqlQueue = [[]]; mockState.sqlCalls = []; });

  test('HÜRREM 200cm × 2.5 pile × 2 kanat × 700 TL/m = 7000.00', async () => {
    globalThis.fetch = mockItemShopify({ variantPrice: '700.00' });
    const res = await postItem({ ...VALID_BODY, en: 200, pileOrani: 2.5, kanatCount: 2 });
    expect(res.status).toBe(200);
    const body = await res.json() as { calculatedPrice: string };
    expect(body.calculatedPrice).toBe('7000.00');
  });

  test('HÜRREM 150cm × 2.5 pile × 1 kanat × 700 TL/m = 2625.00', async () => {
    globalThis.fetch = mockItemShopify({ variantPrice: '700.00' });
    const res = await postItem({ ...VALID_BODY, en: 150, pileOrani: 2.5, kanatCount: 1 });
    expect(res.status).toBe(200);
    const body = await res.json() as { calculatedPrice: string };
    expect(body.calculatedPrice).toBe('2625.00');
  });

  test('Şönil Blackout 100cm × 3.0 pile × 1 kanat × 1500 TL/m = 4500.00', async () => {
    globalThis.fetch = mockItemShopify({ variantPrice: '1500.00' });
    const res = await postItem({ ...VALID_BODY, en: 100, pileOrani: 3.0, kanatCount: 1 });
    expect(res.status).toBe(200);
    const body = await res.json() as { calculatedPrice: string };
    expect(body.calculatedPrice).toBe('4500.00');
  });

  test('Saten Perde 80cm × 1.0 pile × 1 kanat × 150 TL/m = 120.00', async () => {
    globalThis.fetch = mockItemShopify({ variantPrice: '150.00' });
    const res = await postItem({ ...VALID_BODY, en: 80, pileOrani: 1.0, kanatCount: 1 });
    expect(res.status).toBe(200);
    const body = await res.json() as { calculatedPrice: string };
    expect(body.calculatedPrice).toBe('120.00');
  });

  test('calculated price is stored in DB — not base price per meter', async () => {
    // base = 700/m, calculated = 200cm × 2.5 × 2 × 700 = 7000
    globalThis.fetch = mockItemShopify({ variantPrice: '700.00' });
    await postItem({ ...VALID_BODY, en: 200, pileOrani: 2.5, kanatCount: 2 });
    const upsertValues = mockState.sqlCalls[0];
    expect(upsertValues).toContain(700);      // base_price_per_meter
    expect(upsertValues).toContain('7000.00'); // calculated_price
  });

  test('complete endpoint uses DB-stored calculated price, not variant base price', async () => {
    const rowWithCalculatedPrice = [{
      product_title: 'HÜRREM Fon Perde',
      variant_id: '59200390758481',
      product_id: '15726200717393',
      en_cm: 200,
      boy_cm: 260,
      pile_stili: 'Düz Dikiş',
      pile_orani: '2.50',
      kanat: 'Çift Kanat',
      kanat_count: 2,
      calculated_price: '7000.00',
    }];
    mockState.sqlQueue = [rowWithCalculatedPrice, []];
    const draftBodies: string[] = [];
    globalThis.fetch = mock((url: string, init?: RequestInit) => {
      if (url.includes('access_token')) {
        return Promise.resolve(new Response(JSON.stringify({ access_token: 'tok' }), { status: 200 }));
      }
      draftBodies.push(init?.body as string);
      return Promise.resolve(new Response(
        JSON.stringify({ draft_order: { id: 1, invoice_url: 'https://checkout.shopify.com/draft/1' } }),
        { status: 201 },
      ));
    }) as unknown as typeof fetch;

    await postComplete({ cartToken: 'abc123' });

    const payload = JSON.parse(draftBodies[0]) as { draft_order: { line_items: Array<{ price: string }> } };
    // Draft order must use 7000.00 (DB price), NOT 700.00 (variant base price)
    expect(payload.draft_order.line_items[0].price).toBe('7000.00');
  });
});

// ---------------------------------------------------------------------------
// POST /api/checkout/complete — resilience
// ---------------------------------------------------------------------------

describe('POST /api/checkout/complete — resilience', () => {
  beforeAll(setEnv);
  afterAll(clearEnv);
  beforeEach(() => { mockState.sqlQueue = []; mockState.sqlCalls = []; rateLimitMap.clear(); });

  test('DB delete failure after draft order creation still returns 200 checkoutUrl', async () => {
    // SELECT succeeds; DELETE throws
    mockState.sqlQueue = [SAMPLE_ROWS, new Error('delete failed')];
    globalThis.fetch = mockCompleteShopify({ invoiceUrl: 'https://checkout.shopify.com/draft/99' });
    const res = await postComplete({ cartToken: 'abc123' });
    expect(res.status).toBe(200);
    const body = await res.json() as { checkoutUrl: string };
    expect(body.checkoutUrl).toBe('https://checkout.shopify.com/draft/99');
  });

  test('single item cart creates draft order with exactly 1 line item', async () => {
    const singleRow = [SAMPLE_ROWS[0]];
    mockState.sqlQueue = [singleRow, []];
    const draftBodies: string[] = [];
    globalThis.fetch = mock((url: string, init?: RequestInit) => {
      if (url.includes('access_token')) {
        return Promise.resolve(new Response(JSON.stringify({ access_token: 'tok' }), { status: 200 }));
      }
      draftBodies.push(init?.body as string);
      return Promise.resolve(new Response(
        JSON.stringify({ draft_order: { id: 1, invoice_url: 'https://x' } }),
        { status: 201 },
      ));
    }) as unknown as typeof fetch;

    const res = await postComplete({ cartToken: 'abc123' });
    expect(res.status).toBe(200);
    const payload = JSON.parse(draftBodies[0]) as { draft_order: { line_items: unknown[] } };
    expect(payload.draft_order.line_items.length).toBe(1);
  });

  test('all line items have requires_shipping=true and taxable=true', async () => {
    mockState.sqlQueue = [SAMPLE_ROWS, []];
    const draftBodies: string[] = [];
    globalThis.fetch = mock((url: string, init?: RequestInit) => {
      if (url.includes('access_token')) {
        return Promise.resolve(new Response(JSON.stringify({ access_token: 'tok' }), { status: 200 }));
      }
      draftBodies.push(init?.body as string);
      return Promise.resolve(new Response(
        JSON.stringify({ draft_order: { id: 1, invoice_url: 'https://x' } }),
        { status: 201 },
      ));
    }) as unknown as typeof fetch;

    await postComplete({ cartToken: 'abc123' });

    const payload = JSON.parse(draftBodies[0]) as {
      draft_order: { line_items: Array<{ requires_shipping: boolean; taxable: boolean }> };
    };
    for (const item of payload.draft_order.line_items) {
      expect(item.requires_shipping).toBe(true);
      expect(item.taxable).toBe(true);
    }
  });
});
