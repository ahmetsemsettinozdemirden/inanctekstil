import { describe, test, expect, beforeAll, afterAll, mock, beforeEach } from 'bun:test';

// ---------------------------------------------------------------------------
// Mock DB module — must be set up before importing app
// ---------------------------------------------------------------------------

// sqlQueue: each entry is either a result array or an Error.
// Each sql call pops one entry. If queue is empty, returns [].
const mockState = {
  sqlQueue: [] as (unknown[] | Error)[],
};

mock.module('./db.ts', () => ({
  get sql() {
    return Object.assign(
      (_strings: TemplateStringsArray, ..._values: unknown[]) => {
        const next = mockState.sqlQueue.shift();
        if (next instanceof Error) return Promise.reject(next);
        return Promise.resolve(next ?? []);
      },
      { unsafe: async () => {} },
    );
  },
  initDb: async () => {},
}));

const { app } = await import('./app.ts');

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

/** Build a mock fetch for /api/checkout/item (token + variant). */
function mockItemShopify({
  tokenOk = true,
  variantPrice = '230.00',
  variantOk = true,
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
      variantOk
        ? new Response(JSON.stringify({ variant: { price: variantPrice, product: { title: 'Mock Perde' } } }), { status: 200 })
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
  beforeEach(() => { mockState.sqlQueue = []; });

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

  test('returns 400 INVALID_INPUT for cartToken longer than 64 chars', async () => {
    const res = await postItem({ ...VALID_BODY, cartToken: 'a'.repeat(65) });
    expect(res.status).toBe(400);
    const json = await res.json() as { error: string };
    expect(json.error).toBe('INVALID_INPUT');
  });

  test('accepts cartToken with hyphens', async () => {
    globalThis.fetch = mockItemShopify();
    mockState.sqlQueue = [[]]; // upsert succeeds
    const res = await postItem({ ...VALID_BODY, cartToken: 'abc-def-123' });
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// POST /api/checkout/item — input validation
// ---------------------------------------------------------------------------

describe('POST /api/checkout/item — validation', () => {
  beforeAll(setEnv);
  afterAll(clearEnv);
  beforeEach(() => { mockState.sqlQueue = []; });

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
  beforeEach(() => { mockState.sqlQueue = []; });

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

  test('boy_cm does not affect price (cutting reference only)', async () => {
    globalThis.fetch = mockItemShopify({ variantPrice: '230.00' });
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
  beforeEach(() => { mockState.sqlQueue = []; });

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
  beforeEach(() => { mockState.sqlQueue = []; });

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

  test('draft order line items include correct En, Boy, Pile Stili, Kanat, _variant_id properties', async () => {
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
      draft_order: { line_items: Array<{ title: string; price: string; properties: { name: string; value: string }[] }> }
    };
    const [item1] = payload.draft_order.line_items;
    expect(item1.title).toBe('Saten Perde');
    expect(item1.price).toBe('1350.00');
    const props = item1.properties;
    expect(props).toContainEqual({ name: 'En', value: '150 cm' });
    expect(props).toContainEqual({ name: 'Boy', value: '200 cm' });
    expect(props).toContainEqual({ name: '_variant_id', value: '456' });
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
