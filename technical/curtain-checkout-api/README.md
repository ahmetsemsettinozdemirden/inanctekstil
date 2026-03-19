# curtain-checkout-api

Hono/Bun HTTP service that creates Shopify Draft Orders for custom-cut curtains.

Deployed at `https://app.inanctekstil.store` (Docker on Hetzner `5.75.165.158`).

---

## Why this exists

Shopify's Cart Transform API (which can override line item prices) requires **Shopify Plus**.
The store is on Basic plan, so Cart Transform silently no-ops.

The solution: when a customer configures a curtain, the frontend calls this service instead of
adding to cart directly. The service calculates the correct price server-side, creates a
**Draft Order** with that price, and returns a checkout URL. The frontend then:

1. Stores the checkout URL in `sessionStorage`
2. Adds the item to the Shopify cart (so the cart drawer shows the product)
3. Intercepts any checkout button click and redirects to the Draft Order URL

This means the cart drawer shows the item normally, but checkout always uses the server-calculated
price — not the base per-metre price stored in the variant.

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
  ├─► POST /api/checkout/draft-order
  │     body: { variantId, en, boy, pileStili, pileOrani, kanat, kanatCount }
  │     ├─ Validates inputs
  │     ├─ Gets short-lived Shopify token (client_credentials OAuth)
  │     ├─ Fetches variant base price from Shopify REST (server-side — never trusts client)
  │     ├─ Calculates: (en / 100) × pileOrani × kanatCount × basePricePerMeter
  │     ├─ Creates Draft Order with custom line item (correct price + order properties)
  │     └─ Returns { checkoutUrl }
  │
  ├─► sessionStorage.setItem('perdeCheckoutUrl', checkoutUrl)
  │
  ├─► POST /cart/add.js   (Shopify storefront — adds variant to cart drawer)
  │
  └─► Cart drawer opens showing the item
        │
        ▼
  Customer clicks "Checkout"
        │
        ▼
  Click interceptor (capture phase) detects checkout button,
  reads sessionStorage, redirects to Draft Order URL
        │
        ▼
  Shopify checkout shows correct calculated price  ✓
```

### Price formula

```
price = (en_cm / 100) × pileOrani × kanatCount × basePricePerMeter
```

| Parameter       | Description                                         |
|-----------------|-----------------------------------------------------|
| `en_cm`         | Curtain width in centimetres (50–1000)              |
| `pileOrani`     | Pleat ratio: 2.0 (Düz), 2.5 (Kanun Pile), 3.0 (Boru Pile) |
| `kanatCount`    | Panel count: 1 (Tek Kanat) or 2 (Çift Kanat)       |
| `basePricePerMeter` | Variant price from Shopify (₺ per metre of fabric) |

Example: 200 cm × 2.5 × 1 × ₺230/m = **₺1,150.00**

---

## API

### `POST /api/checkout/draft-order`

**Request body** (JSON):

```json
{
  "variantId": 12345678,
  "en": 200,
  "boy": 260,
  "pileStili": "Kanun Pile",
  "pileOrani": 2.5,
  "kanat": "Tek Kanat",
  "kanatCount": 1
}
```

| Field        | Type    | Constraints                                   |
|--------------|---------|-----------------------------------------------|
| `variantId`  | number  | Must be a number                              |
| `en`         | number  | 50–1000 cm                                    |
| `boy`        | number  | 1–600 cm                                      |
| `pileStili`  | string  | Display label (stored in order properties)    |
| `pileOrani`  | number  | One of: 2.0, 2.5, 3.0                        |
| `kanat`      | string  | Display label (stored in order properties)    |
| `kanatCount` | number  | 1 or 2                                        |

**Success response** `200`:

```json
{ "checkoutUrl": "https://inanctekstil.store/..." }
```

**Error responses**:

| Status | `error`               | Cause                                      |
|--------|-----------------------|--------------------------------------------|
| 400    | `INVALID_INPUT`       | Validation failure (see message for detail)|
| 404    | `VARIANT_NOT_FOUND`   | Shopify variant lookup failed              |
| 500    | `AUTH_FAILED`         | Shopify OAuth token request failed         |
| 500    | `INVALID_PRICE`       | Variant price is zero or negative          |
| 500    | `DRAFT_ORDER_FAILED`  | Shopify Draft Orders API returned error    |

### `GET /health`

Returns `{ "status": "ok", "uptime": <seconds> }`.

---

## Environment variables

| Variable                | Description                                              |
|-------------------------|----------------------------------------------------------|
| `SHOPIFY_STORE_DOMAIN`  | e.g. `1z7hb1-2d.myshopify.com`                         |
| `SHOPIFY_CLIENT_ID`     | Custom app client ID (for client_credentials OAuth)      |
| `SHOPIFY_CLIENT_SECRET` | Custom app client secret                                 |
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
docker compose up -d --build curtain-app
```

