# Checkout Webhook — Don't Clear Cart Until Payment Confirmed

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the empty cart problem by removing premature cart clearing and instead letting a Shopify `orders/paid` webhook (delivered to curtain-checkout-api) trigger cleanup after confirmed payment.

**Architecture:** Register a second `orders/paid` webhook subscription pointing at `https://app.inanctekstil.store/api/webhooks/orders/paid`. When creating a Draft Order, embed `cart_token` in `note_attributes` and persist `(cart_token, draft_order_id, invoice_url)` in a new `draft_orders` Postgres table. The webhook handler reads `note_attributes.cart_token` and deletes the matching `cart_items` rows. `perde-checkout.js` stops clearing the Shopify cart; the order status page script clears it instead.

**Tech Stack:** Bun, Hono, `postgres` npm, `node:crypto` (timingSafeEqual), Shopify Admin REST API 2025-01, Shopify webhook HMAC-SHA256

---

## File Map

| File | Change |
|------|--------|
| `technical/curtain-checkout-api/src/hmac.ts` | **CREATE** — HMAC-SHA256 verification utility (reusable, testable in isolation) |
| `technical/curtain-checkout-api/src/db.ts` | **MODIFY** — add `draft_orders` table + cleanup |
| `technical/curtain-checkout-api/src/app.ts` | **MODIFY** — (a) add `note_attributes` + save draft_order_id in `/api/checkout/complete`; (b) add duplicate-checkout guard; (c) add `POST /api/webhooks/orders/paid` endpoint |
| `technical/curtain-checkout-api/src/app.test.ts` | **MODIFY** — tests for webhook endpoint + note_attributes + duplicate guard |
| `technical/theme/assets/perde-checkout.js` | **MODIFY** — remove the premature `/cart/clear.js` call |

---

## Task 1: HMAC utility (`src/hmac.ts`)

**Files:**
- Create: `technical/curtain-checkout-api/src/hmac.ts`
- Test: `technical/curtain-checkout-api/src/app.test.ts` (add at the top before existing tests)

- [ ] **Step 1: Write the failing test**

Add this block at the top of `src/app.test.ts`, before any existing `describe` block:

```typescript
import { verifyShopifyHmac } from './hmac.ts';
import { createHmac } from 'node:crypto';

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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd technical/curtain-checkout-api && bun test --testNamePattern "verifyShopifyHmac" 2>&1 | head -20
```

Expected: error — `Cannot find module './hmac.ts'`

- [ ] **Step 3: Create `src/hmac.ts`**

```typescript
import { timingSafeEqual } from "node:crypto";

/**
 * Verify Shopify webhook HMAC-SHA256 signature.
 * Uses node:crypto timingSafeEqual — NOT crypto.subtle.timingSafeEqual.
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
  const a = Buffer.from(computed);
  const b = Buffer.from(headerHmac);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd technical/curtain-checkout-api && bun test --testNamePattern "verifyShopifyHmac" 2>&1
```

Expected: 4 passing

- [ ] **Step 5: Commit**

```bash
cd technical/curtain-checkout-api
git add src/hmac.ts src/app.test.ts
git commit -m "feat(curtain-checkout-api): add HMAC verification utility"
```

---

## Task 2: `draft_orders` table in PostgreSQL

**Files:**
- Modify: `technical/curtain-checkout-api/src/db.ts`

No unit test — schema DDL is verified by Task 3 integration tests that hit the mocked SQL.

- [ ] **Step 1: Add `draft_orders` table to `db.ts`**

Replace the entire file:

```typescript
import postgres from "postgres";

export let sql: postgres.Sql = null as any; // eslint-disable-line @typescript-eslint/no-explicit-any

const CREATE_CART_ITEMS = `
  CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    cart_token TEXT NOT NULL,
    variant_id BIGINT NOT NULL,
    product_title TEXT NOT NULL,
    en_cm INT NOT NULL,
    boy_cm INT NOT NULL,
    pile_stili TEXT NOT NULL,
    pile_orani DECIMAL(4,2) NOT NULL,
    kanat TEXT NOT NULL,
    kanat_count INT NOT NULL,
    base_price_per_meter DECIMAL(10,2) NOT NULL,
    calculated_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`;

const CREATE_CART_ITEMS_INDEX = `
  CREATE UNIQUE INDEX IF NOT EXISTS cart_items_token_variant_idx
  ON cart_items(cart_token, variant_id)
