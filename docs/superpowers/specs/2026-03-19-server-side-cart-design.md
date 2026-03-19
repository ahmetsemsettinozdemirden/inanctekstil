# Server-side curtain cart design

**Date:** 2026-03-19
**Status:** Approved

## Problem

The current checkout flow stores a single draft order URL in `sessionStorage`. This breaks in two ways:

1. **Multi-product**: navigating to a second product page clears the first product's URL. Checkout only covers the last configured item.
2. **Page refresh**: `sessionStorage` is cleared on init, so the URL is lost if the customer refreshes before checking out.

## Solution

Store configured items in Postgres keyed to the Shopify cart token. Create one draft order containing all items only when the customer clicks checkout.

## Architecture

```
Add to cart (per product)              Checkout (once, anywhere)
──────────────────────────             ─────────────────────────
Customer fills configurator            Customer clicks "Ödeme"
→ POST /api/checkout/item              → global interceptor fires
  {cartToken, variantId, dims}           (theme.liquid, every page)
  → validate + calculate price         → GET /cart.js → cart token
  → upsert row in Postgres             → POST /api/checkout/complete
  → return {ok, calculatedPrice}         → read all rows for token
→ POST /cart/add.js (Shopify)            → create ONE draft order
→ cart drawer opens                      → return {checkoutUrl}
                                       → redirect to Shopify checkout
```

The Shopify cart token (from `/cart.js`) is stable across page refreshes — Shopify stores it in its own session cookie. No data lives in the browser.

If the cart has no configured items in Postgres (e.g. future non-curtain product), the interceptor receives a 404 and falls through to normal Shopify checkout.

## Infrastructure

A new `curtain-db` Postgres container is added to the Docker Compose stack at `/opt/inanctekstil/`. It is isolated from the existing PMS `postgres` container.

```
Docker Compose stack (/opt/inanctekstil/)
├── traefik       (existing)
├── postgres      (existing — PMS only)
├── pms           (existing)
├── curtain-app   (existing → gets DATABASE_URL for curtain-db)
└── curtain-db    (NEW — postgres:16-alpine, curtain database)
```

`curtain-db` is not exposed on any host port. Connection string added to `.env`:

```
CURTAIN_DATABASE_URL=postgres://curtain:PASSWORD@curtain-db:5432/curtain
```

## Database schema

```sql
CREATE TABLE cart_items (
  id                   SERIAL PRIMARY KEY,
  cart_token           TEXT         NOT NULL,
  variant_id           BIGINT       NOT NULL,
  product_title        TEXT         NOT NULL,
  en_cm                INT          NOT NULL,
  boy_cm               INT          NOT NULL,
  pile_stili           TEXT         NOT NULL,
  pile_orani           DECIMAL(4,2) NOT NULL,
  kanat                TEXT         NOT NULL,
  kanat_count          INT          NOT NULL,
  base_price_per_meter DECIMAL(10,2) NOT NULL,
  calculated_price     DECIMAL(10,2) NOT NULL,
  created_at           TIMESTAMPTZ  DEFAULT NOW()
);

CREATE UNIQUE INDEX ON cart_items(cart_token, variant_id);
```

**Upsert rule**: conflict on `(cart_token, variant_id)` → update all fields. Reconfiguring the same product replaces the previous entry.

**Cleanup**: rows older than 7 days are deleted. Runs on server startup and once every 24 hours via `setInterval`.

## API endpoints

### `POST /api/checkout/item`

Replaces `POST /api/checkout/draft-order`.

**Request:**
```json
{
  "cartToken": "abc123",
  "variantId": 12345678,
  "en": 200,
  "boy": 250,
  "pileStili": "Kanun Pile",
  "pileOrani": 2.5,
  "kanat": "Tek Kanat",
  "kanatCount": 1
}
```

**Steps:**
1. Validate inputs (same rules as existing endpoint)
2. Fetch Shopify token via `client_credentials` OAuth
3. Fetch variant price + product title from Shopify REST
4. Calculate: `(en / 100) × pileOrani × kanatCount × basePricePerMeter`
5. Upsert row into `cart_items`
6. Return `{ ok: true, calculatedPrice: "1150.00" }`

