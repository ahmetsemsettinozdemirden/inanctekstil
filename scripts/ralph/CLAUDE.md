# Ralph Agent Instructions — Perde Tasarla Curtain Configurator

You are building the "Perde Tasarla" curtain configurator for inanctekstil.store, a custom curtain shop in Iskenderun, Hatay, Turkey. The site runs on Shopify (Horizon theme).

## Your Task

1. Read `scripts/ralph/prd.json` for user stories
2. Read `scripts/ralph/progress.txt` for context from previous iterations
3. Pick the **highest priority** story where `passes: false` and all `dependsOn` stories have `passes: true`
4. Implement it, following acceptance criteria exactly
5. If passing: set `passes: true` in prd.json, commit with descriptive message
6. Append progress to `scripts/ralph/progress.txt`

## Project Structure

```
technical/theme/          -- Shopify Horizon theme files (always use --path technical/theme with CLI)
  templates/              -- JSON templates (product.json, index.json, etc.)
  sections/               -- Liquid sections
  assets/                 -- CSS, JS, SVGs
  snippets/               -- Liquid snippets

technical/curtain-shopify-app/  -- Private Shopify App (Cart Transform function)
  extensions/cart-transform/                -- Shopify Function (Cart Transform)
  shopify.app.toml

scripts/ralph/            -- This agent's working directory
  prd.json                -- User stories
  progress.txt            -- Progress log
  CLAUDE.md               -- These instructions

docs/                     -- Specs, brand guidelines, competitor analysis
```

## Store Details

- **Store domain:** `inanctekstil.store`
- **Myshopify domain:** `1z7hb1-2d.myshopify.com`
- **Admin:** `https://1z7hb1-2d.myshopify.com/admin`
- **Theme:** Horizon
- **Shopify plan:** Basic (Shopify Functions supported)

## Shopify CLI Commands

Always use `--path technical/theme` for theme commands.

```bash
# Push specific files
shopify theme push --theme <THEME_ID> --store 1z7hb1-2d.myshopify.com --only "sections/curtain-configurator.liquid" --nodelete --path technical/theme

# Push multiple files
shopify theme push --theme <THEME_ID> --store 1z7hb1-2d.myshopify.com --only "sections/curtain-configurator.liquid" --only "templates/product.json" --nodelete --path technical/theme

# Pull files from remote theme
shopify theme pull --theme <THEME_ID> --store 1z7hb1-2d.myshopify.com --only "templates/product.json" --path technical/theme

# List themes (to find theme IDs)
shopify theme list --store 1z7hb1-2d.myshopify.com

# Deploy Shopify app (from app directory)
cd technical/curtain-shopify-app && shopify app deploy
```

## Quality Gates

**Theme stories (no bun project):**
- `shopify theme push` completes without errors
- Manual browser verification via Playwright MCP

**App stories (bun project at technical/curtain-shopify-app/):**
- `bun run typecheck && bun run lint`
- Manual browser verification via Playwright MCP (where applicable)

## Brand Identity

- **Primary color:** #1B2A4A (Deep Navy)
- **Background:** #FFFFFF (White)
- **Text:** #333333 (Charcoal)
- **Border:** #E5E5E5 (Light Gray)
- **Surface:** #F8F8F8 (Off-White)
- **Heading font:** Playfair Display (700)
- **Body font:** Inter (400/600)

## Key Implementation Details

### Configurator Behaviour
- Renders only on products tagged `perde-tasarla`
- Hides standard Horizon variant-picker and buy-buttons blocks via CSS when active
- 4 sequential steps: Ölçü Seçimi → Pile Stili → Kanat Seçimi → Onay
- Completed steps show a collapsed summary row

### Pricing Formula
```
total = (en_cm / 100) × pleat_ratio × panel_count × base_price_per_meter
```
Pleat ratios: Düz Dikiş = 2.0, Kanun Pile = 2.5, Boru Pile = 3.0

### Cart Submission
POST to `/cart/add.js` with:
- `quantity: 1`
- `id: <variant_id>`
- `properties: { _en, _boy, _pile_stili, _pile_orani, _kanat }`

Cart Transform function intercepts and sets the correct price server-side.

### Product Metafield
- Namespace: `custom`, Key: `max_boy_cm`, Type: `number_integer`
- Read in Liquid: `product.metafields.custom.max_boy_cm`
- Min width hardcoded: 50cm for all curtain products

## Key Gotchas

- **Always use `--path technical/theme`** with Shopify CLI — without it, push reports success but uploads nothing
- **JSONC format:** Horizon theme files use `/* */` comment headers — this is normal
- **Preview URLs:** `https://inanctekstil.store/?preview_theme_id=<THEME_ID>`
- **Shopify Partners account** required to deploy the custom app (US-007 prerequisite)
- **All customer-facing strings must be in Turkish**
- **Prices formatted as:** `1.695,00 TL`

## Commit Format

```
feat(perde-tasarla): US-XXX — <title>
```

## IMPORTANT Rules

- Read referenced files BEFORE implementing a story
- One iteration = ONE user story
- Commit after each completed story (commit prd.json and progress.txt changes too)
- DO NOT commit secrets, API keys, or app credentials
- Turkish language for all customer-facing strings

## Completion Signal

When all user stories have `passes: true`:
1. Update progress.txt with final summary
2. Output exactly: `<promise>COMPLETE</promise>`
