# PostHog Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate PostHog EU Cloud analytics into inanctekstil.store with a managed reverse proxy for iOS resilience, storefront event tracking via the Shopify theme, and a dedicated server-side `analytics-forwarder` service for 100%-reliable `order_completed` capture via Shopify webhook.

**Architecture:** PostHog JS is injected into `theme.liquid` via a new snippet and routes all requests through a managed proxy subdomain (`svc.inanctekstil.store`) so Safari ITP and ad blockers cannot interfere. A separate Bun/Hono service (`analytics-forwarder`) receives Shopify's `orders/paid` webhook, verifies the HMAC signature, and forwards a structured `order_completed` event to PostHog's server ingest API — no browser required for order data. A lightweight KVKK consent banner gates all browser-side capture behind explicit user acceptance.

**Tech Stack:** Bun, Hono, bun:test, Shopify Liquid, Terraform (hcloud provider), Docker Compose, Traefik

---

## Spec

`docs/superpowers/specs/2026-03-19-posthog-analytics-design.md`

---

## File Map

### New files
| File | Responsibility |
|------|---------------|
| `technical/analytics-forwarder/src/app.ts` | Hono app: `/health` + `/webhooks/shopify/orders-paid` |
| `technical/analytics-forwarder/src/server.ts` | Bun.serve() entry point |
| `technical/analytics-forwarder/src/app.test.ts` | bun:test suite for all endpoint behaviour |
| `technical/analytics-forwarder/package.json` | Bun project config |
| `technical/analytics-forwarder/tsconfig.json` | TypeScript config |
| `technical/analytics-forwarder/Dockerfile` | Production container |
| `technical/analytics-forwarder/.dockerignore` | Exclude node_modules from build context |
| `technical/theme/snippets/posthog-analytics.liquid` | PostHog init + page-type events |
| `technical/theme/snippets/cookie-consent.liquid` | KVKK consent banner |

### Modified files
| File | Change |
|------|--------|
| `technical/theme/layout/theme.liquid` | Render posthog-analytics in `<head>`, cookie-consent before `</body>` |
| `technical/theme/sections/curtain-configurator.liquid` | Add add_to_cart + calculator_completed events |
| `technical/gitopsprod/dns.tf` | Add `svc` CNAME + `hooks` A record |

---

## Task 1: analytics-forwarder — project scaffold

**Files:**
- Create: `technical/analytics-forwarder/package.json`
- Create: `technical/analytics-forwarder/tsconfig.json`
- Create: `technical/analytics-forwarder/src/server.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "analytics-forwarder",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "bun src/server.ts",
    "dev": "bun --hot src/server.ts",
    "test": "bun test src/",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "hono": "^4.6.0"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json** (mirror curtain-checkout-api pattern)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "types": ["bun-types"]
  }
}
```

- [ ] **Step 3: Create src/server.ts**

```typescript
import { app } from "./app.ts";

const port = parseInt(process.env.PORT ?? "3000", 10);
const server = Bun.serve({ port, fetch: app.fetch });
console.log(JSON.stringify({
  time: new Date().toISOString(),
  level: "INFO",
  msg: "analytics-forwarder ready",
  port: server.port,
}));
```

- [ ] **Step 4: Install dependencies**

```bash
cd technical/analytics-forwarder && bun install
```

Expected: `bun.lock` created, `node_modules/hono` present.

- [ ] **Step 5: Commit**

```bash
git add technical/analytics-forwarder/package.json technical/analytics-forwarder/tsconfig.json technical/analytics-forwarder/src/server.ts technical/analytics-forwarder/bun.lock
git commit -m "feat(analytics-forwarder): scaffold Bun/Hono service"
```

---

## Task 2: analytics-forwarder — /health endpoint (TDD)

**Files:**
- Create: `technical/analytics-forwarder/src/app.ts`
- Create: `technical/analytics-forwarder/src/app.test.ts`

- [ ] **Step 1: Write failing test**

Create `technical/analytics-forwarder/src/app.test.ts`:

