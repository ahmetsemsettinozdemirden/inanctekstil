import { describe, test, expect, beforeAll, afterAll, spyOn, mock } from 'bun:test';
import { app } from './app';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ENV = {
  SHOPIFY_STORE_DOMAIN: 'test.myshopify.com',
  SHOPIFY_CLIENT_ID: 'test_client_id',
  SHOPIFY_CLIENT_SECRET: 'test_client_secret',
};

function setEnv() {
  Object.assign(process.env, ENV);
}

function clearEnv() {
  for (const key of Object.keys(ENV)) delete process.env[key];
}

const VALID_BODY = {
  variantId: 123,
  en: 200,
  boy: 260,
  pileStili: 'Düz Pile',
  pileOrani: 2.5,
  kanat: 'Çift Kanat',
  kanatCount: 2,
};

function post(body: unknown) {
  return app.request('/api/checkout/draft-order', {
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
  draftOrderOk = true,
  draftOrderId = 999,
  invoiceUrl = 'https://checkout.shopify.com/draft/999',
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
      // GET /variants/:id
      return Promise.resolve(
        variantOk
          ? new Response(JSON.stringify({ variant: { price: variantPrice, product: { title: 'Mock Perde' } } }), { status: 200 })
          : new Response('Not Found', { status: 404 }),
      );
    }
    // POST /draft_orders
    return Promise.resolve(
      draftOrderOk
        ? new Response(
            JSON.stringify({ draft_order: { id: draftOrderId, invoice_url: invoiceUrl } }),
            { status: 201 },
          )
        : new Response(JSON.stringify({ errors: 'bad' }), { status: 422 }),
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
// POST /api/checkout/draft-order — input validation
// ---------------------------------------------------------------------------

describe('POST /api/checkout/draft-order — validation', () => {
  beforeAll(setEnv);
  afterAll(clearEnv);

  test('returns 400 for invalid JSON body', async () => {
    const res = await app.request('/api/checkout/draft-order', {
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

  test('returns 400 when en = 0', async () => {
    const res = await post({ ...VALID_BODY, en: 0 });
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

  test('returns 400 for invalid pileOrani (4.0)', async () => {
    const res = await post({ ...VALID_BODY, pileOrani: 4.0 });
    expect(res.status).toBe(400);
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

  test('accepts en = 50 (lower boundary)', async () => {
    globalThis.fetch = mockShopify();
    const res = await post({ ...VALID_BODY, en: 50 });
    expect(res.status).toBe(200);
  });

  test('accepts en = 1000 (upper boundary)', async () => {
    globalThis.fetch = mockShopify();
    const res = await post({ ...VALID_BODY, en: 1000 });
    expect(res.status).toBe(200);
  });

  test('accepts boy = 1 (lower boundary)', async () => {
    globalThis.fetch = mockShopify();
    const res = await post({ ...VALID_BODY, boy: 1 });
    expect(res.status).toBe(200);
  });

  test('accepts boy = 600 (upper boundary)', async () => {
    globalThis.fetch = mockShopify();
    const res = await post({ ...VALID_BODY, boy: 600 });
    expect(res.status).toBe(200);
  });

  test('accepts pileOrani = 2.0', async () => {
    globalThis.fetch = mockShopify();
    const res = await post({ ...VALID_BODY, pileOrani: 2.0 });
    expect(res.status).toBe(200);
  });

  test('accepts pileOrani = 3.0', async () => {
    globalThis.fetch = mockShopify();
    const res = await post({ ...VALID_BODY, pileOrani: 3.0 });
    expect(res.status).toBe(200);
  });

  test('accepts kanatCount = 1', async () => {
    globalThis.fetch = mockShopify();
    const res = await post({ ...VALID_BODY, kanatCount: 1 });
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// POST /api/checkout/draft-order — Shopify API error paths
// ---------------------------------------------------------------------------

describe('POST /api/checkout/draft-order — Shopify errors', () => {
  beforeAll(setEnv);
  afterAll(clearEnv);

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

  test('returns 500 DRAFT_ORDER_FAILED when draft order creation fails', async () => {
    globalThis.fetch = mockShopify({ draftOrderOk: false });
    const res = await post(VALID_BODY);
    expect(res.status).toBe(500);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('DRAFT_ORDER_FAILED');
  });
});

// ---------------------------------------------------------------------------
// POST /api/checkout/draft-order — happy path & price calculation
// ---------------------------------------------------------------------------

describe('POST /api/checkout/draft-order — happy path', () => {
  beforeAll(setEnv);
  afterAll(clearEnv);

  test('returns checkoutUrl on success', async () => {
    globalThis.fetch = mockShopify({ invoiceUrl: 'https://checkout.shopify.com/draft/1' });
    const res = await post(VALID_BODY);
    expect(res.status).toBe(200);
    const body = await res.json() as { checkoutUrl: string };
    expect(body.checkoutUrl).toBe('https://checkout.shopify.com/draft/1');
  });

  test('price: 200cm × 2.5 × 2 panels × 230 TL/m = 2300.00', async () => {
    const bodies: string[] = [];
    globalThis.fetch = mock((url: string, init?: RequestInit) => {
      if (url.includes('access_token')) {
        return Promise.resolve(new Response(JSON.stringify({ access_token: 'tok' }), { status: 200 }));
      }
      if (url.includes('variants')) {
        return Promise.resolve(new Response(JSON.stringify({ variant: { price: '230.00', product: { title: 'Mock Perde' } } }), { status: 200 }));
      }
      bodies.push(init?.body as string);
      return Promise.resolve(new Response(
        JSON.stringify({ draft_order: { id: 1, invoice_url: 'https://x' } }), { status: 201 },
      ));
    }) as unknown as typeof fetch;

    const res = await post({ ...VALID_BODY, en: 200, pileOrani: 2.5, kanatCount: 2 });
    expect(res.status).toBe(200);

    const draftBody = JSON.parse(bodies[0]) as { draft_order: { line_items: { price: string }[] } };
    expect(draftBody.draft_order.line_items[0].price).toBe('2300.00');
  });

  test('price: 150cm × 2.0 × 1 panel × 400 TL/m = 1200.00', async () => {
    const bodies: string[] = [];
    globalThis.fetch = mock((url: string, init?: RequestInit) => {
      if (url.includes('access_token')) {
        return Promise.resolve(new Response(JSON.stringify({ access_token: 'tok' }), { status: 200 }));
      }
      if (url.includes('variants')) {
        return Promise.resolve(new Response(JSON.stringify({ variant: { price: '400.00', product: { title: 'Mock Perde' } } }), { status: 200 }));
      }
      bodies.push(init?.body as string);
      return Promise.resolve(new Response(
        JSON.stringify({ draft_order: { id: 1, invoice_url: 'https://x' } }), { status: 201 },
      ));
    }) as unknown as typeof fetch;

    const res = await post({ ...VALID_BODY, en: 150, pileOrani: 2.0, kanatCount: 1 });
    expect(res.status).toBe(200);

    const draftBody = JSON.parse(bodies[0]) as { draft_order: { line_items: { price: string }[] } };
    expect(draftBody.draft_order.line_items[0].price).toBe('1200.00');
  });

  test('draft order line item includes En, Boy, Pile Stili, Kanat properties', async () => {
    const bodies: string[] = [];
    globalThis.fetch = mock((url: string, init?: RequestInit) => {
      if (url.includes('access_token')) {
        return Promise.resolve(new Response(JSON.stringify({ access_token: 'tok' }), { status: 200 }));
      }
      if (url.includes('variants')) {
        return Promise.resolve(new Response(JSON.stringify({ variant: { price: '230.00', product: { title: 'Mock Perde' } } }), { status: 200 }));
      }
      bodies.push(init?.body as string);
      return Promise.resolve(new Response(
        JSON.stringify({ draft_order: { id: 1, invoice_url: 'https://x' } }), { status: 201 },
      ));
    }) as unknown as typeof fetch;

    await post({ ...VALID_BODY, en: 200, boy: 260, pileStili: 'Düz Pile', pileOrani: 2.5, kanat: 'Çift Kanat' });

    const draftBody = JSON.parse(bodies[0]) as {
      draft_order: { line_items: { properties: { name: string; value: string }[] }[] };
    };
    const props = draftBody.draft_order.line_items[0].properties;
    expect(props).toContainEqual({ name: 'En', value: '200 cm' });
    expect(props).toContainEqual({ name: 'Boy', value: '260 cm' });
    expect(props).toContainEqual({ name: 'Pile Stili', value: 'Düz Pile (x2.5)' });
    expect(props).toContainEqual({ name: 'Kanat', value: 'Çift Kanat' });
  });

  test('draft order line item uses server-fetched product title, not variant_id', async () => {
    const bodies: string[] = [];
    globalThis.fetch = mock((url: string, init?: RequestInit) => {
      if (url.includes('access_token')) {
        return Promise.resolve(new Response(JSON.stringify({ access_token: 'tok' }), { status: 200 }));
      }
      if (url.includes('variants')) {
        return Promise.resolve(new Response(JSON.stringify({ variant: { price: '230.00', product: { title: 'Test Perde' } } }), { status: 200 }));
      }
      bodies.push(init?.body as string);
      return Promise.resolve(new Response(
        JSON.stringify({ draft_order: { id: 1, invoice_url: 'https://x' } }), { status: 201 },
      ));
    }) as unknown as typeof fetch;

    await post(VALID_BODY);

    const draftBody = JSON.parse(bodies[0]) as {
      draft_order: { line_items: Array<{ variant_id?: number; title?: string; price: string }> };
    };
    const li = draftBody.draft_order.line_items[0];
    expect(li.variant_id).toBeUndefined();
    expect(li.title).toBe('Test Perde');
    expect(li.price).toBe('2300.00');
  });

  test('draft order line item falls back to generic title when variant has no product', async () => {
    const bodies: string[] = [];
    globalThis.fetch = mock((url: string, init?: RequestInit) => {
      if (url.includes('access_token')) {
        return Promise.resolve(new Response(JSON.stringify({ access_token: 'tok' }), { status: 200 }));
      }
      if (url.includes('variants')) {
        return Promise.resolve(new Response(JSON.stringify({ variant: { price: '230.00' } }), { status: 200 }));
      }
      bodies.push(init?.body as string);
      return Promise.resolve(new Response(
        JSON.stringify({ draft_order: { id: 1, invoice_url: 'https://x' } }), { status: 201 },
      ));
    }) as unknown as typeof fetch;

    await post(VALID_BODY);

    const draftBody = JSON.parse(bodies[0]) as { draft_order: { line_items: Array<{ title: string }> } };
    expect(draftBody.draft_order.line_items[0].title).toBe('Özel Ölçü Perde');
  });

  test('draft order does not require productTitle field', async () => {
    globalThis.fetch = mockShopify({ invoiceUrl: 'https://checkout.shopify.com/draft/2' });
    const bodyWithoutTitle = { variantId: 123, en: 200, boy: 260, pileStili: 'Düz Pile', pileOrani: 2.5, kanat: 'Çift Kanat', kanatCount: 2 };
    const res = await post(bodyWithoutTitle);
    expect(res.status).toBe(200);
  });

  test('sends Authorization header to Shopify variant and draft endpoints', async () => {
    const headers: Record<string, Record<string, string>> = {};
    globalThis.fetch = mock((url: string, init?: RequestInit) => {
      if (url.includes('access_token')) {
        return Promise.resolve(new Response(JSON.stringify({ access_token: 'tok_abc' }), { status: 200 }));
      }
      headers[url.includes('variants') ? 'variant' : 'draft'] = init?.headers as Record<string, string>;
      if (url.includes('variants')) {
        return Promise.resolve(new Response(JSON.stringify({ variant: { price: '230.00', product: { title: 'Mock Perde' } } }), { status: 200 }));
      }
      return Promise.resolve(new Response(
        JSON.stringify({ draft_order: { id: 1, invoice_url: 'https://x' } }), { status: 201 },
      ));
    }) as unknown as typeof fetch;

    await post(VALID_BODY);

    expect(headers.variant['X-Shopify-Access-Token']).toBe('tok_abc');
    expect(headers.draft['X-Shopify-Access-Token']).toBe('tok_abc');
  });

  test('price: 300cm × 3.0 × 2 panels × 230 TL/m = 4140.00', async () => {
    const bodies: string[] = [];
    globalThis.fetch = mock((url: string, init?: RequestInit) => {
      if (url.includes('access_token')) {
        return Promise.resolve(new Response(JSON.stringify({ access_token: 'tok' }), { status: 200 }));
      }
      if (url.includes('variants')) {
        return Promise.resolve(new Response(JSON.stringify({ variant: { price: '230.00', product: { title: 'Mock Perde' } } }), { status: 200 }));
      }
      bodies.push(init?.body as string);
      return Promise.resolve(new Response(
        JSON.stringify({ draft_order: { id: 1, invoice_url: 'https://x' } }), { status: 201 },
      ));
    }) as unknown as typeof fetch;

    const res = await post({ ...VALID_BODY, en: 300, pileOrani: 3.0, kanatCount: 2 });
    expect(res.status).toBe(200);

    const draftBody = JSON.parse(bodies[0]) as { draft_order: { line_items: { price: string }[] } };
    expect(draftBody.draft_order.line_items[0].price).toBe('4140.00');
  });

  test('draft order line item has requires_shipping and taxable set to true', async () => {
    const bodies: string[] = [];
    globalThis.fetch = mock((url: string, init?: RequestInit) => {
      if (url.includes('access_token')) {
        return Promise.resolve(new Response(JSON.stringify({ access_token: 'tok' }), { status: 200 }));
      }
      if (url.includes('variants')) {
        return Promise.resolve(new Response(JSON.stringify({ variant: { price: '230.00', product: { title: 'Mock Perde' } } }), { status: 200 }));
      }
      bodies.push(init?.body as string);
      return Promise.resolve(new Response(
        JSON.stringify({ draft_order: { id: 1, invoice_url: 'https://x' } }), { status: 201 },
      ));
    }) as unknown as typeof fetch;

    await post(VALID_BODY);

    const draftBody = JSON.parse(bodies[0]) as {
      draft_order: { line_items: Array<{ requires_shipping: boolean; taxable: boolean }> };
    };
    const li = draftBody.draft_order.line_items[0];
    expect(li.requires_shipping).toBe(true);
    expect(li.taxable).toBe(true);
  });

  test('draft order line item includes _variant_id in properties', async () => {
    const bodies: string[] = [];
    globalThis.fetch = mock((url: string, init?: RequestInit) => {
      if (url.includes('access_token')) {
        return Promise.resolve(new Response(JSON.stringify({ access_token: 'tok' }), { status: 200 }));
      }
      if (url.includes('variants')) {
        return Promise.resolve(new Response(JSON.stringify({ variant: { price: '230.00', product: { title: 'Mock Perde' } } }), { status: 200 }));
      }
      bodies.push(init?.body as string);
      return Promise.resolve(new Response(
        JSON.stringify({ draft_order: { id: 1, invoice_url: 'https://x' } }), { status: 201 },
      ));
    }) as unknown as typeof fetch;

    await post({ ...VALID_BODY, variantId: 456 });

    const draftBody = JSON.parse(bodies[0]) as {
      draft_order: { line_items: Array<{ properties: { name: string; value: string }[] }> };
    };
    const props = draftBody.draft_order.line_items[0].properties;
    expect(props).toContainEqual({ name: '_variant_id', value: '456' });
  });

  test('draft order note contains en, boy, pile style, and kanat', async () => {
    const bodies: string[] = [];
    globalThis.fetch = mock((url: string, init?: RequestInit) => {
      if (url.includes('access_token')) {
        return Promise.resolve(new Response(JSON.stringify({ access_token: 'tok' }), { status: 200 }));
      }
      if (url.includes('variants')) {
        return Promise.resolve(new Response(JSON.stringify({ variant: { price: '230.00', product: { title: 'Mock Perde' } } }), { status: 200 }));
      }
      bodies.push(init?.body as string);
      return Promise.resolve(new Response(
        JSON.stringify({ draft_order: { id: 1, invoice_url: 'https://x' } }), { status: 201 },
      ));
    }) as unknown as typeof fetch;

    await post({ ...VALID_BODY, en: 200, boy: 260, pileStili: 'Kanun Pile', kanat: 'Çift Kanat' });

    const draftBody = JSON.parse(bodies[0]) as { draft_order: { note: string } };
    expect(draftBody.draft_order.note).toContain('200');
    expect(draftBody.draft_order.note).toContain('260');
    expect(draftBody.draft_order.note).toContain('Kanun Pile');
    expect(draftBody.draft_order.note).toContain('Çift Kanat');
  });

  test('fetches variant with ?fields=price,product query param', async () => {
    const urls: string[] = [];
    globalThis.fetch = mock((url: string, init?: RequestInit) => {
      urls.push(url);
      if (url.includes('access_token')) {
        return Promise.resolve(new Response(JSON.stringify({ access_token: 'tok' }), { status: 200 }));
      }
      if (url.includes('variants')) {
        return Promise.resolve(new Response(JSON.stringify({ variant: { price: '230.00', product: { title: 'Mock Perde' } } }), { status: 200 }));
      }
      return Promise.resolve(new Response(
        JSON.stringify({ draft_order: { id: 1, invoice_url: 'https://x' } }), { status: 201 },
      ));
    }) as unknown as typeof fetch;

    await post(VALID_BODY);

    const variantUrl = urls.find(u => u.includes('variants'));
    expect(variantUrl).toContain('fields=price,product');
  });
});

// ---------------------------------------------------------------------------
// POST /api/checkout/draft-order — missing environment variables
// ---------------------------------------------------------------------------

describe('POST /api/checkout/draft-order — missing env', () => {
  test('returns 500 when environment variables are not set', async () => {
    clearEnv();
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response('', { status: 200 })),
    ) as unknown as typeof fetch;
    const res = await post(VALID_BODY);
    expect(res.status).toBe(500);
    setEnv();
  });
});