**Errors:**

| Status | error | Cause |
|--------|-------|-------|
| 400 | `INVALID_INPUT` | Validation failure |
| 400 | `MISSING_CART_TOKEN` | cartToken absent or empty |
| 404 | `VARIANT_NOT_FOUND` | Shopify variant lookup failed |
| 500 | `AUTH_FAILED` | Shopify OAuth failed |
| 500 | `INVALID_PRICE` | Variant price zero or negative |
| 500 | `DB_ERROR` | Postgres upsert failed |

---

### `POST /api/checkout/complete`

**Request:**
```json
{ "cartToken": "abc123" }
```

**Steps:**
1. Read all rows for `cartToken` from Postgres
2. If none → `404 { error: "NO_ITEMS" }` (interceptor falls through to normal checkout)
3. Create one Shopify Draft Order with all line items (each with correct price + En/Boy/Pile Stili/Kanat properties)
4. Return `{ checkoutUrl }`

**Errors:**

| Status | error | Cause |
|--------|-------|-------|
| 400 | `MISSING_CART_TOKEN` | cartToken absent |
| 404 | `NO_ITEMS` | No rows found for this cart token |
| 500 | `AUTH_FAILED` | Shopify OAuth failed |
| 500 | `DRAFT_ORDER_FAILED` | Shopify Draft Orders API error |
| 500 | `DB_ERROR` | Postgres read failed |

---

`POST /api/checkout/draft-order` is removed.

## Theme changes

### `curtain-configurator.liquid`

- "Sepete Ekle" handler: call `POST /api/checkout/item` (not `/api/checkout/draft-order`). On success, proceed to `POST /cart/add.js`. Remove all `sessionStorage` reads and writes.
- Delete the checkout interceptor block entirely — it moves to a global asset.

### New: `assets/perde-checkout.js`

Global checkout interceptor loaded on every page. Intercepts clicks on checkout buttons/links in the capture phase.

```
click intercepted
  → GET /cart.js → get cart token
  → if cart empty → fall through to normal checkout
  → POST /api/checkout/complete {cartToken}
  → if 404 (no configured items) → fall through to normal checkout
  → redirect to checkoutUrl
```

### `layout/theme.liquid`

Two additions before `</body>`:

```liquid
<script>window.PERDE_API_URL = 'https://app.inanctekstil.store';</script>
<script src="{{ 'perde-checkout.js' | asset_url }}" defer></script>
```

## Data flow example

Customer adds STN (150cm × Boru Pile × Çift Kanat), then TUL (200cm × Kanun Pile × Tek Kanat), then checks out:

```
POST /api/checkout/item
  {cartToken: "abc", variantId: STN, en: 150, pileOrani: 3.0, kanatCount: 2}
  → INSERT cart_items (cart_token="abc", variant_id=STN, calculated_price=1350)

[navigate to TUL page — no sessionStorage cleared, Postgres untouched]

POST /api/checkout/item
  {cartToken: "abc", variantId: TUL, en: 200, pileOrani: 2.5, kanatCount: 1}
  → INSERT cart_items (cart_token="abc", variant_id=TUL, calculated_price=1150)

[customer refreshes page — Postgres untouched, cart token unchanged]

POST /api/checkout/complete {cartToken: "abc"}
  → SELECT * FROM cart_items WHERE cart_token = "abc"  → 2 rows
  → Create Draft Order:
      line 1: Saten Perde,      qty 1, price 1350.00, [En:150, Boy:200, ...]
      line 2: BORNOVA Tül Perde, qty 1, price 1150.00, [En:200, Boy:250, ...]
  → return {checkoutUrl}

Customer pays ₺2,500 ✓
```

## Known limitations after this change

- **Same variant, different configs**: if a customer configures the same product variant twice with different dimensions, the second config overwrites the first (upsert on `cart_token + variant_id`). This is acceptable for now — most products have one variant per colour.
- **Cart token change**: if the customer clears their Shopify cart, Shopify issues a new cart token and the Postgres rows become orphaned (cleaned up after 7 days).
- **Cart page checkout**: after this change, checkout from `/cart` works correctly because the interceptor is now global.