The service runs as the `curtain-app` container, exposed via Traefik at
`https://app.inanctekstil.store`.

---

## Manual E2E test guide

Tested on production store `inanctekstil.store`. Run this after any deployment.

### Prerequisites
- Browser with no existing cart (or clear the cart first at `/cart`)
- API service is running: `curl https://app.inanctekstil.store/health` → `{"status":"ok",...}`

---

### Step 1 — Add TUL product via configurator

1. Navigate to `https://inanctekstil.store/products/tul-bornova`
2. **Verify**: standard variant picker and buy button are **hidden** (replaced by configurator)
3. In Step 1 (Ölçü Seçimi), enter **En: 200**, **Boy: 250**
4. **Verify**: "Devam Et" becomes enabled
5. Click "Devam Et"
6. **Verify**: Step 1 collapses to "Ölçü: 200 x 250 cm"; Step 2 pile style picker appears
7. Select **Kanun Pile x2.5**
8. Click "Devam Et"
9. **Verify**: Step 2 collapses to "Pile: Kanun Pile"; Step 3 panel picker appears
10. Select **Tek Kanat**
11. Click "Devam Et"
12. **Verify**: Step 3 collapses to "Kanat: Tek Kanat"; Step 4 Onay appears with:
    - Review table: En 200 cm / Boy 250 cm / Pile Stili Kanun Pile / Kanat Tek Kanat
    - **Tahmini Fiyat: 1.150,00 TL** ✓ (formula: 200/100 × 2.5 × 1 × 230)
    - Disclaimer checkbox unchecked; "Sepete Ekle" disabled
13. Check the disclaimer checkbox
14. **Verify**: "Sepete Ekle" becomes enabled
15. Click "Sepete Ekle"
16. **Verify**: Button shows "Hazırlanıyor…" (draft order request in flight)
17. **Verify**: Cart drawer opens with:
    - Item: BORNOVA Tül Perde
    - Properties: En: 200 cm, Boy: 250 cm, Pile Stili: Kanun Pile (x2.5), Kanat: Tek Kanat
    - Line price: **1,150.00TL** ✓
    - Tahmini toplam: 1.150,00 TL

---

### Step 2 — Add STN product via configurator

All products are tagged `perde-tasarla` and show the curtain configurator.

1. Navigate to `https://inanctekstil.store/products/stn-saten`
2. **Verify**: Configurator is visible; standard buy button is hidden
3. **Verify**: Cart badge shows **1** item from the TUL step
4. Complete configurator: En=150, Boy=200 → Boru Pile x3.0 → Çift Kanat
5. Check disclaimer, click "Sepete Ekle"
6. **Verify**: Cart drawer opens with STN line at **1,350.00TL**
   - Formula: (150/100) × 3.0 × 2 × 150 = ₺1,350 ✓
7. **Verify**: Cart badge shows **2**

---

### Step 3 — Verify cart drawer contents

From the cart drawer (while still on `stn-saten` product page):