```typescript
import { describe, test, expect } from 'bun:test';
import { app } from './app.ts';

describe('GET /health', () => {
  test('returns 200 with { status: "ok" }', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('ok');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd technical/analytics-forwarder && bun test src/
```

Expected: error — `app.ts` not found.

- [ ] **Step 3: Create minimal app.ts**

Create `technical/analytics-forwarder/src/app.ts`:

```typescript
import { Hono } from "hono";

function log(level: "INFO" | "WARN" | "ERROR", msg: string, data?: Record<string, unknown>) {
  const entry = { time: new Date().toISOString(), level, msg, ...data };
  if (level === "ERROR") console.error(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}

export { log };

export const app = new Hono();

app.get("/health", (c) => c.json({ status: "ok" }));
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd technical/analytics-forwarder && bun test src/
```

Expected: `GET /health > returns 200 with { status: "ok" }` ✓

- [ ] **Step 5: Commit**

```bash
git add technical/analytics-forwarder/src/app.ts technical/analytics-forwarder/src/app.test.ts
git commit -m "feat(analytics-forwarder): add /health endpoint"
```

---

## Task 3: analytics-forwarder — HMAC verification (TDD)

This task implements and tests the HMAC helper in isolation before wiring it into the webhook endpoint.

**Files:**
- Modify: `technical/analytics-forwarder/src/app.ts`
- Modify: `technical/analytics-forwarder/src/app.test.ts`

- [ ] **Step 1: Write failing HMAC tests**

Add to `app.test.ts`:

```typescript
import { verifyShopifyHmac } from './app.ts';

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
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd technical/analytics-forwarder && bun test src/
```

Expected: `verifyShopifyHmac` is not exported.

- [ ] **Step 3: Implement verifyShopifyHmac in app.ts**

Add to the top of `app.ts`:

```typescript
import { timingSafeEqual } from "node:crypto";
```

Add the function after imports, before the Hono app:

```typescript
/**
 * Constant-time HMAC-SHA256 verification.
 * Uses Node.js crypto.timingSafeEqual — NOT crypto.subtle.timingSafeEqual
 * (timingSafeEqual is a Node.js API, not part of Web Crypto).
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

  // Constant-time comparison via Node.js crypto module (available in Bun)
  const a = Buffer.from(computed);
  const b = Buffer.from(headerHmac);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd technical/analytics-forwarder && bun test src/
```

Expected: all 4 HMAC tests + health test pass.

- [ ] **Step 5: Commit**

```bash
git add technical/analytics-forwarder/src/app.ts technical/analytics-forwarder/src/app.test.ts
git commit -m "feat(analytics-forwarder): add constant-time HMAC verification"
```

---

## Task 4: analytics-forwarder — webhook endpoint (TDD)

**Files:**
- Modify: `technical/analytics-forwarder/src/app.ts`
- Modify: `technical/analytics-forwarder/src/app.test.ts`

- [ ] **Step 1: Write failing webhook tests**

Add to `app.test.ts`. First add the HMAC helper at top of file (reuse `makeHmac` from Task 3).

```typescript
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
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd technical/analytics-forwarder && bun test src/
```

Expected: 404 on POST `/webhooks/shopify/orders-paid` (route not defined).

- [ ] **Step 3: Implement the webhook handler in app.ts**

Add to `app.ts` after the health route:

```typescript
interface ShopifyLineItem {
  title: string;
  price: string;
  quantity: number;
  product_id: number;
  variant_id: number;
}

interface ShopifyOrder {
  id: number;
  order_number: number;
  created_at: string;
  total_price: string;
  currency: string;
  customer?: { email?: string } | null;
  line_items: ShopifyLineItem[];
}

app.post("/webhooks/shopify/orders-paid", async (c) => {
  const headerHmac = c.req.header("x-shopify-hmac-sha256") ?? "";
  const rawBody = await c.req.text();

  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    log("ERROR", "SHOPIFY_WEBHOOK_SECRET not set");
    return c.json({ error: "CONFIG_ERROR" }, 500);
  }

  const valid = await verifyShopifyHmac(secret, rawBody, headerHmac);
  if (!valid) {
    log("WARN", "Invalid webhook HMAC — rejected");
    return c.json({ error: "UNAUTHORIZED" }, 401);
  }

  let order: ShopifyOrder;
  try {
    order = JSON.parse(rawBody) as ShopifyOrder;
  } catch {
    log("WARN", "Webhook body is not valid JSON");
    return c.json({ error: "INVALID_JSON" }, 400);
  }

  const distinctId = order.customer?.email ?? `shopify_order_${order.id}`;

  try {
    const posthogRes = await fetch("https://eu.i.posthog.com/capture/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.POSTHOG_API_KEY,
        event: "order_completed",
        distinct_id: distinctId,
        timestamp: order.created_at,
        properties: {
          order_id: String(order.id),
          order_number: order.order_number,
          order_total: parseFloat(order.total_price),
          currency: order.currency,
          item_count: order.line_items.length,
          items: order.line_items.map((item) => ({
            name: item.title,
            price: parseFloat(item.price),
            quantity: item.quantity,
            product_id: String(item.product_id),
            variant_id: String(item.variant_id),
          })),
          $source: "shopify_webhook",
        },
      }),
    });

    if (!posthogRes.ok) {
      log("ERROR", "PostHog capture returned non-2xx", { status: posthogRes.status, orderId: order.id });
    } else {
      log("INFO", "order_completed captured", { orderId: order.id, distinctId });
    }
  } catch (err) {
    // Network failure — log and continue. Must still return 200 to Shopify.
    log("ERROR", "PostHog capture threw", { orderId: order.id, err: String(err) });
  }

  // Always 200 — non-200 causes Shopify to retry up to 19 times over 48h
  return c.json({ ok: true });
});
```

- [ ] **Step 4: Run tests — expect all PASS**

```bash
cd technical/analytics-forwarder && bun test src/
```

Expected: all tests pass including health + HMAC + webhook suite.

- [ ] **Step 5: Type-check**

```bash
cd technical/analytics-forwarder && bun run typecheck
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add technical/analytics-forwarder/src/app.ts technical/analytics-forwarder/src/app.test.ts
git commit -m "feat(analytics-forwarder): webhook handler with HMAC verification and PostHog forwarding"
```

---

## Task 5: analytics-forwarder — Dockerfile

**Files:**
- Create: `technical/analytics-forwarder/Dockerfile`

- [ ] **Step 1: Create .dockerignore**

```
node_modules
```

This prevents local `node_modules/` from being included in the Docker build context (same requirement as PMS service).

- [ ] **Step 2: Create Dockerfile** (mirror curtain-checkout-api pattern — use `oven/bun:1.2-alpine` to match existing services)

```dockerfile
FROM oven/bun:1.2-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

FROM base
COPY --from=deps /app/node_modules ./node_modules
COPY src/ ./src/
COPY package.json ./

EXPOSE 3000
CMD ["bun", "src/server.ts"]
```

- [ ] **Step 3: Verify build locally**

```bash
cd technical/analytics-forwarder && docker build -t analytics-forwarder:local .
```

Expected: image builds successfully.

- [ ] **Step 4: Smoke-test the container**

```bash
docker run --rm -p 3333:3000 \
  -e SHOPIFY_WEBHOOK_SECRET=test \
  -e POSTHOG_API_KEY=test \
  analytics-forwarder:local &
sleep 2
curl -s http://localhost:3333/health
```

Expected: `{"status":"ok"}`

```bash
docker stop $(docker ps -q --filter ancestor=analytics-forwarder:local)
```

- [ ] **Step 5: Commit**

```bash
git add technical/analytics-forwarder/Dockerfile technical/analytics-forwarder/.dockerignore
git commit -m "feat(analytics-forwarder): add Dockerfile and .dockerignore"
```

---

## Task 6: DNS records — Terraform

**Files:**
- Modify: `technical/gitopsprod/dns.tf`

