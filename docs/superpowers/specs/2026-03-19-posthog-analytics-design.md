# PostHog Analytics — Full Integration Design

**Date:** 2026-03-19
**Status:** Approved for implementation
**Scope:** Shopify storefront + server-side order tracking with iOS/blocker resilience

---

## Overview

Introduce PostHog EU Cloud analytics to inanctekstil.store with:

1. A managed reverse proxy subdomain so iOS Safari ITP and ad blockers cannot block events
2. PostHog JS in the Shopify theme covering all storefront pages
3. A dedicated `analytics-forwarder` service that receives Shopify order webhooks and forwards `order_completed` to PostHog server-side — zero browser dependency for the most critical event
4. A KVKK-compliant cookie consent banner

---

## Architecture

```
Browser (storefront)
  theme.liquid loads posthog.js
    ↓ all requests go through
  svc.inanctekstil.store  (CNAME → PostHog managed proxy)
    ↓
  eu.i.posthog.com

Shopify (server-to-server)
  orders/paid webhook
    ↓
  hooks.inanctekstil.store
    ↓
  analytics-forwarder (Bun/Hono, Docker, Hetzner)
    ↓
  eu.i.posthog.com/capture/
```

**Key boundary:** `order_completed` is captured server-to-server. iOS, Safari ITP, ad blockers, and JS failures are irrelevant for order data.

---

## Section 1: Managed Reverse Proxy

**Subdomain:** `svc.inanctekstil.store`
Neutral name — PostHog docs say to avoid: `analytics`, `tracking`, `telemetry`, `posthog`, `ph`.

**Setup:**
1. PostHog Admin → Organization Settings → Proxy → New managed proxy → enter `svc.inanctekstil.store`
2. PostHog generates a CNAME target (e.g. `xxxxxxxx.proxy-eu.posthog.com`)
3. Add CNAME in Terraform DNS config
4. PostHog auto-provisions SSL — live in 2–5 minutes

**Terraform DNS record:**

DNS uses `hcloud_zone_record` (existing pattern in `technical/gitopsprod/dns.tf`):

```hcl
resource "hcloud_zone_record" "posthog_proxy" {
  zone  = hcloud_zone.main.id
  name  = "svc"
  type  = "CNAME"
  value = "xxxxxxxx.proxy-eu.posthog.com."  # fill in after PostHog generates it
}
```

**PostHog init uses:**
```javascript
api_host: 'https://svc.inanctekstil.store'
ui_host:  'https://eu.posthog.com'
```

---

## Section 2: Shopify Theme Integration

### File changes

| File | Change |
|------|--------|
| `snippets/posthog-analytics.liquid` | New — PostHog init + page-type events |
| `snippets/cookie-consent.liquid` | New — KVKK consent banner |
| `layout/theme.liquid` | Add two `render` tags in `<head>` and `<body>` |

### theme.liquid changes

In `<head>`, before `{{ content_for_header }}`:
```liquid
{%- render 'posthog-analytics' -%}
```

In `<body>`, before closing `</body>`:
```liquid
{%- render 'cookie-consent' -%}
```

### posthog-analytics.liquid

PostHog loader snippet (from posthog.com/docs) + init config + page-type events:

```liquid
<script>
  // PostHog loader (minified array.js bootstrap)
  !function(t,e){...}(document,window.posthog||[]);

  // POSTHOG_PROJECT_API_KEY is PostHog's Project API Key — intentionally public (readable in page source).
  // It is NOT a secret. The same key is used in the analytics-forwarder server env because
  // PostHog's /capture/ endpoint only requires the public project key, not a personal API key.
  // Actual key value: see docs/ecommerce/posthog-analytics.md or .env on server.
  posthog.init('<ph_project_api_key>', {
    api_host: 'https://svc.inanctekstil.store',
    ui_host: 'https://eu.posthog.com',
    capture_pageview: true,
    capture_pageleave: true,
    // Web vitals config: verify key name against the exact PostHog JS SDK version loaded.
    // In PostHog JS v2 (early 2026) the key may be `__preview_send_web_vitals: true`
    // and the metrics filter may require UI-side configuration (Project Settings → Autocapture).
    // If the key below is unsupported it fails silently — check network tab after deploy.
    capture_performance: {
      web_vitals: true,
      web_vitals_allowed_metrics: ['CLS', 'FCP', 'INP', 'LCP']
    },
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

### cookie-consent.liquid

Lightweight KVKK consent banner — no external library.

Behaviour:
- First visit: banner appears at bottom of screen
- "Kabul Et": calls `posthog.opt_in_capturing()`, stores `cookie_consent=accepted` in localStorage
- "Reddet": calls `posthog.opt_out_capturing()`, stores `cookie_consent=rejected`
- Subsequent visits: reads localStorage, applies PostHog state, no banner shown
- Links to `/pages/cerez-politikasi`

**Note on event sequencing:** `posthog-analytics.liquid` fires `product_viewed` and `category_viewed` immediately after `posthog.init()` in `<head>`. Because `opt_out_capturing_by_default: true` is set, all `posthog.capture()` calls while opted out are **silent no-ops** — PostHog queues nothing and sends nothing until `opt_in_capturing()` is called. These captures do not need to be deferred.

### JS-fired custom events

Added as one-liner `posthog.capture()` calls inside existing asset files:

| Event | File | Trigger |
|-------|------|---------|
| `add_to_cart` | `assets/perde-checkout.js` | Success callback from `/api/checkout/item` |
| `calculator_completed` | `assets/perde-checkout.js` | When price is calculated and displayed |
| `whatsapp_click` | `assets/perde-checkout.js` | Click on any WhatsApp CTA |

### Automatic events (no code needed)

- `$pageview` — every page load and Shopify AJAX navigation
- `$pageleave`
- Session recordings
- Heatmaps
- Web vitals (LCP, CLS, INP, FCP)

---

## Section 3: analytics-forwarder Service

A new dedicated Bun/Hono service. curtain-checkout-api is a pricing/cart service and is not modified.

### Location

```
technical/analytics-forwarder/
  src/
    app.ts        ← Hono app, single endpoint + HMAC verification
    index.ts      ← Bun server entry
  package.json
  tsconfig.json
  Dockerfile
```

### Endpoint: POST /webhooks/shopify/orders-paid

1. Read raw request body (required for HMAC verification — must not parse before signing)
2. Compute HMAC-SHA256 of raw body using `SHOPIFY_WEBHOOK_SECRET`
3. Compare with `X-Shopify-Hmac-Sha256` header using **constant-time comparison** (`crypto.timingSafeEqual` or equivalent) — reject with 401 if mismatch. Do not use `===` for this comparison; it is vulnerable to timing attacks.
4. Parse order JSON
5. POST to `https://eu.i.posthog.com/capture/` with `order_completed` event
6. If the PostHog POST fails (network error or non-2xx response): log the error and continue — do not propagate the failure to Shopify
7. Always return 200 to Shopify regardless of PostHog outcome (non-200 triggers up to 19 retries over 48h, causing duplicate events)

### Event payload

```json
{
  "api_key": "<POSTHOG_API_KEY>",
  "event": "order_completed",
  "distinct_id": "<customer email, or shopify_order_<id> for guests>",
  "timestamp": "<order.created_at>",
  "properties": {
    "order_id": "String(order.id)",
    "order_number": "order.order_number",
    "order_total": "parseFloat(order.total_price)",
    "currency": "TRY",
    "item_count": "order.line_items.length",
    "items": [
      {
        "name": "line_item.title",
        "price": "parseFloat(line_item.price)",
        "quantity": "line_item.quantity",
        "product_id": "String(line_item.product_id)",
        "variant_id": "String(line_item.variant_id)"
      }
    ],
    "$source": "shopify_webhook"
  }
}
```

### distinct_id strategy

- Logged-in customer: use `order.customer.email`
- Guest checkout: use `shopify_order_<order.id>`

