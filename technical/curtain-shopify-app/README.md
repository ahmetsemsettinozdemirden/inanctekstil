# Design Your Curtain — Shopify App

Private Shopify App for inanctekstil.store. Contains a **Cart Transform** function that intercepts Perde Tasarla configurator cart items and sets the correct calculated price server-side.

## Prerequisites

- **Shopify Partners account** (free) — required to create and deploy the app
  - Sign up at https://partners.shopify.com
  - Create a new app in the Partners dashboard, then copy the Client ID into `shopify.app.toml`
- Shopify CLI 3.x: `npm install -g @shopify/cli`
- Bun: https://bun.sh

## Setup (first time)

1. Create a free Shopify Partners account at https://partners.shopify.com
2. In Partners dashboard: Apps -> Create app -> Custom app -> give it a name
3. Copy the **Client ID** into `shopify.app.toml`:
   ```toml
   client_id = "<your-client-id>"
   ```
4. Install dependencies:
   ```bash
   bun install
   ```

## Development

```bash
# Type check
bun run typecheck

# Lint
bun run lint

# Build the function WASM
bun run build

# Deploy to store
bun run deploy
# or: shopify app deploy
```

## Deploy

```bash
cd technical/curtain-shopify-app
shopify app deploy
```

After deploying, install the app on the store via the Partners dashboard install URL, then activate the Cart Transform function in Shopify Admin -> Settings -> Custom data -> Functions.

## Project Structure

```
shopify.app.toml                   -- App configuration (add client_id from Partners)
extensions/
  cart-transform/
    shopify.extension.toml         -- Function extension config
    src/
      run.ts                       -- Cart Transform implementation
```

## Pricing Formula

The Cart Transform function calculates:

```
total = (en_cm / 100) * pile_orani * kanat_count * base_price_per_meter
```

Line item properties set by the configurator:
- `_en` — width in cm
- `_boy` — height in cm
- `_pile_stili` — pleat style name
- `_pile_orani` — pleat ratio (2.0, 2.5, or 3.0)
- `_kanat` — panel label (Tek Kanat / Cift Kanat)