The existing pattern in `dns.tf` uses `hcloud_zone_record` with `zone = hcloud_zone.main.id`. Add two records at the end of the file.

- [ ] **Step 1: Add DNS records to dns.tf**

Append to `technical/gitopsprod/dns.tf`:

```hcl
# PostHog managed reverse proxy
# Fill in 'value' after creating the proxy in PostHog Admin → Organization Settings → Proxy
resource "hcloud_zone_record" "posthog_proxy" {
  zone  = hcloud_zone.main.id
  name  = "svc"
  type  = "CNAME"
  value = "REPLACE_WITH_POSTHOG_CNAME_TARGET."
}

# analytics-forwarder webhook receiver
resource "hcloud_zone_record" "hooks" {
  zone  = hcloud_zone.main.id
  name  = "hooks"
  type  = "A"
  value = "5.75.165.158"
}
```

- [ ] **Step 2: Validate Terraform**

```bash
cd technical/gitopsprod && terraform validate
```

Expected: `Success! The configuration is valid.`

- [ ] **Step 3: Commit**

```bash
git add technical/gitopsprod/dns.tf
git commit -m "feat(dns): add posthog proxy CNAME and hooks A record"
```

Note: Do NOT apply yet. The PostHog CNAME target is still a placeholder. Apply happens in Task 10 after the proxy is created in PostHog Admin.

---

## Task 7: Shopify theme — posthog-analytics snippet

**Files:**
- Create: `technical/theme/snippets/posthog-analytics.liquid`
- Modify: `technical/theme/layout/theme.liquid`

The PostHog loader snippet is copied verbatim from `https://posthog.com/docs/getting-started/install?tab=snippet` (the array.js bootstrap). Do not hand-write it — copy from that page at implementation time to get the current version.

- [ ] **Step 1: Create posthog-analytics.liquid**

```liquid
{% comment %}PostHog Analytics — loaded on every page via theme.liquid{% endcomment %}
<script>
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(a!==void 0?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+" (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

  posthog.init('phc_knhZGJSkRM7w0MmIssVXa7U6QzDiGipYDXu4xwyflQp', {
    api_host: 'https://svc.inanctekstil.store',
    ui_host: 'https://eu.posthog.com',
    capture_pageview: true,
    capture_pageleave: true,
    session_recording: { maskAllInputs: true },
    persistence: 'localStorage+cookie',
    enable_heatmaps: true,
    opt_out_capturing_by_default: true
  });

  {% if request.page_type == 'product' %}
  posthog.capture('product_viewed', {
    product_id: {{ product.id | json }},
    product_name: {{ product.title | json }},
    price: {{ product.price | divided_by: 100.0 }},
    category: {{ product.collections.first.title | default: '' | json }}
  });
  {% endif %}

  {% if request.page_type == 'collection' %}
  posthog.capture('category_viewed', {
    category_name: {{ collection.title | json }},
    category_handle: {{ collection.handle | json }}
  });
  {% endif %}
</script>
```

Note on `opt_out_capturing_by_default: true`: all `posthog.capture()` calls above are safe no-ops until the user accepts consent via the cookie banner. PostHog silently drops events while opted out.

Note on `capture_performance` / web vitals: the `capture_performance` config key was removed from PostHog JS v2. Web vitals autocapture is enabled in PostHog UI under Project Settings → Autocapture, not in the JS init. Do not add this key.

- [ ] **Step 2: Add render tag to theme.liquid**

In `technical/theme/layout/theme.liquid`, add the render tag immediately before `{{ content_for_header }}`:

```liquid
    {%- render 'posthog-analytics' -%}
    {{ content_for_header }}
```

The line `{{ content_for_header }}` is at line 38. Add the render tag at line 37.

- [ ] **Step 3: Push snippet and theme.liquid to Shopify (preview theme first)**

First push to the draft/preview theme to verify no Liquid errors:

```bash
shopify theme push --theme 193719566417 \
  --store 1z7hb1-2d.myshopify.com \
  --only "snippets/posthog-analytics.liquid" \
  --only "layout/theme.liquid" \
  --nodelete \
  --path technical/theme
```

