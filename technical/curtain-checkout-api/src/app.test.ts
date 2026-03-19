import { describe, test, expect, beforeAll, afterAll, mock, beforeEach } from 'bun:test';

// ---------------------------------------------------------------------------
// Mock DB module — must be set up before importing app
// ---------------------------------------------------------------------------

const mockState = {
  sqlResult: [] as unknown[],
  sqlError: null as Error | null,
};

mock.module('./db.ts', () => ({
  get sql() {
    const fn = Object.assign(
      (_strings: TemplateStringsArray, ..._values: unknown[]) => {
        if (mockState.sqlError) return Promise.reject(mockState.sqlError);
        return Promise.resolve(mockState.sqlResult);
      },
      { unsafe: async () => {} },
    );
    return fn;
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

function post(body: unknown) {
  return app.request('/api/checkout/item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** Build a mock fetch that returns Shopify API responses in sequence. */
function mockShopify({
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
    // GET /variants/:id
    return Promise.resolve(
      variantOk
        ? new Response(JSON.stringify({ variant: { price: variantPrice, product: { title: 'Mock Perde' } } }), { status: 200 })
        : new Response('Not Found', { status: 404 }),
    );
  }) as unknown as typeof fetch;
}

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

  test('returns 400 MISSING_CART_TOKEN when cartToken is absent', async () => {
    const { cartToken: _omit, ...body } = VALID_BODY;
    const res = await post(body);
    expect(res.status).toBe(400);
    const json = await res.json() as { error: string };
    expect(json.error).toBe('MISSING_CART_TOKEN');
  });

  test('returns 400 MISSING_CART_TOKEN when cartToken is empty string', async () => {
    const res = await post({ ...VALID_BODY, cartToken: '' });
    expect(res.status).toBe(400);
    const json = await res.json() as { error: string };
    expect(json.error).toBe('MISSING_CART_TOKEN');
  });

  test('returns 400 INVALID_INPUT for cartToken with spaces', async () => {
    const res = await post({ ...VALID_BODY, cartToken: 'abc 123' });
    expect(res.status).toBe(400);
    const json = await res.json() as { error: string };
    expect(json.error).toBe('INVALID_INPUT');
  });

  test('returns 400 INVALID_INPUT for cartToken longer than 64 chars', async () => {
    const res = await post({ ...VALID_BODY, cartToken: 'a'.repeat(65) });
    expect(res.status).toBe(400);
    const json = await res.json() as { error: string };
    expect(json.error).toBe('INVALID_INPUT');
  });

  test('accepts cartToken with hyphens (alphanumeric+hyphens)', async () => {
    globalThis.fetch = mockShopify();
    mockState.sqlError = null;
    mockState.sqlResult = [];
    const res = await post({ ...VALID_BODY, cartToken: 'abc-def-123' });
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// POST /api/checkout/item — input validation
// ---------------------------------------------------------------------------

describe('POST /api/checkout/item — validation', () => {
  beforeAll(setEnv);
  afterAll(clearEnv);

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
    const res = await post({ ...VALID_BODY, variantId: undefined });
    expect(res.status).toBe(400);
  });

  test('returns 400 when variantId is a string', async () => {
    const res = await post({ ...VALID_BODY, variantId: '123' });
    expect(res.status).toBe(400);
  });

  test('returns 400 when en < 50', async () => {
    const res = await post({ ...VALID_BODY, en: 49 });
    expect(res.status).toBe(400);
    const body = await res.json() as { message: string };
    expect(body.message).toContain('50');
  });

  test('returns 400 when en > 1000', async () => {
    const res = await post({ ...VALID_BODY, en: 1001 });
    expect(res.status).toBe(400);
  });

  test('returns 400 when boy < 1', async () => {
    const res = await post({ ...VALID_BODY, boy: 0 });
    expect(res.status).toBe(400);
    const body = await res.json() as { message: string };
    expect(body.message).toContain('Boy');
  });

  test('returns 400 when boy > 600', async () => {
    const res = await post({ ...VALID_BODY, boy: 601 });
    expect(res.status).toBe(400);
  });

  test('returns 400 for invalid pileOrani (1.5)', async () => {
    const res = await post({ ...VALID_BODY, pileOrani: 1.5 });
    expect(res.status).toBe(400);
    const body = await res.json() as { message: string };
    expect(body.message).toContain('pile');
  });

  test('returns 400 when kanatCount = 0', async () => {
    const res = await post({ ...VALID_BODY, kanatCount: 0 });
    expect(res.status).toBe(400);
    const body = await res.json() as { message: string };
    expect(body.message).toContain('Kanat');
  });

  test('returns 400 when kanatCount = 3', async () => {
    const res = await post({ ...VALID_BODY, kanatCount: 3 });
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// POST /api/checkout/item — Shopify API error paths
// ---------------------------------------------------------------------------

describe('POST /api/checkout/item — Shopify errors', () => {
  beforeAll(setEnv);
  afterAll(clearEnv);
  beforeEach(() => { mockState.sqlError = null; mockState.sqlResult = []; });

  test('returns 500 AUTH_FAILED when token request fails', async () => {
    globalThis.fetch = mockShopify({ tokenOk: false });
    const res = await post(VALID_BODY);
    expect(res.status).toBe(500);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('AUTH_FAILED');
  });

  test('returns 404 VARIANT_NOT_FOUND when variant lookup fails', async () => {
    globalThis.fetch = mockShopify({ variantOk: false });
    const res = await post(VALID_BODY);
    expect(res.status).toBe(404);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('VARIANT_NOT_FOUND');
  });

  test('returns 500 INVALID_PRICE when variant price is zero', async () => {
    globalThis.fetch = mockShopify({ variantPrice: '0.00' });
    const res = await post(VALID_BODY);
    expect(res.status).toBe(500);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('INVALID_PRICE');
  });

  test('returns 500 INVALID_PRICE when variant price is negative', async () => {
    globalThis.fetch = mockShopify({ variantPrice: '-10.00' });
    const res = await post(VALID_BODY);
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
    globalThis.fetch = mockShopify();
    mockState.sqlError = new Error('connection refused');
    mockState.sqlResult = [];
    const res = await post(VALID_BODY);
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
  beforeEach(() => { mockState.sqlError = null; mockState.sqlResult = []; });

  test('returns { ok: true, calculatedPrice } on success', async () => {
    globalThis.fetch = mockShopify({ variantPrice: '230.00' });
    const res = await post(VALID_BODY);
    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean; calculatedPrice: string };
    expect(body.ok).toBe(true);
    expect(body.calculatedPrice).toBeDefined();
  });

  test('price formula: 200cm × 2.5 × 1 × 230 TL/m = 1150.00', async () => {
    globalThis.fetch = mockShopify({ variantPrice: '230.00' });
    const res = await post({ ...VALID_BODY, en: 200, pileOrani: 2.5, kanatCount: 1 });
    expect(res.status).toBe(200);
    const body = await res.json() as { calculatedPrice: string };
    expect(body.calculatedPrice).toBe('1150.00');
  });

  test('price formula: 150cm × 3.0 × 2 × 150 TL/m = 1350.00', async () => {
    globalThis.fetch = mockShopify({ variantPrice: '150.00' });
    const res = await post({ ...VALID_BODY, en: 150, pileOrani: 3.0, kanatCount: 2 });
    expect(res.status).toBe(200);
    const body = await res.json() as { calculatedPrice: string };
    expect(body.calculatedPrice).toBe('1350.00');
  });

  test('price formula: 200cm × 2.5 × 2 × 230 TL/m = 2300.00', async () => {
    globalThis.fetch = mockShopify({ variantPrice: '230.00' });
    const res = await post({ ...VALID_BODY, en: 200, pileOrani: 2.5, kanatCount: 2 });
    expect(res.status).toBe(200);
    const body = await res.json() as { calculatedPrice: string };
    expect(body.calculatedPrice).toBe('2300.00');
  });

  test('boy_cm does not affect price (cutting reference only)', async () => {
    globalThis.fetch = mockShopify({ variantPrice: '230.00' });
    const res1 = await post({ ...VALID_BODY, en: 200, pileOrani: 2.5, kanatCount: 1, boy: 100 });
    const res2 = await post({ ...VALID_BODY, en: 200, pileOrani: 2.5, kanatCount: 1, boy: 500 });
    const body1 = await res1.json() as { calculatedPrice: string };
    const body2 = await res2.json() as { calculatedPrice: string };
    expect(body1.calculatedPrice).toBe(body2.calculatedPrice);
    expect(body1.calculatedPrice).toBe('1150.00');
  });
});

// ---------------------------------------------------------------------------
// POST /api/checkout/item — missing environment variables
// ---------------------------------------------------------------------------

describe('POST /api/checkout/item — missing env', () => {
  test('returns 500 when Shopify environment variables are not set', async () => {
    clearEnv();
    mockState.sqlError = null;
    mockState.sqlResult = [];
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response('', { status: 200 })),
    ) as unknown as typeof fetch;
    const res = await post(VALID_BODY);
    expect(res.status).toBe(500);
    setEnv();
  });
});
