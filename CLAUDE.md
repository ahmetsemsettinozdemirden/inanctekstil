# Inanc Tekstil - Project Instructions

Custom curtain e-commerce store based in Iskenderun, Hatay, Turkey.

## Platform

**Shopify** (migrated from WordPress/WooCommerce). Theme: **Horizon**.

- Store: `inanctekstil.store`
- Myshopify domain: `1z7hb1-2d.myshopify.com`
- Admin: `https://1z7hb1-2d.myshopify.com/admin`

## Shopify Theme Development

### Directory Structure

Theme files live under `technical/theme/` — not the project root.

```
technical/theme/
  templates/          -- JSON templates (index.json, product.json, etc.)
  sections/           -- Section group JSON (header-group.json, footer-group.json)
  assets/             -- CSS, JS, images
  snippets/           -- Liquid snippets
  layout/             -- Layout files
```

### Shopify CLI Commands

Always use `--path technical/theme` since theme files are in a subdirectory, not the project root.

```bash
# Push specific files to a theme
shopify theme push --theme <THEME_ID> --store 1z7hb1-2d.myshopify.com --only "templates/index.json" --nodelete --path technical/theme

# Push multiple files
shopify theme push --theme <THEME_ID> --store 1z7hb1-2d.myshopify.com --only "templates/index.json" --only "sections/header-group.json" --nodelete --path technical/theme

# Pull files from remote theme
shopify theme pull --theme <THEME_ID> --store 1z7hb1-2d.myshopify.com --only "templates/index.json" --path technical/theme

# List all themes (to find theme IDs)
shopify theme list --store 1z7hb1-2d.myshopify.com

# Publish a theme
shopify theme publish --theme <THEME_ID> --store 1z7hb1-2d.myshopify.com --force

# Create preview (unpublished) theme
shopify theme push --unpublished --store 1z7hb1-2d.myshopify.com --path technical/theme
```

### Workflow: Safe Preview Before Publishing

1. Push changes to an unpublished theme (or create one with `--unpublished`)
2. Preview at: `https://inanctekstil.store/?preview_theme_id=<THEME_ID>`
3. Verify with screenshots
4. Publish when approved: `shopify theme publish --theme <THEME_ID> --force`

### Key Gotchas

- **Always use `--path technical/theme`** — without it, CLI looks in project root and silently uploads the wrong (or no) files
- **Preview URLs**: the myshopify URL redirects to custom domain but preserves `?preview_theme_id=` param
- **JSONC format**: Horizon theme files use `/* */` comment headers — this is normal and supported
- **Built-in sections preferred**: use native Horizon sections (hero, product-list, collection-links, custom-liquid) configured via JSON rather than custom .liquid files
- **`custom-liquid` section**: use for content Horizon doesn't have built-in sections for (YouTube embeds, FAQ accordions, etc.)

## Collections

| Handle | Name |
|--------|------|
| tul-perdeler | Tul Perdeler |
| fon-perdeler | Fon Perdeler |
| blackout-perdeler | Blackout Perdeler |
| saten-perdeler | Saten Perdeler |

## Language

All customer-facing strings must be in Turkish. Prices in TL.

## Project Components

- `technical/theme/` — Shopify Horizon theme files
- `image-generator/` — Product image generation tool (Bun + TypeScript)
- `plugin/` — Legacy WordPress plugins (inanc-curtain-calculator, inanc-site-features)
- `gitopsprod/` — Terraform infrastructure (DNS, old Docker stack)
- `docs/` — Specs, plans, brand guidelines
- `products/` — Product data