Preview at: `https://inanctekstil.store/?preview_theme_id=193719566417`
Open browser dev tools → Network tab → look for requests to `svc.inanctekstil.store` (will 404 until DNS is live, but the JS should load).

- [ ] **Step 4: Commit**

```bash
git add technical/theme/snippets/posthog-analytics.liquid technical/theme/layout/theme.liquid
git commit -m "feat(theme): add PostHog analytics snippet"
```

---

## Task 8: Shopify theme — KVKK cookie consent banner

**Files:**
- Create: `technical/theme/snippets/cookie-consent.liquid`
- Modify: `technical/theme/layout/theme.liquid`

- [ ] **Step 1: Create cookie-consent.liquid**

Note: the banner starts with `display:none`. JavaScript sets `display:flex` when showing it. Do NOT put both in the same `style` attribute — `display:flex` would override `display:none` and the banner would always be visible.

```liquid
{% comment %}KVKK cookie consent banner — gates PostHog capture{% endcomment %}
<div id="cookie-banner" style="display:none;position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid #e5e5e5;padding:16px 24px;z-index:9999;box-shadow:0 -2px 8px rgba(0,0,0,.08);align-items:center;gap:16px;flex-wrap:wrap;">
  <p style="margin:0;flex:1;font-size:14px;color:#333;">
    Bu site, deneyiminizi iyileştirmek için çerezler kullanmaktadır.
    <a href="/pages/cerez-politikasi" style="color:#333;text-decoration:underline;">Çerez Politikası</a>
  </p>
  <div style="display:flex;gap:8px;">
    <button id="cookie-accept" style="background:#222;color:#fff;border:none;padding:8px 20px;border-radius:4px;cursor:pointer;font-size:14px;">Kabul Et</button>
    <button id="cookie-reject" style="background:transparent;color:#333;border:1px solid #ccc;padding:8px 20px;border-radius:4px;cursor:pointer;font-size:14px;">Reddet</button>
  </div>
</div>

<script>
  (function() {
    var STORAGE_KEY = 'cookie_consent';
    var banner = document.getElementById('cookie-banner');
    var stored = localStorage.getItem(STORAGE_KEY);

    if (stored === 'accepted') {
      if (window.posthog) posthog.opt_in_capturing();
    } else if (stored === 'rejected') {
      // stays opted out — posthog init has opt_out_capturing_by_default: true
    } else {
      // First visit — show banner (set display:flex here, not in the style attribute)
      if (banner) banner.style.display = 'flex';
    }

    document.getElementById('cookie-accept').addEventListener('click', function() {
      localStorage.setItem(STORAGE_KEY, 'accepted');
      if (window.posthog) posthog.opt_in_capturing();
      if (banner) banner.style.display = 'none';
    });

    document.getElementById('cookie-reject').addEventListener('click', function() {
      localStorage.setItem(STORAGE_KEY, 'rejected');
      if (window.posthog) posthog.opt_out_capturing();
      if (banner) banner.style.display = 'none';
    });
  })();
</script>
```

- [ ] **Step 2: Add render tag to theme.liquid**

Add the render tag immediately before `</body>` in `technical/theme/layout/theme.liquid`.

Find the closing `</body>` tag and add:
```liquid
    {%- render 'cookie-consent' -%}
  </body>
```

- [ ] **Step 3: Push to preview theme**

```bash
shopify theme push --theme 193719566417 \
  --store 1z7hb1-2d.myshopify.com \
  --only "snippets/cookie-consent.liquid" \
  --only "layout/theme.liquid" \
  --nodelete \
  --path technical/theme
```

Preview and verify: banner appears on first visit, disappears after accept/reject, does not reappear on reload.

- [ ] **Step 4: Commit**

```bash
git add technical/theme/snippets/cookie-consent.liquid technical/theme/layout/theme.liquid
git commit -m "feat(theme): add KVKK cookie consent banner"
```

---

## Task 9: JS custom events in curtain-configurator.liquid

**Files:**
- Modify: `technical/theme/sections/curtain-configurator.liquid`

