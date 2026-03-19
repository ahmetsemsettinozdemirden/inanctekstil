# Ralph Agent Instructions — Server-side Cart

You are improving the curtain checkout flow for inanctekstil.store. The goal is to replace sessionStorage with server-side Postgres storage keyed to the Shopify cart token, so multi-product carts and page refreshes work correctly.

Full design spec: `docs/superpowers/specs/2026-03-19-server-side-cart-design.md`

## Your Task

1. Read `scripts/server-side-cart/prd.json` for user stories
2. Read `scripts/server-side-cart/progress.txt` for context from previous iterations
3. Pick the **highest priority** story where `passes: false` and all `dependsOn` stories have `passes: true`
4. Implement it, following acceptance criteria exactly
5. If passing: set `passes: true` in prd.json, commit with descriptive message
6. Append progress to `scripts/server-side-cart/progress.txt`

## Project Structure

```
technical/curtain-checkout-api/   -- Hono/Bun HTTP service (the API)
  src/app.ts                      -- Main app (routes)
  src/db.ts                       -- Postgres client (to be created in US-002)
  src/app.test.ts                 -- Tests (bun test)
  package.json
  tsconfig.json

technical/theme/                  -- Shopify Horizon theme
  sections/curtain-configurator.liquid  -- Configurator UI (4-step form)
  assets/perde-checkout.js        -- Global interceptor (to be created in US-007)
  layout/theme.liquid             -- Global layout
  templates/product.json

technical/gitopsprod/             -- Terraform + Docker Compose infra
  docker-compose.yml              -- Add curtain-db here in US-001

scripts/server-side-cart/         -- This agent's working directory
  prd.json                        -- User stories
  progress.txt                    -- Progress log
  CLAUDE.md                       -- These instructions
```

## Store & Server Details

- **Store domain:** `inanctekstil.store`
- **Myshopify domain:** `1z7hb1-2d.myshopify.com`
- **Theme:** Horizon, **production theme ID:** `193714913361`
- **API:** `https://app.inanctekstil.store` (Docker on Hetzner `5.75.165.158`)
- **SSH:** `ssh -i ~/.ssh/inanctekstil root@5.75.165.158`
- **Docker Compose dir on server:** `/opt/inanctekstil/`
- **curtain-checkout-api source on server:** `/opt/curtain-checkout-api/`
- **Env file on server:** `/opt/inanctekstil/.env`

## Quality Gates

**API stories (US-002 through US-005):**
```bash
cd technical/curtain-checkout-api
bun run typecheck   # must pass
bun test src/       # must pass
```

**Theme stories (US-006, US-007):**
```bash
shopify theme push --theme 193714913361 --store 1z7hb1-2d.myshopify.com \
  --only "<file>" --nodelete --path technical/theme
```
Plus browser verification via Playwright MCP.

**Infrastructure story (US-001):**
- Edit `technical/gitopsprod/docker-compose.yml`
- Document env var in `technical/curtain-checkout-api/README.md`
- No automated test — acceptance is the docker-compose.yml change committed

## Key Implementation Details

### Existing API (app.ts)
- Hono framework, Bun runtime
- `POST /api/checkout/draft-order` — this endpoint is REMOVED and replaced by two new ones
- CORS currently `origin: "*"` — change to `https://inanctekstil.store`
- Shopify auth: `client_credentials` OAuth flow (`SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET`, `SHOPIFY_STORE_DOMAIN`)

### New Postgres client (src/db.ts)
- Use `postgres` npm package (porsager/postgres)
- Connection from `CURTAIN_DATABASE_URL` env var
- Run schema migration (`CREATE TABLE IF NOT EXISTS cart_items`) on startup
- Cleanup job: delete rows older than 7 days on startup + every 24h via setInterval

### Price Formula
```
calculatedPrice = (en_cm / 100) × pileOrani × kanatCount × basePricePerMeter
```
boy_cm is stored for cutting reference only — it does NOT affect price.

### cartToken
Shopify cart token from `GET /cart.js` → `cart.token`. Stable across page refreshes.
Validation: alphanumeric + hyphens only, max 64 chars.

### Shopify CLI
Always use `--path technical/theme` for theme commands.

## Deployment (US-008)

```bash
# Copy source to server
scp -r -i ~/.ssh/inanctekstil \
  technical/curtain-checkout-api/src \
  technical/curtain-checkout-api/package.json \
  technical/curtain-checkout-api/tsconfig.json \
  root@5.75.165.158:/opt/curtain-checkout-api/

# SSH and rebuild
ssh -i ~/.ssh/inanctekstil root@5.75.165.158
cd /opt/inanctekstil
docker compose up -d curtain-db          # start DB first
docker compose up -d --build curtain-app # rebuild API
```

## Commit Format

```
feat(server-side-cart): US-XXX — <title>
```

## IMPORTANT Rules

- Read referenced files BEFORE implementing a story
- One iteration = ONE user story
- Commit after each completed story (commit prd.json and progress.txt too)
- DO NOT commit secrets, API keys, or credentials
- All customer-facing strings in Turkish

## Completion Signal

When all user stories have `passes: true`:
1. Update progress.txt with final summary
2. Output exactly: `<promise>COMPLETE</promise>`