| Item | Properties | Displayed line price |
|------|-----------|---------------------|
| BORNOVA Tül Perde | En: 200 cm, Boy: 250 cm, Pile Stili: Kanun Pile (x2.5), Kanat: Tek Kanat | 1,150.00TL |
| Saten Perde | En: 150 cm, Boy: 200 cm, Pile Stili: Boru Pile (x3), Kanat: Çift Kanat | 1,350.00TL |

**Verify**: Tahmini toplam shows **2.500,00 TL** (patched by `perde-cart-total.js`) ✓

---

### Step 4 — Checkout from cart drawer (correct path for single-product)

> ⚠️ **Important**: The checkout interceptor only works if you click checkout **while on the last configured product's page**. It only redirects to **that product's draft order** — other items are NOT included (see Known limitations).

**Correct path (single product, Draft Order redirect):**
1. After adding TUL, open the cart drawer while still on `products/tul-bornova`
2. Click "Ödeme" inside the cart drawer
3. **Verify**: URL changes to a Draft Order checkout URL
4. **Verify**: Checkout shows **BORNOVA Tül Perde at ₺1,150.00** ✓ (not ₺230)
5. **Verify**: All configuration properties are visible in the order line

**Multi-product bug path (known issue):**
1. Add STN via configurator on `stn-saten` (draft order URL A stored in sessionStorage)
2. Navigate to `tul-bornova` — `init()` clears sessionStorage, URL A is lost
3. Add TUL via configurator (draft order URL B stored in sessionStorage)
4. Click "Ödeme" from cart drawer
5. **Result**: Checkout shows **only TUL at ₺1,150** — STN (₺1,350) is absent ⚠️

**Cart page bypass bug (known issue):**
1. Navigate to `https://inanctekstil.store/cart` directly
2. Click "Ödeme"
3. **Result**: Regular Shopify checkout at base variant prices (₺230 + ₺150 = ₺380) — not calculated prices ⚠️

---

### Step 5 — Checkout form

1. On the Shopify checkout page (Draft Order path):
2. Fill in contact: email address
3. Delivery method: "Gönder" (ship)
4. Fill in shipping address: Ad, Soyadı, Adres, Şehir (country pre-set to Türkiye)
5. **Verify**: Shipping method appears (e.g. Standart ₺89.00)
6. **Verify**: Order summary shows correct prices
7. Payment: "Kredi / Banka Kartı (PayTR)" — clicking "Şimdi öde" redirects to PayTR

---

## Known limitations

- **Multi-product cart (critical)**: `sessionStorage` holds only one draft order URL at a time.
  Each time a customer lands on a configurator product page, `init()` calls `removeItem` to clear
  the previous URL. If a customer configures two products (e.g. STN then TUL), only the last
  product's draft order URL survives. Clicking "Ödeme" from the cart drawer redirects to that
  last draft order only — the earlier product is in the Shopify cart but not in the checkout order.
  **Verified**: STN (₺1,350) + TUL (₺1,150) in cart → checkout shows only TUL at ₺1,150 ⚠️
  **Fix options**: store a map of `variantId → checkoutUrl` in sessionStorage, or use a
  server-side multi-item draft order, or add a global cart page interceptor that reads all stored URLs.

- **Cart page checkout bypass**: The checkout interceptor is registered by the
  `curtain-configurator` Liquid section, which only renders on pages tagged `perde-tasarla`.
  If a customer navigates to `/cart` and clicks checkout there, the interceptor is not present
  and Shopify routes to regular checkout at base variant prices.
  **Workaround**: Customers should checkout from the cart drawer while on a product page, or
  a global interceptor script should be added to the theme layout.

- **sessionStorage lifetime**: If a customer refreshes the page between adding to cart and
  clicking checkout, `sessionStorage` is cleared (init runs `removeItem`) and checkout falls
  back to the base variant price. This is a known constraint of the Basic plan.

- **Cart total display**: The Shopify cart/checkout shows the stored variant price in the cart
  total. The `perde-cart-total.js` script patches the displayed total on product pages only.
  The correct price is enforced at checkout via the Draft Order URL.

- **Cart Transform** (which would fix all price display issues) requires Shopify Plus.