**Known limitation:** Browser session events use PostHog's anonymous cookie ID. Server-side `order_completed` uses email (or `shopify_order_<id>` for guests). PostHog does **not** automatically merge these identities. `posthog.identify(email)` must be explicitly called browser-side for the merge to happen — and that call is out of scope for this iteration. As a result, the funnel will show a gap at the `order_completed` step for **all** users (both guests and logged-in customers) until `posthog.identify()` is implemented. `order_completed` is still captured and queryable as a standalone metric; only funnel continuation from browser session → order is broken.

### Infrastructure

**DNS (Terraform):**
```hcl
resource "hcloud_zone_record" "hooks" {
  zone  = hcloud_zone.main.id
  name  = "hooks"
  type  = "A"
  value = "5.75.165.158"
}
```

**Server deploy path:** `scp/rsync technical/analytics-forwarder/ → /opt/analytics-forwarder/` on the Hetzner server before first deploy. Same pattern as curtain-checkout-api (`/opt/curtain-checkout-api/`) and other services.

**Docker Compose service:**
```yaml
analytics-forwarder:
  build: /opt/analytics-forwarder
  restart: unless-stopped
  environment:
    - SHOPIFY_WEBHOOK_SECRET=${SHOPIFY_WEBHOOK_SECRET}
    - POSTHOG_API_KEY=${POSTHOG_API_KEY}
  networks:
    - traefik  # same network as Traefik and other services
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

The service must expose a `GET /health → 200` endpoint. Without this, a dead container silently drops Shopify webhooks for up to 48 hours before the retry window is exhausted.

**Shopify webhook registration:**
```
Shopify Admin → Settings → Notifications → Webhooks → Add webhook
  Event:  Order payment
  Format: JSON
  URL:    https://hooks.inanctekstil.store/webhooks/shopify/orders-paid
```
Copy the signing secret shown after saving → add to server `.env` as `SHOPIFY_WEBHOOK_SECRET`.

**Important:** Shopify displays the webhook signing secret **only once**, immediately after creation. If you navigate away without copying it, you must delete the webhook and create a new one. Copy it to a secure location before leaving the page.

### New env vars (add to /opt/inanctekstil/.env)

| Var | Value |
|-----|-------|
| `SHOPIFY_WEBHOOK_SECRET` | From Shopify Admin after webhook registration |
| `POSTHOG_API_KEY` | PostHog Project API Key — see `docs/ecommerce/posthog-analytics.md` for value (intentionally public key, safe to store in env) |

---

## Section 4: KVKK Compliance

### Cookie consent banner
- `opt_out_capturing_by_default: true` in PostHog init — nothing fires until user accepts
- `cookie-consent.liquid` snippet handles accept/reject, persists to localStorage
- On accept: `posthog.opt_in_capturing()`
- On reject: `posthog.opt_out_capturing()` (PostHog already opted out by default, this persists the choice)

### Webhook (server-side)
KVKK's personal data consent applies to browser-side tracking. Order processing data captured via webhook has a separate legal basis (contract performance / legitimate interest for the merchant). No consent gate required for the webhook.

### Cookie policy update
`docs/legal/cerez-politikasi.md` already lists PostHog. Verify the entry matches current config (EU host, 1-year retention).

---

## Purchase Funnel

```
$pageview
  → product_viewed
    → calculator_completed   (dimensions entered, price shown)
      → add_to_cart
        → checkout_started   (redirect to draft order invoice — not captured, see note)
          → order_completed  (server-side webhook, 100% capture)
```

**Note:** `checkout_started` is not captured in this design. The store uses draft order invoice URLs for checkout — not standard Shopify checkout. Shopify Custom Pixel checkout events do not fire for this flow. This step can be added later if needed via a client-side redirect capture.

---

## Out of Scope

- `checkout_started` event (draft order invoice flow incompatible with Custom Pixel)
- `posthog.identify()` for logged-in customers (would enable full funnel stitching; requires accessing customer email in Liquid — deferred to a future iteration)
- `posthog.identify()` for guest customers (requires login flow — not applicable)
- A/B testing / feature flags
- Google Ads / Meta Pixel integration (separate concern)
