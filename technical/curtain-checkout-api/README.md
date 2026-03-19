# curtain-checkout-api

Hono/Bun HTTP service that manages server-side curtain cart items and creates Shopify Draft Orders for custom-cut curtains.

Deployed at `https://app.inanctekstil.store` (Docker on Hetzner `5.75.165.158`).

---

## Why this exists

Shopify's Cart Transform API (which can override line item prices) requires **Shopify Plus**.
The store is on Basic plan, so Cart Transform silently no-ops.

The solution: when a customer configures a curtain, the frontend saves the configuration to this service's Postgres-backed cart. On checkout, the service creates a single **Draft Order** with all configured curtain items at server-calculated prices.

---

## Use case flow

```
Customer on product page
  │
  ▼
Fills curtain configurator
  (width, height, pleat style, panel count)
  │
  ▼
Clicks "Sepete Ekle"
  │
  ├─► GET /cart.js  (Shopify storefront — gets current cart token)
  │
  ├─► POST /api/checkout/item
  │     body: { cartToken, variantId, en, boy, pileStili, pileOrani, kanat, kanatCount }
  │     ├─ Validates inputs
  │     ├─ Gets short-lived Shopify token (client_credentials OAuth)
  │     ├─ Fetches variant base price from Shopify REST (server-side — never trusts client)
  │     ├─ Calculates: (en / 100) × pileOrani × kanatCount × basePricePerMeter
  │     ├─ Upserts row into cart_items Postgres table keyed to (cartToken, variantId)
  │     └─ Returns { ok: true, calculatedPrice }
  │
  ├─► POST /cart/add.js  (Shopify storefront — adds variant to cart drawer)
  │
  └─► Cart drawer opens showing the item
        │
        ▼
  Customer navigates to other products, adds more items...
  (each calls /api/checkout/item — all rows saved under same cartToken)
        │
        ▼
  Customer clicks "Ödeme" from any page
        │
        ▼
  perde-checkout.js intercepts (capture phase), POSTs to:
  POST /api/checkout/complete
    body: { cartToken }
    ├─ Reads all cart_items rows for this cartToken from Postgres
    ├─ Creates ONE Draft Order with all line items at server-calculated prices
    ├─ Deletes the rows from Postgres (cleanup)
    └─ Returns { checkoutUrl }
        │
        ▼
  Redirect to Draft Order checkout URL
        │
        ▼
  Shopify checkout shows ALL items at correct calculated prices  ✓
```

### Price formula

```
price = (en_cm / 100) × pileOrani × kanatCount × basePricePerMeter
```

| Parameter           | Description                                                        |
|---------------------|--------------------------------------------------------------------|
| `en_cm`             | Curtain width in centimetres (50–1000)                             |
| `pileOrani`         | Pleat ratio: 2.0 (Düz), 2.5 (Kanun Pile), 3.0 (Boru Pile)        |
| `kanatCount`        | Panel count: 1 (Tek Kanat) or 2 (Çift Kanat)                      |
| `basePricePerMeter` | Variant price from Shopify (₺ per metre of fabric)                 |

Examples:
- 200 cm × 2.5 × 1 × 230 TL/m = **1,150.00 TL** (TUL Bornova, Tek Kanat)
- 150 cm × 3.0 × 2 × 150 TL/m = **1,350.00 TL** (Saten, Çift Kanat)

---

## API

### `POST /api/checkout/item`

Saves or updates a curtain configuration for a cart token.

**Request body** (JSON):

```json
{
  "cartToken": "hWN9zvzqmHTRwvNxviJXoHPG?key=c8b76dc5c0984b5e472c32826d665c3a",
  "variantId": 59200390725713,
  "en": 200,
  "boy": 250,
  "pileStili": "Kanun Pile",
  "pileOrani": 2.5,
  "kanat": "Tek Kanat",
  "kanatCount": 1
}
```

**Success response** `200`:

```json
{ "ok": true, "calculatedPrice": "1150.00" }
```

**Error responses**:

| Status | `error`              | Cause                                                     |
|--------|----------------------|-----------------------------------------------------------|
| 400    | `MISSING_CART_TOKEN` | cartToken absent or empty                                 |
| 400    | `INVALID_INPUT`      | Validation failure (cartToken format, field ranges)       |
| 404    | `VARIANT_NOT_FOUND`  | Shopify variant lookup failed                             |
| 500    | `AUTH_FAILED`        | Shopify OAuth token request failed                        |
| 500    | `INVALID_PRICE`      | Variant price is zero or negative                         |
| 500    | `DB_ERROR`           | Postgres upsert failed                                    |

---

### `POST /api/checkout/complete`

Creates a Draft Order for all saved cart items and returns the checkout URL.
Rate-limited to 10 requests per minute per IP.

**Request body** (JSON):

```json
{ "cartToken": "hWN9zvzqmHTRwvNxviJXoHPG?key=c8b76dc5c0984b5e472c32826d665c3a" }
```

**Success response** `200`:

```json
{ "checkoutUrl": "https://1z7hb1-2d.myshopify.com/checkouts/do/..." }
```

**Error responses**:

