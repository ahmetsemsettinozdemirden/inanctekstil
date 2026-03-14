# Ralph Agent Instructions -- Inanc Tekstil E-Commerce Storefront MVP

You are building the e-commerce storefront for inanctekstil.store, a custom curtain shop in Iskenderun, Hatay, Turkey. The site runs WordPress + WooCommerce on a Hetzner Docker stack.

## Your Task

1. Read `scripts/ralph/prd.json` for user stories
2. Read `scripts/ralph/progress.txt` for context from previous iterations
3. Pick the **highest priority** story where `passes: false` and all `dependsOn` stories have `passes: true`
4. Implement it, following acceptance criteria exactly
5. If passing: set `passes: true` in prd.json, commit with descriptive message
6. Append progress to `scripts/ralph/progress.txt`

## Server Access

**SSH:** `ssh -i ~/.ssh/inanctekstil root@5.75.165.158`
**WP-CLI prefix:** `docker exec wordpress wp ... --allow-root`
**MariaDB:** Container `mariadb`, password in `/opt/inanctekstil/.env` on server
**Redis:** Already running and connected for object caching
**Traefik:** Handles SSL (Let's Encrypt auto-renew)

### Running Remote Commands

For server-side stories (WP config, plugin installs, WP-CLI):
```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "docker exec wordpress wp option get blogname --allow-root"
```

For multi-command sequences:
```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 << 'ENDSSH'
docker exec wordpress wp language core install tr_TR --allow-root
docker exec wordpress wp site switch-language tr_TR --allow-root
ENDSSH
```

## Project Structure

```
docs/
  brand/                    -- Brand identity, visual guidelines
    gorsel-kimlik.md        -- Color palette, typography specs
    assets/logo/            -- SVG logos (6 variants)
    assets/favicon/         -- Favicon set
  ecommerce/                -- WooCommerce setup, PayTR, shipping, products
  legal/                    -- Legal page templates (KVKK, Mesafeli Satis, etc.)
  infrastructure/           -- Server, DNS, email, security, backup
  benchmark/                -- TAC competitor analysis, feature gap analysis

plugin/inanc-curtain-calculator/  -- Custom curtain calculator plugin (v2.0.0, DEPLOYED)

gitopsprod/                 -- Terraform + Docker config for Hetzner
  docker/docker-compose.yml -- Production Docker Compose

scripts/ralph/              -- This agent's working directory
```

## Brand Identity

- **Primary color:** #1B2A4A (Deep Navy)
- **Background:** #FFFFFF (White)
- **Text:** #333333 (Charcoal)
- **Accent:** #1B2A4A
- **Border:** #E5E5E5 (Light Gray)
- **Surface:** #F8F8F8 (Off-White)
- **Heading font:** Playfair Display (700)
- **Body font:** Inter (400/600)
- **Logo SVG:** `docs/brand/assets/logo/inanc-tekstil-logo.svg`

## What's Already Done

- Server: Hetzner CX23, Ubuntu 24.04, Docker (Traefik + WordPress + MariaDB + Redis) -- running
- Domain: inanctekstil.store -- live with SSL
- Plugin: inanc-curtain-calculator v2.0.0 -- deployed and tested (Tul, Fon, Blackout, Saten)
- WooCommerce: installed and activated, currency set to TRY
- Redis Object Cache: installed and activated
- Brand identity: logo, favicon, colors, typography -- complete
- Documentation: legal templates, marketing strategy, ecommerce guides -- complete

## Story Types

### Server Stories (WP-CLI / SSH)
These involve running commands on the remote server. Use SSH to execute WP-CLI commands.

### Frontend/Theme Stories (wp-admin configuration)
These involve configuring WordPress/Astra/WooCommerce settings. Most can be done via WP-CLI options or the Customizer API. For complex theme settings, use `wp option update` with serialized data or document manual wp-admin steps.

### Content Stories (page creation, menus)
Use `wp post create`, `wp menu create`, `wp menu item add-post` etc. For page content, read template files from `docs/legal/` and use `--post_content` flag.

## Key References

- WooCommerce settings: `docs/ecommerce/woocommerce-setup.md`
- Shipping zones: `docs/ecommerce/shipping-delivery.md`
- PayTR integration: `docs/ecommerce/paytr-integration.md`
- Product catalog: `docs/ecommerce/product-catalog.md`
- Legal templates: `docs/legal/*.md`
- Brand guidelines: `docs/brand/gorsel-kimlik.md`
- Backup procedures: `docs/infrastructure/backup-recovery.md`
- Email setup: `docs/infrastructure/email-setup.md`
- Feature gap analysis: `docs/benchmark/feature-gap-analysis.md`

## Quality Checks

After EACH server story, verify the change:
```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "docker exec wordpress wp option get <relevant_option> --allow-root"
```

For frontend stories, note what should be visually verified in the browser.

## IMPORTANT Rules

- Read referenced doc files BEFORE implementing a story
- One iteration = ONE user story
- Commit after each completed story (commit the prd.json and progress.txt changes)
- Commit format: `feat(storefront): US-XXX -- <title>`
- DO NOT commit secrets, passwords, or API keys
- For BLOCKED stories (like PayTR): skip and move to next available story
- Turkish language for all customer-facing strings
- Prices in TL (Turkish Lira) format: "1.250,00 TL"
- When creating WordPress pages with content from docs/legal/, read the file content first, then use it in wp post create
- NEVER add Ana Sayfa, Ürünler, Hakkımızda, or İletişim to the navigation menu. The navbar must ONLY contain product category buttons: Tül Perdeler, Fon Perdeler, Blackout Perdeler, Saten

## Completion Signal

When all non-blocked user stories have `passes: true`:
1. Update progress.txt with final summary
2. Output exactly: `<promise>COMPLETE</promise>`