`;

const ALTER_ADD_PRODUCT_ID = `
  ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS product_id BIGINT
`;

const CREATE_DRAFT_ORDERS = `
  CREATE TABLE IF NOT EXISTS draft_orders (
    id SERIAL PRIMARY KEY,
    cart_token TEXT NOT NULL,
    shopify_draft_order_id BIGINT NOT NULL,
    invoice_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`;

const CREATE_DRAFT_ORDERS_INDEX = `
  CREATE UNIQUE INDEX IF NOT EXISTS draft_orders_shopify_id_idx
  ON draft_orders(shopify_draft_order_id)
`;

const CREATE_DRAFT_ORDERS_TOKEN_INDEX = `
  CREATE INDEX IF NOT EXISTS draft_orders_cart_token_idx
  ON draft_orders(cart_token)
`;

async function cleanup() {
  await sql`DELETE FROM cart_items WHERE created_at < NOW() - INTERVAL '7 days'`;
  await sql`DELETE FROM draft_orders WHERE status = 'pending' AND created_at < NOW() - INTERVAL '7 days'`;
}

export async function initDb(): Promise<void> {
  const url = process.env.CURTAIN_DATABASE_URL;
  if (!url) throw new Error("CURTAIN_DATABASE_URL is required");
  sql = postgres(url);
  await sql.unsafe(CREATE_CART_ITEMS);
  await sql.unsafe(CREATE_CART_ITEMS_INDEX);
  await sql.unsafe(ALTER_ADD_PRODUCT_ID);
  await sql.unsafe(CREATE_DRAFT_ORDERS);
  await sql.unsafe(CREATE_DRAFT_ORDERS_INDEX);
  await sql.unsafe(CREATE_DRAFT_ORDERS_TOKEN_INDEX);
  await cleanup();
  setInterval(cleanup, 24 * 60 * 60 * 1000);
}
```

- [ ] **Step 2: Commit**

```bash
cd technical/curtain-checkout-api
git add src/db.ts
git commit -m "feat(curtain-checkout-api): add draft_orders table with 7-day TTL cleanup"
```

---

## Task 3: Update `/api/checkout/complete` — add `note_attributes`, save draft order, duplicate guard

**Files:**
- Modify: `technical/curtain-checkout-api/src/app.ts`
- Test: `technical/curtain-checkout-api/src/app.test.ts`

### What changes in `/api/checkout/complete`:
1. Before creating a new Draft Order, check `draft_orders` for an existing `pending` row with the same `cart_token` — if found, return its stored `invoice_url` immediately (no second Draft Order created).
2. Add `note_attributes: [{ name: "cart_token", value: cartToken }]` to the Draft Order payload.
3. After creating the Draft Order, INSERT into `draft_orders`. Do **not** delete `cart_items` here anymore.

- [ ] **Step 1: Write failing tests**

Add this `describe` block to `src/app.test.ts` (inside the existing `describe('/api/checkout/complete')` block or right after it):

```typescript
describe('/api/checkout/complete — new draft order behavior', () => {
  beforeEach(() => {
    setEnv();
    rateLimitMap.clear();
    mockState.sqlQueue = [];
    mockState.sqlCalls = [];
  });
  afterAll(clearEnv);

  test('sends note_attributes with cart_token in draft order payload', async () => {
    mockState.sqlQueue.push([]); // pending draft_orders check → none found
    mockState.sqlQueue.push(SAMPLE_ROWS); // cart_items SELECT
    mockState.sqlQueue.push([]); // INSERT draft_orders

    const draftBodies: string[] = [];
    globalThis.fetch = mock((url: string, opts: RequestInit) => {
      if (String(url).includes('/admin/oauth/access_token')) {
        return Promise.resolve(new Response(JSON.stringify({ access_token: 'tok' }), { status: 200 }));
      }
      draftBodies.push(opts.body as string);
      return Promise.resolve(
        new Response(JSON.stringify({ draft_order: { id: 42, invoice_url: 'https://x' } }), { status: 201 }),
      );
    }) as unknown as typeof fetch;

    await postComplete({ cartToken: 'abc123' });

    const payload = JSON.parse(draftBodies[0]) as {
      draft_order: { note_attributes: Array<{ name: string; value: string }> };
    };
    const attr = payload.draft_order.note_attributes?.find((a) => a.name === 'cart_token');
    expect(attr).toBeDefined();
    expect(attr?.value).toBe('abc123');
  });

  test('saves draft_order_id and invoice_url to draft_orders table', async () => {
    mockState.sqlQueue.push([]); // pending check
    mockState.sqlQueue.push(SAMPLE_ROWS);
    mockState.sqlQueue.push([]); // INSERT

    globalThis.fetch = mock((url: string) => {
      if (String(url).includes('/admin/oauth/access_token')) {
        return Promise.resolve(new Response(JSON.stringify({ access_token: 'tok' }), { status: 200 }));
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({ draft_order: { id: 777, invoice_url: 'https://invoice/777' } }),
          { status: 201 },
        ),
      );
    }) as unknown as typeof fetch;

    await postComplete({ cartToken: 'abc123' });

    // 3rd SQL call should be the INSERT into draft_orders
    const insertValues = mockState.sqlCalls[2];
    expect(insertValues).toContain('abc123');   // cart_token
    expect(insertValues).toContain(777);        // shopify_draft_order_id
    expect(insertValues).toContain('https://invoice/777'); // invoice_url
  });

  test('does NOT delete cart_items after draft order creation', async () => {
    mockState.sqlQueue.push([]); // pending check
    mockState.sqlQueue.push(SAMPLE_ROWS);
    mockState.sqlQueue.push([]); // INSERT draft_orders

    globalThis.fetch = mock((url: string) => {
      if (String(url).includes('/admin/oauth/access_token')) {
        return Promise.resolve(new Response(JSON.stringify({ access_token: 'tok' }), { status: 200 }));
      }
      return Promise.resolve(
        new Response(JSON.stringify({ draft_order: { id: 1, invoice_url: 'https://x' } }), { status: 201 }),
      );
    }) as unknown as typeof fetch;

    await postComplete({ cartToken: 'abc123' });

    // Should be exactly 3 SQL calls: pending check, SELECT cart_items, INSERT draft_orders
    // No DELETE call
    expect(mockState.sqlCalls.length).toBe(3);
    // Verify none of the call arg lists contain a DELETE pattern
    const flatArgs = mockState.sqlCalls.flat().map(String);
    expect(flatArgs.some((v) => v.includes('DELETE'))).toBe(false);
  });

  test('returns existing invoice_url when a pending draft order already exists for cart_token', async () => {
    // First SQL call returns an existing pending row
    mockState.sqlQueue.push([
      {
        shopify_draft_order_id: 55,
        invoice_url: 'https://existing-invoice/55',
        status: 'pending',
      },
    ]);
    // No further SQL calls or fetch calls should happen

    let fetchCalled = false;
    globalThis.fetch = mock(() => {
      fetchCalled = true;
      return Promise.resolve(new Response('{}', { status: 200 }));
    }) as unknown as typeof fetch;

    const res = await postComplete({ cartToken: 'abc123' });
    const data = await res.json() as { checkoutUrl: string };

    expect(res.status).toBe(200);
    expect(data.checkoutUrl).toBe('https://existing-invoice/55');
    expect(fetchCalled).toBe(false); // no Shopify API call made
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd technical/curtain-checkout-api && bun test --testNamePattern "new draft order behavior" 2>&1
```

Expected: 4 failing tests

- [ ] **Step 3: Update `/api/checkout/complete` in `src/app.ts`**

Replace the section from line 224 (`app.post("/api/checkout/complete"`) through the closing `});` with:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd technical/curtain-checkout-api && bun test --testNamePattern "new draft order behavior" 2>&1
```

Expected: 4 passing

- [ ] **Step 5: Run full test suite to check for regressions**

```bash
cd technical/curtain-checkout-api && bun test 2>&1 | tail -20
```

Expected: all existing tests still pass (the new behaviour is additive — the only breaking change is removing the final `DELETE`, and the existing tests only checked `sqlCalls.length` around that area; verify no existing test asserts a DELETE at position 3)

> **If a test asserts a DELETE call exists:** update it to not expect the DELETE. Those tests were asserting the old (incorrect) behavior.

- [ ] **Step 6: Commit**

```bash
cd technical/curtain-checkout-api
git add src/app.ts src/app.test.ts
git commit -m "feat(curtain-checkout-api): embed cart_token in draft order, save draft_order_id, add duplicate-checkout guard"
```

---

## Task 4: `POST /api/webhooks/orders/paid` endpoint

**Files:**
- Modify: `technical/curtain-checkout-api/src/app.ts`
- Test: `technical/curtain-checkout-api/src/app.test.ts`

The endpoint:
1. Reads raw body as text (required for HMAC — must come before JSON parse)
2. Verifies `x-shopify-hmac-sha256` header using `SHOPIFY_WEBHOOK_SECRET`
3. Parses JSON, finds `note_attributes` array, looks for `{ name: "cart_token" }`
4. If found: deletes `cart_items` for that token + marks `draft_orders` row as `paid`
5. Always returns `200` — non-200 causes Shopify to retry 19× over 48h

- [ ] **Step 1: Write failing tests**

Add this `describe` block to `src/app.test.ts`:

```typescript
import { createHmac } from 'node:crypto';

describe('POST /api/webhooks/orders/paid', () => {
  const WEBHOOK_SECRET = 'test_webhook_secret_456';

  function makeOrderPayload(noteAttributes: Array<{ name: string; value: string }> = []) {
    return JSON.stringify({
      id: 1001,
      order_number: 5001,
      source_name: 'draft_order',
      note_attributes: noteAttributes,
    });
  }

  function sign(body: string, secret = WEBHOOK_SECRET): string {
    return createHmac('sha256', secret).update(body).digest('base64');
  }

  function postWebhook(body: string, hmac: string) {
    return app.request('/api/webhooks/orders/paid', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shopify-hmac-sha256': hmac,
      },
      body,
    });
  }

  beforeEach(() => {
    process.env.SHOPIFY_WEBHOOK_SECRET = WEBHOOK_SECRET;
    mockState.sqlQueue = [];
    mockState.sqlCalls = [];
  });

  afterAll(() => {
    delete process.env.SHOPIFY_WEBHOOK_SECRET;
  });

  test('returns 401 when HMAC is invalid', async () => {
    const body = makeOrderPayload();
    const res = await postWebhook(body, 'bad_hmac');
    expect(res.status).toBe(401);
  });

  test('returns 500 when SHOPIFY_WEBHOOK_SECRET is not set', async () => {
    delete process.env.SHOPIFY_WEBHOOK_SECRET;
    const body = makeOrderPayload();
    const res = await postWebhook(body, sign(body));
    expect(res.status).toBe(500);
  });

  test('returns 200 and is a no-op when note_attributes has no cart_token', async () => {
    const body = makeOrderPayload([{ name: 'other_key', value: 'other_value' }]);
    const res = await postWebhook(body, sign(body));
    expect(res.status).toBe(200);
    expect(mockState.sqlCalls.length).toBe(0);
  });

  test('returns 200 and is a no-op when note_attributes is absent', async () => {
    const body = JSON.stringify({ id: 999, order_number: 1 });
    const res = await postWebhook(body, sign(body));
    expect(res.status).toBe(200);
    expect(mockState.sqlCalls.length).toBe(0);
  });

  test('deletes cart_items and marks draft_orders as paid when cart_token found', async () => {
    mockState.sqlQueue.push([]); // DELETE cart_items
    mockState.sqlQueue.push([]); // UPDATE draft_orders

    const body = makeOrderPayload([{ name: 'cart_token', value: 'token_abc' }]);
    const res = await postWebhook(body, sign(body));

    expect(res.status).toBe(200);
    expect(mockState.sqlCalls.length).toBe(2);
    // First call args contain the cart_token
    expect(mockState.sqlCalls[0]).toContain('token_abc');
    // Second call args contain the cart_token too (UPDATE)
    expect(mockState.sqlCalls[1]).toContain('token_abc');
  });

  test('returns 200 even when DB operations fail (Shopify must not retry)', async () => {
    mockState.sqlQueue.push(new Error('DB down'));

    const body = makeOrderPayload([{ name: 'cart_token', value: 'token_abc' }]);
    const res = await postWebhook(body, sign(body));
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd technical/curtain-checkout-api && bun test --testNamePattern "POST /api/webhooks/orders/paid" 2>&1
```

Expected: 6 failing (route doesn't exist yet)

- [ ] **Step 3: Add import and endpoint to `src/app.ts`**

At the top of `src/app.ts`, add the import (after existing imports):

```typescript
import { verifyShopifyHmac } from "./hmac.ts";
```

Then add this endpoint after the `/api/checkout/complete` handler (before the final `export`):

```typescript
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
```

- [ ] **Step 4: Run webhook tests**

```bash
cd technical/curtain-checkout-api && bun test --testNamePattern "POST /api/webhooks/orders/paid" 2>&1
```

Expected: 6 passing

- [ ] **Step 5: Run full test suite**

```bash
cd technical/curtain-checkout-api && bun test 2>&1 | tail -20
```

Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
cd technical/curtain-checkout-api
git add src/app.ts src/app.test.ts
git commit -m "feat(curtain-checkout-api): add orders/paid webhook endpoint with HMAC verification"
```

---

## Task 5: Remove premature cart clearing from `perde-checkout.js`

**Files:**
- Modify: `technical/theme/assets/perde-checkout.js`

- [ ] **Step 1: Remove the `/cart/clear.js` call**

In `technical/theme/assets/perde-checkout.js`, remove line 80:

```javascript
// REMOVE this line:
fetch('/cart/clear.js', { method: 'POST' }).catch(function () {});
```

The surrounding block (lines 76–86) should now look like:

```javascript
            return res.json().then(function (data) {
              if (data && data.checkoutUrl) {
                log('redirecting to draft order checkout', { url: data.checkoutUrl.substring(0, 60) });
                window.location.href = data.checkoutUrl;
              } else {
                log('no checkoutUrl in response — falling through');
                window.location.href = originalHref;
              }
            });
```

- [ ] **Step 2: Commit**

```bash
cd /Users/semsettin/workspace/inanc-tekstil
git add technical/theme/assets/perde-checkout.js
git commit -m "fix(theme): don't clear Shopify cart before draft order checkout redirect"
```

---

## Task 6: Verify `SHOPIFY_WEBHOOK_SECRET` is available to `curtain-app` container

**Files:**
- Read: `/opt/inanctekstil/docker-compose.yml` (on server)

- [ ] **Step 1: SSH and check docker-compose env config**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "grep -A 20 'curtain-app' /opt/inanctekstil/docker-compose.yml"
```

Look for whether `curtain-app` uses `env_file: .env` or explicit `environment:` entries.

- [ ] **Step 2: If `curtain-app` already uses the shared `.env` file**

Verify `SHOPIFY_WEBHOOK_SECRET` is in the `.env` file:

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "grep SHOPIFY_WEBHOOK_SECRET /opt/inanctekstil/.env"
```

If it's there — nothing to do. Move to Task 7.

- [ ] **Step 3: If `SHOPIFY_WEBHOOK_SECRET` is missing from `.env`**

Find the value used by analytics-forwarder (same secret, same Shopify app):

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "grep SHOPIFY_WEBHOOK_SECRET /opt/inanctekstil/.env || echo 'NOT FOUND'"
```

If not found, retrieve it from Shopify Partner Dashboard → your app → Webhooks → Signing secret, then add it:

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "echo 'SHOPIFY_WEBHOOK_SECRET=<value>' >> /opt/inanctekstil/.env"
```

- [ ] **Step 4: If `curtain-app` does NOT use `env_file`**

Add `SHOPIFY_WEBHOOK_SECRET` to the `curtain-app` environment block in `docker-compose.yml`:

```yaml
curtain-app:
  environment:
    - SHOPIFY_WEBHOOK_SECRET=${SHOPIFY_WEBHOOK_SECRET}
```

---

## Task 7: Deploy `curtain-checkout-api` to server

- [ ] **Step 1: Copy updated source files to server**

```bash
cd /Users/semsettin/workspace/inanc-tekstil/technical/curtain-checkout-api
scp -i ~/.ssh/inanctekstil src/hmac.ts src/db.ts src/app.ts \
  root@5.75.165.158:/opt/curtain-checkout-api/src/
```

- [ ] **Step 2: Rebuild and restart the container**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 \
  "cd /opt/inanctekstil && docker compose up -d --build curtain-app"
```

- [ ] **Step 3: Verify health endpoint**

```bash
curl -s https://app.inanctekstil.store/health
```

Expected: `{"status":"ok","uptime":<n>}`

- [ ] **Step 4: Push theme file**

```bash
cd /Users/semsettin/workspace/inanc-tekstil
shopify theme push --theme 193714913361 \
  --store 1z7hb1-2d.myshopify.com \
  --only "assets/perde-checkout.js" \
  --nodelete --path technical/theme
```

---

## Task 8: Register `orders/paid` webhook in Shopify

Shopify must be told to POST to the new endpoint. Do this via the Admin REST API.

- [ ] **Step 1: Register the webhook**

Replace `<ACCESS_TOKEN>` with the current `SHOPIFY_ACCESS_TOKEN` from `/opt/inanctekstil/.env`:

```bash
curl -s -X POST \
  "https://1z7hb1-2d.myshopify.com/admin/api/2025-01/webhooks.json" \
  -H "X-Shopify-Access-Token: <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook": {
      "topic": "orders/paid",
      "address": "https://app.inanctekstil.store/api/webhooks/orders/paid",
      "format": "json"
    }
  }'
```

Expected response contains `"id": <number>` — note this ID for verification.

- [ ] **Step 2: Verify it was registered**

```bash
curl -s \
  "https://1z7hb1-2d.myshopify.com/admin/api/2025-01/webhooks.json?topic=orders/paid" \
  -H "X-Shopify-Access-Token: <ACCESS_TOKEN>"
```

Expected: response includes `"address": "https://app.inanctekstil.store/api/webhooks/orders/paid"`

> **Note:** The existing `orders/paid` webhook at `hooks.inanctekstil.store` (analytics-forwarder) will continue to fire independently. Both receive the same event. No conflict.

---

## Task 9: Add order status page script to clear Shopify cart after payment

This client-side script runs in the user's browser on Shopify's order confirmation page and clears the Shopify cart once the user has successfully paid.

- [ ] **Step 1: Go to Shopify admin → Settings → Checkout**

Navigate to: `https://1z7hb1-2d.myshopify.com/admin/settings/checkout`

Scroll to **Order status page** → **Additional scripts** text area.

- [ ] **Step 2: Add this script**

```html
{% if checkout.source_name == 'draft_order' %}
<script>
  fetch('/cart/clear.js', { method: 'POST' }).catch(function () {});
</script>
{% endif %}
```

The `checkout.source_name == 'draft_order'` guard ensures the cart is only cleared for orders that came through the curtain configurator flow, not for normal Shopify checkout orders.

- [ ] **Step 3: Save and verify**

Click **Save**. Make a test purchase through the curtain configurator and confirm the Shopify cart is empty after reaching the order confirmation page.

---

## Self-Review

**Spec coverage check:**

| Requirement | Task |
|-------------|------|
| Cart not cleared on redirect | Task 5 |
| Draft order ID stored in DB | Task 3 |
| `cart_token` embedded in draft order | Task 3 |
| Webhook endpoint with HMAC verification | Task 4 |
| `cart_items` deleted after confirmed payment | Task 4 |
| `draft_orders` marked paid after webhook | Task 4 |
| Duplicate checkout guard (no double draft orders) | Task 3 |
| 7-day TTL cleanup for orphaned draft_orders | Task 2 |
| Cart cleared in browser after payment | Task 9 |
| Webhook registered in Shopify | Task 8 |
| Env var available to container | Task 6 |
| Deployed to production | Task 7 |

**Type consistency:** `ShopifyOrderWebhook.note_attributes` defined in Task 4 matches the test assertions in Task 4. `draft_orders` column names (`cart_token`, `shopify_draft_order_id`, `invoice_url`, `status`) defined in Task 2 are used consistently in Tasks 3 and 4.

**No placeholders found.**
