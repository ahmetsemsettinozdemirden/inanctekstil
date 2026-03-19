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

## Known limitations

- **sessionStorage lifetime**: If a customer refreshes the page between adding to cart and
  clicking checkout, `sessionStorage` is cleared and checkout falls back to the base variant
  price (₺/m). This is a known constraint of the Basic plan.
- **Cart Transform** (which would fix this properly) requires Shopify Plus.