The curtain configurator section contains all the JS for price calculation and add-to-cart. All `posthog.capture()` calls are wrapped in `if (window.posthog)` so they fail silently if PostHog hasn't loaded. `whatsapp_click` is out of scope — there is no WhatsApp button in the current theme.

- [ ] **Step 1: Find the right insertion points**

```bash
grep -n "calculatedPrice\|priceDisplay\|api/checkout/item\|formatTL" technical/theme/sections/curtain-configurator.liquid | head -20
```

Expected output should show ~line 1111 for the price display (`priceDisplay.textContent = formatTL(price)`) and ~line 1148 for the `/api/checkout/item` success callback.

- [ ] **Step 2: Add calculator_completed event**

Find where the calculated price is first rendered to the DOM — the line that sets `priceDisplay.textContent` (approximately line 1111). Add immediately after it:

```javascript
if (window.posthog) {
  posthog.capture('calculator_completed', {
    variant_id: selectedVariantId,   // adapt to actual variable name in scope
    width_cm: en,
    height_cm: boy,
    calculated_price: price,
  });
}
```

Adapt variable names (`selectedVariantId`, `en`, `boy`, `price`) to match what is actually in scope at that line. Read the surrounding context before inserting.

- [ ] **Step 3: Add add_to_cart event**

Find the success callback after a POST to `/api/checkout/item` (approximately line 1148) — where `calculatedPrice` is returned from the API. Add inside the success branch:

```javascript
if (window.posthog) {
  posthog.capture('add_to_cart', {
    variant_id: selectedVariantId,
    price: data.calculatedPrice,
    quantity: 1,
  });
}
```

Adapt variable names to match scope.

- [ ] **Step 4: Push and smoke-test**

```bash
shopify theme push --theme 193719566417 \
  --store 1z7hb1-2d.myshopify.com \
  --only "sections/curtain-configurator.liquid" \
  --nodelete \
  --path technical/theme
```

Open preview, go to a product page, accept cookies, then:
- Open Network tab → filter by `svc.inanctekstil.store`
- Fill in dimensions and confirm price calculates — verify `calculator_completed` fires
- Click Add to Cart — verify `add_to_cart` fires

- [ ] **Step 5: Commit**

```bash
git add technical/theme/sections/curtain-configurator.liquid
git commit -m "feat(theme): add PostHog custom events to curtain configurator"
```

---

## Task 10: Managed proxy + DNS — live setup

This task is operational (manual steps + Terraform apply). No code is written here.

> **Warning — local Terraform state:** This project has no remote backend. State lives at `technical/gitopsprod/terraform.tfstate` on your local machine. Before running `terraform apply`, verify this file exists: `ls -la technical/gitopsprod/terraform.tfstate`. If it is missing (e.g. fresh clone, different machine), do NOT apply — doing so will attempt to recreate all existing resources (server, DNS zone, firewall) from scratch, which is destructive. Contact the project owner to get a copy of the state file.

- [ ] **Step 1: Create the managed proxy in PostHog**

1. Go to `https://eu.posthog.com/settings/organization-proxy`
2. Click **New managed proxy**
3. Enter `svc.inanctekstil.store`
4. Copy the generated CNAME target (looks like `xxxxxxxx.proxy-eu.posthog.com.`)

- [ ] **Step 2: Fill in the CNAME target in dns.tf**

In `technical/gitopsprod/dns.tf`, replace `REPLACE_WITH_POSTHOG_CNAME_TARGET.` with the actual value.

- [ ] **Step 3: Apply Terraform**

```bash
cd technical/gitopsprod && terraform plan
```

Verify: 2 resources to add (`hcloud_zone_record.posthog_proxy` + `hcloud_zone_record.hooks`), nothing to destroy.

```bash
terraform apply
```

- [ ] **Step 4: Wait for proxy to go live**

In PostHog Admin → proxy settings, status should change: `waiting → issuing → live` (2–5 minutes).

- [ ] **Step 5: Verify proxy is reachable**