| Status | `error`               | Cause                                         |
|--------|-----------------------|-----------------------------------------------|
| 400    | `MISSING_CART_TOKEN`  | cartToken absent, empty, or invalid format    |
| 404    | `NO_ITEMS`            | No configured items found for this cartToken  |
| 429    | `RATE_LIMITED`        | More than 10 requests/minute from this IP     |
| 500    | `AUTH_FAILED`         | Shopify OAuth token request failed            |
| 500    | `DRAFT_ORDER_FAILED`  | Shopify Draft Orders API returned error       |
| 500    | `DB_ERROR`            | Postgres read failed                          |

---

### `GET /health`

Returns `{ "status": "ok", "uptime": <seconds> }`.

---

## Environment variables

| Variable                | Description                                              |
|-------------------------|----------------------------------------------------------|
| `SHOPIFY_STORE_DOMAIN`  | e.g. `1z7hb1-2d.myshopify.com`                         |
| `SHOPIFY_CLIENT_ID`     | Custom app client ID (for client_credentials OAuth)      |
| `SHOPIFY_CLIENT_SECRET` | Custom app client secret                                 |
| `CURTAIN_DATABASE_URL`  | Postgres connection URL, e.g. `postgres://curtain:PASSWORD@curtain-db:5432/curtain` |
| `PORT`                  | HTTP port (default: 3001)                                |

Set in `/opt/inanctekstil/.env` on the Hetzner server.

---

## Development

```bash
bun install
bun run dev        # watch mode
bun test src/      # run tests
bun run typecheck  # tsc --noEmit
```

## Deployment

Manual deploy to Hetzner (`5.75.165.158`):

```bash
# Copy source to server
scp -r -i ~/.ssh/inanctekstil src package.json tsconfig.json \
  root@5.75.165.158:/opt/curtain-checkout-api/

# SSH and rebuild
ssh -i ~/.ssh/inanctekstil root@5.75.165.158
cd /opt/inanctekstil
docker compose up -d curtain-db          # start DB first (if not running)
docker compose up -d --build curtain-app # rebuild and restart API
```

The service runs as the `curtain-app` container, exposed via Traefik at
`https://app.inanctekstil.store`.

---

## Manual E2E test guide

Tested on production store `inanctekstil.store`. Run this after any deployment.

### Prerequisites
- Browser with no existing cart (or clear the cart first at `/cart`)
- API service is running: `curl https://app.inanctekstil.store/health` should return `{"status":"ok",...}`
- `curtain-db` container is running: `docker exec curtain-db pg_isready -U curtain`

---

### Step 1 — Add TUL product via configurator

1. Navigate to `https://inanctekstil.store/products/tul-bornova`
2. In Step 1 (Ölçü Seçimi), enter **En: 200**, **Boy: 250**, click "Devam Et"
3. Select **Kanun Pile x2.5**, click "Devam Et"
4. Select **Tek Kanat**, click "Devam Et"
5. **Verify Step 4 Onay**:
   - Tahmini Fiyat: **1.150,00 TL** (formula: 200/100 × 2.5 × 1 × 230)
6. Check the disclaimer checkbox, click "Sepete Ekle"
7. **Verify**: Cart drawer opens with:
   - Item: BORNOVA Tül Perde, line price **1,150.00TL**
   - Button shows "Sepete Eklendi ✓"

---

### Step 2 — Navigate to STN page (items must survive page navigation)

1. Navigate to `https://inanctekstil.store/products/stn-saten`
2. **Verify**: Cart badge still shows **1** item (DB rows are not cleared on navigation)
3. Complete configurator: En=150, Boy=200 → Boru Pile x3.0 → Çift Kanat
4. **Verify Step 4**: Tahmini Fiyat: **1.350,00 TL** (formula: 150/100 × 3.0 × 2 × 150)
5. Check disclaimer, click "Sepete Ekle"
6. **Verify**: Cart drawer opens with **2 items**, Tahmini toplam **2.500,00 TL**:
   - Saten Perde: 1,350.00TL
   - BORNOVA Tül Perde: 1,150.00TL

---

### Step 3 — Checkout from cart page

1. Navigate to `https://inanctekstil.store/cart`
2. **Verify**: Both items are shown correctly
3. Click **"Ödeme"**
4. **Verify**: Browser console shows `[PerdeCheckout] intercepted checkout click`
5. **Verify**: URL changes to a Draft Order URL — `1z7hb1-2d.myshopify.com/checkouts/do/...`
   (NOT the normal `/checkout` path)
6. **Verify**: Checkout order summary shows **both items**:
   - Özel Ölçü Perde (TUL): En 200 cm, Kanun Pile (x2.50), Tek Kanat — **1.150,00 TL**
   - Özel Ölçü Perde (STN): En 150 cm, Boru Pile (x3.00), Çift Kanat — **1.350,00 TL**
   - Alt toplam: **2.500,00 TL**

---

### Step 4 — Verify page refresh persistence

1. Clear the cart and repeat Step 1 (add TUL only, do not checkout yet)
2. **Refresh** the product page
3. Navigate to `/cart` and click "Ödeme"
4. **Verify**: Draft Order checkout shows TUL item at 1.150,00 TL
   (DB row survived the page refresh — no sessionStorage dependency)

---

### Step 5 — Checkout form

1. On the Shopify checkout page (Draft Order path):
2. Fill in contact: email address
3. Delivery: "Gönder" — fill shipping address (country pre-set to Türkiye)
4. **Verify**: Shipping method appears (e.g. Standart 89.00 TL)
5. Payment: "Kredi / Banka Kartı (PayTR)" — "Şimdi öde" redirects to PayTR
