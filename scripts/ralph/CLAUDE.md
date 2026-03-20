# Ralph Agent Instructions — Odanda Gör AI Room Visualizer

You are building the "Odanda Gör" feature for inanctekstil.store — an AI room visualizer where customers upload a room photo, select a curtain, and fal.ai generates a new version of the room with that curtain placed. The site runs on Shopify (Horizon theme) with a Bun/Hono backend on Hetzner.

## Your Task

1. Read `scripts/ralph/prd.json` for user stories
2. Read `scripts/ralph/progress.txt` for context from previous iterations
3. Pick the **highest priority** story where `passes: false` and all `dependsOn` stories have `passes: true`
4. Read the spec FIRST before implementing: `docs/superpowers/specs/2026-03-19-odanda-gor-design.md`
5. Implement the story, following acceptance criteria exactly
6. If passing: set `passes: true` in prd.json, commit with descriptive message
7. Append progress to `scripts/ralph/progress.txt`

## Project Structure

```
technical/room-visualizer/     -- New backend service (Bun/Hono)
  baml_src/                    -- BAML definitions (Claude Opus evaluator)
  src/
    index.ts                   -- Hono server entry
    config.ts                  -- Env vars, thresholds
    routes/visualize.ts        -- POST /api/visualize
    lib/
      fal.ts                   -- fal.ai client + retry loop
      evaluator.ts             -- BAML quality evaluator
      prompt-builder.ts        -- Curtain data → prompt
      shopify.ts               -- Shopify product fetcher
      pms.ts                   -- PMS swatch fetcher (optional)
      logger.ts                -- pino structured logger
  tests/
  Dockerfile
  README.md

technical/theme/               -- Shopify Horizon theme (always use --path technical/theme with CLI)
  templates/                   -- JSON templates (product.json, index.json, etc.)
  sections/                    -- Liquid sections
  assets/
    room-visualizer.ts         -- TypeScript source (compiled → room-visualizer.js via esbuild)
    room-visualizer.js         -- Compiled IIFE output (committed + pushed to Shopify)
  snippets/
    room-visualizer-button.liquid

technical/gitopsprod/
  dns.tf                       -- Add hcloud_zone_record for visualizer subdomain

scripts/ralph/                 -- This agent's working directory
  prd.json                     -- User stories
  progress.txt                 -- Progress log
  CLAUDE.md                    -- These instructions

docs/superpowers/specs/2026-03-19-odanda-gor-design.md  -- Full feature spec
```

## Store Details

- **Store domain:** `inanctekstil.store`
- **Myshopify domain:** `1z7hb1-2d.myshopify.com`
- **Production theme ID:** `193714913361`
- **Shopify plan:** Basic

## Server Details

- **IP:** `5.75.165.158`
- **SSH:** `ssh -i ~/.ssh/inanctekstil root@5.75.165.158`
- **Docker stack:** `/opt/inanctekstil/`
- **New service path:** `/opt/room-visualizer/`

## Shopify CLI Commands

Always use `--path technical/theme` for theme commands.

```bash
# Push specific files
shopify theme push --theme 193714913361 --store 1z7hb1-2d.myshopify.com \
  --only "assets/room-visualizer.js" --nodelete --path technical/theme

# Pull files from remote theme
shopify theme pull --theme 193714913361 --store 1z7hb1-2d.myshopify.com \
  --only "templates/product.json" --path technical/theme
```

## Quality Gates

**Backend stories (technical/room-visualizer/):**
- `bun run typecheck` passes
- `bun run lint` passes

**Frontend build stories (technical/theme/):**
- `npm run build` produces valid IIFE room-visualizer.js
- `shopify theme push` completes without errors

**UI stories (modal/page visible in browser):**
- Verified in browser via Playwright MCP

## Key Implementation Details

### API Endpoint
- `POST https://visualizer.inanctekstil.store/api/visualize`
- Content-Type: `multipart/form-data`
- Fields: `product_id` (Shopify GID) + `room_image` (File)
- CORS: `Access-Control-Allow-Origin: https://inanctekstil.store` on ALL responses

### AI Pipeline
1. Fetch product data (Shopify Admin GraphQL + PMS swatch)
2. Build prompt: `"A modern Turkish living room with {color} {type} curtains hanging on the windows, photorealistic, interior design photography, natural lighting, high quality"`
3. Call `fal-ai/nano-banana-pro` with room photo + curtain image + prompt (45s timeout)
4. Download result as binary immediately
5. Evaluate with Claude Opus 4.6 (Bedrock via BAML) → `{score: 1-10, has_curtains: bool, feedback: string}`
6. Retry if `score < 7` OR `has_curtains == false`, up to 3 attempts
7. Return binary with highest score

### Response Format
- Success: `Content-Type: image/jpeg` binary
- Headers: `X-Product-Title` (percent-encoded), `X-Attempts-Used`, `X-Final-Score`
- Error: JSON `{success: false, error: {code, message}}`

### Frontend Modal
- `initRoomVisualizer(config)` function injected into global scope
- Config: `{ productId?, productHandle?, apiUrl, dataProductsJson? }`
- If `productId` present → skip curtain picker (State 2)
- If absent → show curtain picker (reads `dataProductsJson`)
- Result image rendered from `URL.createObjectURL(blob)` — never a remote URL
- "Sipariş Ver" CTA: if opened from product page → scroll to configurator; if from dedicated page → navigate to `/{productHandle}`

### Brand Identity
- **Primary color:** #1B2A4A (Deep Navy)
- **Background:** #FFFFFF (White)
- **Text:** #333333 (Charcoal)
- **Heading font:** Playfair Display (700)
- **Body font:** Inter (400/600)
- All customer-facing strings in **Turkish**

## Commit Format

```
feat(odanda-gor): US-XXX — <title>
```

## IMPORTANT Rules

- Read the spec `docs/superpowers/specs/2026-03-19-odanda-gor-design.md` BEFORE implementing any story
- Read referenced files before implementing
- One iteration = ONE user story
- Commit after each completed story (commit prd.json and progress.txt changes too)
- DO NOT commit secrets, API keys, or credentials
- Turkish language for all customer-facing strings
- Always `--path technical/theme` with Shopify CLI

## Completion Signal

When all user stories have `passes: true`:
1. Update progress.txt with final summary
2. Output exactly: `<promise>COMPLETE</promise>`