```bash
curl -I https://svc.inanctekstil.store/static/array.js
```

Expected: `HTTP/2 200`

- [ ] **Step 6: Commit updated dns.tf**

```bash
git add technical/gitopsprod/dns.tf
git commit -m "feat(dns): set posthog proxy CNAME target"
```

---

## Task 11: Deploy analytics-forwarder to server

This task deploys the new service to Hetzner. Manual SSH steps.

- [ ] **Step 1: Register Shopify webhook**

```
Shopify Admin → Settings → Notifications → Webhooks → Add webhook
  Event:  Order payment
  Format: JSON
  URL:    https://hooks.inanctekstil.store/webhooks/shopify/orders-paid
```

**Copy the signing secret immediately — it is shown only once.** If you navigate away, delete and recreate the webhook.

- [ ] **Step 2: Add env vars to server .env**

SSH to server:
```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158
```

Add to `/opt/inanctekstil/.env`:
```
SHOPIFY_WEBHOOK_SECRET=<secret from step 1>
POSTHOG_API_KEY=phc_knhZGJSkRM7w0MmIssVXa7U6QzDiGipYDXu4xwyflQp
```

- [ ] **Step 3: Copy service source to server**

From local machine:
```bash
rsync -av --exclude node_modules --exclude .git \
  technical/analytics-forwarder/ \
  root@5.75.165.158:/opt/analytics-forwarder/
```

- [ ] **Step 4: Add service to Docker Compose**

On server, edit `/opt/inanctekstil/docker-compose.yml` and add the `analytics-forwarder` service:

```yaml
  analytics-forwarder:
    build: /opt/analytics-forwarder
    restart: unless-stopped
    environment:
      - SHOPIFY_WEBHOOK_SECRET=${SHOPIFY_WEBHOOK_SECRET}
      - POSTHOG_API_KEY=${POSTHOG_API_KEY}
    networks:
      - traefik
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.analytics-forwarder.rule=Host(`hooks.inanctekstil.store`)"
      - "traefik.http.routers.analytics-forwarder.entrypoints=websecure"
      - "traefik.http.routers.analytics-forwarder.tls.certresolver=letsencrypt"
      - "traefik.http.services.analytics-forwarder.loadbalancer.server.port=3000"
```

Verify `networks` section at bottom of compose file includes `traefik` (it already does for other services).

- [ ] **Step 5: Build and start the service**

```bash
cd /opt/inanctekstil
docker compose up -d --build analytics-forwarder
```

- [ ] **Step 6: Verify health endpoint**

```bash
curl -s https://hooks.inanctekstil.store/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 7: Send a Shopify test webhook**

```
Shopify Admin → Settings → Notifications → Webhooks → find the webhook → Send test notification
```

Check server logs:
```bash
docker compose logs analytics-forwarder --tail 20
```

Expected: log line with `"msg":"order_completed captured"` (will fail PostHog capture since test payload uses fake data, but HMAC verification should pass).

---

## Task 12: Push theme to production + end-to-end verification

- [ ] **Step 1: Push all theme changes to production theme**

```bash
shopify theme push --theme 193714913361 \
  --store 1z7hb1-2d.myshopify.com \
  --only "layout/theme.liquid" \
  --only "snippets/posthog-analytics.liquid" \
  --only "snippets/cookie-consent.liquid" \
  --only "assets/perde-checkout.js" \
  --nodelete \
  --path technical/theme
```

- [ ] **Step 2: Verify on live site**

1. Open `https://inanctekstil.store` in a fresh private window
2. Open Network tab → filter `svc.inanctekstil.store`
3. Cookie banner should appear
4. Requests to PostHog should be **absent** (opted out by default)
5. Click **Kabul Et** → verify PostHog `$pageview` request fires to `svc.inanctekstil.store`
6. Navigate to a product page → verify `product_viewed` event fires
7. Navigate to a collection → verify `category_viewed` fires
8. Open PostHog dashboard → `https://eu.posthog.com` → Activity → verify events appear

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: PostHog analytics integration complete"
```
