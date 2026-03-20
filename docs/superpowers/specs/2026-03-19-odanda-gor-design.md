# Odanda Gör — AI Room Visualizer

**Date:** 2026-03-19
**Status:** Approved
**Workstream:** A — AI Room Visualizer

---

## 1. Overview

A feature that lets customers upload a photo of their room and see any İnanç Tekstil curtain composited into that photo using AI. Primary goal: drive orders through the Perde Tasarla configurator.

### Entry Points

| Entry | Behavior |
|-------|----------|
| `/pages/odanda-gor` | Dedicated Shopify page — Reels ad landing destination. Curtain picker shown first. |
| Product detail pages | "Odanda Gör" button opens fullscreen modal with that product pre-selected. Curtain picker skipped. |

### Out of Scope

- Real-time AR camera overlay
- Precise window detection / manual window marking
- Multi-curtain visualization in one session
- Trendyol or external platform integration

---

## 2. Architecture

```
SHOPIFY THEME
├── /pages/odanda-gor        (custom-liquid section — ad landing page)
└── Product detail pages     (room-visualizer-button.liquid snippet)
         │
         │ fullscreen modal (room-visualizer.ts → room-visualizer.js)
         │
         └── POST /api/visualize  (multipart/form-data)
                    │
         ┌──────────▼──────────────────────────┐
         │  room-visualizer (Bun/Hono)          │
         │  Hetzner Docker                      │
         │  visualizer.inanctekstil.store        │
         │                                      │
         │  1. Validate input                   │
         │  2. Fetch curtain data               │
         │     (Shopify API + PMS optional)     │
         │  3. Build prompt                     │
         │  4. Call fal-ai/nano-banana-pro       │
         │     (45s timeout per attempt)        │
         │  5. Download + store result binary   │
         │  6. Evaluate with Claude Opus 4.6    │
         │     (Amazon Bedrock via BAML)        │
         │  7. Retry up to 3x if score < 7      │
         │     or has_curtains == false         │
         │  8. Return best result as binary     │
         │  9. Free attempt buffers             │
         └──────────────────────────────────────┘
```

### Key Decisions

- **Vanilla TypeScript** for frontend — compiled via esbuild to IIFE, no framework needed
- **Bun + Hono** backend — consistent with curtain-checkout-api pattern
- **multipart/form-data** for upload — avoids base64 body size inflation
- **fal-ai/nano-banana-pro** — image-to-image generation model (configurable via `FAL_MODEL` env var)
- **Backend proxies result** — downloads fal.ai CDN image immediately after generation; returns binary to frontend to avoid ephemeral URL expiry
- **BAML + Claude Opus 4.6 (Bedrock)** — structured quality evaluation, returns `{ score: 1-10, has_curtains: bool, feedback: string }`
- **Bedrock model ARN:** `anthropic.claude-opus-4-6` — verify the exact cross-region inference profile ARN in AWS Bedrock console before deploy (format: `us.anthropic.claude-opus-4-6-YYYYMMDD-v1:0`)
- **Auto-retry up to 3x** — retry when `score < 7` OR `has_curtains == false`; all binaries held in memory scoped to request lifecycle, freed after response is written
- **Separate codebase** — `technical/room-visualizer/`, not inside PMS

---

## 3. Frontend

### Dedicated Page (`/pages/odanda-gor`)

Shopify `custom-liquid` section. Serves as Reels ad landing page — customer understands the feature before tapping.

- **Hero:** "Perdenizi Odanızda Görün" headline + 1-line subtitle
- **3-step explainer** (horizontal desktop / vertical mobile):
  1. Odanızın fotoğrafını yükleyin
  2. Perdenizi seçin
  3. Yapay zeka perdenizi odanıza eklesin
- **CTA:** "Hemen Dene" button → opens modal

### Modal — 5 States

**State 1: Upload**
- Drag-drop zone + "Galeri" (file input) + "Kamera" (camera capture) buttons
- Mobile: `accept="image/*" capture="environment"` for native camera
- Desktop: file input only
- Max 10MB client-side validation, accepted formats: jpg / png / webp
- On select: validates size + format before proceeding

**State 2: Curtain Picker** (dedicated page only — skipped when opened from product page)
- Shopify product list inlined by Liquid into the `custom-liquid` section as a JSON data attribute on the modal container element: `data-products='[{"id":"gid://...","handle":"blk-sonil","title":"...","image":"...","type":"BLACKOUT"},...]'`
- Frontend reads `data-products` on init — no Ajax call needed
- Products grouped by type (TUL, FON, BLACKOUT); tap to select
- Selected product's `id` and `handle` stored in modal state for use in API call and "Sipariş Ver" navigation
- Back button returns to State 1

**State 3: Loading**
- Uploaded room photo shown dimmed behind a progress indicator
- Copy: "Yapay zeka odanızı hazırlıyor"
- Retries are silent — no retry UI exposed

**State 4: Result**
- Full-bleed generated image (rendered from `URL.createObjectURL(blob)` — never a remote URL)
- Product name below image
- "Kaydet" button — `URL.createObjectURL(blob)` anchor download; Web Share API on mobile if supported
- "Sipariş Ver" CTA:
  - Opened from product page → closes modal, scrolls to Perde Tasarla configurator on same page
  - Opened from dedicated page → navigates to `/{product_handle}` (handle retained from State 2 selection)

**State 5: Error**
- Error icon + message: "Görsel oluşturulamadı. Lütfen tekrar deneyin."
- "Tekrar Dene" button → returns to State 1 (Upload)
- Triggered by: 429, 502, network failure, client-side validation failure

### Implementation Notes

- Modal injected into `<body>` on first open (not pre-rendered in DOM)
- Single TS source: `technical/theme/assets/room-visualizer.ts`
- Build: **esbuild** bundles to IIFE → `technical/theme/assets/room-visualizer.js`
  - `tsconfig.json`: `target: "ES2017"`, `strict: true`, `noEmit: true` (esbuild handles emit)
  - esbuild: `--bundle --format=iife --target=es2017 --outfile=assets/room-visualizer.js assets/room-visualizer.ts`
  - `technical/theme/package.json` with `build` script
- Button snippet: `technical/theme/snippets/room-visualizer-button.liquid`
- Compiled `room-visualizer.js` committed to repo and pushed with `shopify theme push`

---

## 4. Backend Service

### Endpoint

`POST https://visualizer.inanctekstil.store/api/visualize`

**Content-Type:** `multipart/form-data`

**CORS:** `Access-Control-Allow-Origin: https://inanctekstil.store` on all responses including OPTIONS preflight.

**Body size:** Hono configured with `bodyLimit(12 * 1024 * 1024)` (12MB). Traefik `maxRequestBodyBytes=15728640` (15MB) via middleware label.

### Request (multipart fields)

| Field | Type | Description |
|-------|------|-------------|
| `product_id` | string | Shopify GID, e.g. `gid://shopify/Product/15726200684625` |
| `room_image` | File | Room photo, max 10MB, jpg/png/webp |

### Processing Pipeline

1. **Validate** — product_id present and non-empty; image valid (format + size ≤ 10MB)
2. **Fetch curtain data** — Shopify API for title, images, metafields (type, color); PMS swatch texture if available (falls back to Shopify image)
3. **Build prompt** — image reference (swatch or product photo) + text prompt (see Prompt Strategy below)
4. **Call fal-ai/nano-banana-pro** — room photo + curtain reference image + prompt; **45s timeout per attempt**; if timeout exceeded, count as failed attempt
5. **Download result** — immediately fetch the fal.ai CDN image as binary; store `{ binary: Buffer, score: number }` in attempt array scoped to this request
6. **Evaluate** — BAML calls Claude Opus 4.6 (Bedrock) with downloaded binary → `{ score: 1-10, has_curtains: bool, feedback: string }`
7. **Retry logic** — retry if (`score < 7` OR `has_curtains == false`) AND `attempts < 3`; adjust prompt and use new seed on retry
8. **Return best** — select attempt with highest score from attempt array; send binary as `image/jpeg` response; free attempt array after response is written
9. **Known limitation:** rate limiting is in-memory, resets on container restart; acceptable for single-instance deployment

### Prompt Strategy

`room_style` is the fixed constant `"modern Turkish living room"`.

**Base prompt:**
```
A modern Turkish living room with [curtain_color] [curtain_type] curtains
hanging on the windows, photorealistic, interior design photography,
natural lighting, high quality
```

**On retry:** append `", curtains prominently visible on windows, window treatment focal point"` and use a new random seed.

`[curtain_color]` and `[curtain_type]` are derived from Shopify product metafields (`curtain.color`, `curtain.type`).

### Success Response

**Content-Type:** `image/jpeg` (binary)

Response headers (all non-ASCII values percent-encoded per RFC 3986):

```
X-Product-Title: HAVUZ%20Blackout%20Perde%20-%20Bambu
X-Attempts-Used: 2
X-Final-Score: 8
```

Frontend decodes `decodeURIComponent(response.headers.get('X-Product-Title'))` before display.

### Error Responses (JSON)

| Code | HTTP | Meaning |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | Invalid image format/size or missing product_id |
| `PRODUCT_NOT_FOUND` | 404 | Product not found in Shopify |
| `GENERATION_FAILED` | 502 | fal.ai or Bedrock failed / timed out across all 3 attempts |
| `RATE_LIMITED` | 429 | 5 requests/min per IP (in-memory) |

### Quality Evaluator (BAML)

```baml
// baml_src/evaluator.baml
function EvaluateRoomImage(image: image, product_name: string) -> EvaluationResult

class EvaluationResult {
  score        int     @description("1-10 overall quality score")
  has_curtains bool    @description("Are curtains clearly visible on the windows?")
  feedback     string  @description("Brief reason for score")
}
```

Provider in `baml_src/clients.baml`:
```baml
client ClaudeOpus {
  provider "aws-bedrock"
  options {
    model "anthropic.claude-opus-4-6"  // verify cross-region inference ARN before deploy
    aws_region env.AWS_REGION
  }
}
```

### Logging (pino)

```json
{ "level": "info", "event": "visualize_start", "product_id": "...", "image_size_bytes": 1240000 }
{ "level": "info", "event": "fal_call", "attempt": 1, "model": "fal-ai/nano-banana-pro", "seed": 42 }
{ "level": "info", "event": "fal_downloaded", "attempt": 1, "bytes": 980000 }
{ "level": "info", "event": "eval_result", "attempt": 1, "score": 5, "has_curtains": false }
{ "level": "info", "event": "fal_call", "attempt": 2, "model": "fal-ai/nano-banana-pro", "seed": 99 }
{ "level": "info", "event": "fal_downloaded", "attempt": 2, "bytes": 1020000 }
{ "level": "info", "event": "eval_result", "attempt": 2, "score": 8, "has_curtains": true }
{ "level": "info", "event": "visualize_complete", "best_attempt": 2, "final_score": 8, "duration_ms": 9100 }
```

---

## 5. File Structure

### Backend

```
technical/room-visualizer/
├── baml_src/
│   ├── clients.baml          # Bedrock provider: claude-opus-4-6
│   └── evaluator.baml        # EvaluateRoomImage function
├── src/
│   ├── index.ts              # Hono server entry (CORS, bodyLimit, routes)
│   ├── config.ts             # env vars, model names, thresholds (SCORE_THRESHOLD=7, MAX_ATTEMPTS=3, FAL_TIMEOUT_MS=45000)
│   ├── routes/
│   │   └── visualize.ts      # POST /api/visualize
│   └── lib/
│       ├── fal.ts            # fal.ai client + retry loop + attempt buffer management
│       ├── evaluator.ts      # BAML-generated client usage
│       ├── prompt-builder.ts # curtain data → prompt construction + retry adjustment
│       ├── shopify.ts        # Shopify product data fetcher
│       ├── pms.ts            # PMS swatch fetcher (optional, falls back to Shopify image)
│       └── logger.ts         # pino structured logger
├── tests/
│   ├── fal.test.ts           # retry: 3-attempt max; has_curtains=false triggers retry; returns highest-scored binary; buffers freed post-response
│   ├── evaluator.test.ts     # score < 7 triggers retry; has_curtains=false triggers retry; score >= 7 + has_curtains=true stops
│   ├── prompt-builder.test.ts # base prompt; retry prompt appends prominence text; new seed on retry
│   └── visualize.test.ts     # CORS headers on all responses; multipart parsing; PRODUCT_NOT_FOUND; GENERATION_FAILED after 3 attempts; 45s timeout respected
├── Dockerfile
└── package.json
```

### Frontend (Shopify Theme)

```
technical/theme/
├── assets/
│   ├── room-visualizer.ts    # TypeScript source
│   └── room-visualizer.js    # esbuild IIFE output (committed, pushed to Shopify)
├── snippets/
│   └── room-visualizer-button.liquid
└── package.json              # esbuild build script
```

---

## 6. Infrastructure

### Docker (Hetzner)

```yaml
# /opt/inanctekstil/docker-compose.yml — new service
room-visualizer:
  build: /opt/room-visualizer
  restart: unless-stopped
  environment:
    - FAL_API_KEY
    - FAL_MODEL=${FAL_MODEL:-fal-ai/nano-banana-pro}
    - SHOPIFY_ACCESS_TOKEN
    - SHOPIFY_STORE_DOMAIN
    - AWS_ACCESS_KEY_ID
    - AWS_SECRET_ACCESS_KEY
    - AWS_REGION
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.visualizer.rule=Host(`visualizer.inanctekstil.store`)"
    - "traefik.http.routers.visualizer.tls.certresolver=letsencrypt"
    - "traefik.http.middlewares.visualizer-limit.buffering.maxRequestBodyBytes=15728640"
    - "traefik.http.routers.visualizer.middlewares=visualizer-limit"
```

### Environment Variables

Add to `/opt/inanctekstil/.env`:
```
FAL_API_KEY=<from fal.ai dashboard>
FAL_MODEL=fal-ai/nano-banana-pro
SHOPIFY_STORE_DOMAIN=inanctekstil.store
AWS_ACCESS_KEY_ID=<IAM key with bedrock:InvokeModel permission>
AWS_SECRET_ACCESS_KEY=<secret>
AWS_REGION=us-east-1
```

`SHOPIFY_ACCESS_TOKEN` is already in `.env` (currently empty — must be filled before deploy).

### DNS

New record in `technical/gitopsprod/dns.tf`:
```hcl
resource "hcloud_zone_record" "visualizer" {
  zone  = hcloud_zone.main.id
  name  = "visualizer"
  type  = "A"
  value = "5.75.165.158"
}
```

### Deploy

```bash
# 1. Build frontend
cd technical/theme && npm run build

# 2. Push theme changes
shopify theme push --theme 193714913361 --store 1z7hb1-2d.myshopify.com \
  --only "assets/room-visualizer.js" \
  --only "snippets/room-visualizer-button.liquid" \
  --nodelete --path technical/theme

# 3. Deploy backend
rsync -av technical/room-visualizer/ root@5.75.165.158:/opt/room-visualizer/

# 4. Add new env vars to /opt/inanctekstil/.env on server
#    (FAL_API_KEY, FAL_MODEL, SHOPIFY_STORE_DOMAIN, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION)

# 5. Start container
ssh root@5.75.165.158 "cd /opt/inanctekstil && docker compose up -d --build room-visualizer"

# 6. Apply DNS
cd technical/gitopsprod && terraform apply
```

---

## 7. Testing Strategy

**Backend** (Bun test runner):
- All fal.ai and BAML/Bedrock calls mocked
- `fal.test.ts` — 3-attempt max enforced; `has_curtains=false` triggers retry regardless of score; returns binary from highest-scored attempt; attempt buffers freed after response
- `evaluator.test.ts` — `score < 7` triggers retry; `has_curtains=false` triggers retry; `score >= 7 AND has_curtains=true` stops loop
- `prompt-builder.test.ts` — base prompt from metafields; retry appends prominence text; new seed each retry
- `visualize.test.ts` — CORS headers present on all responses (including OPTIONS); multipart parsing; `PRODUCT_NOT_FOUND`; `GENERATION_FAILED` after 3 attempts; 45s timeout triggers failed attempt

**Frontend** (Vitest):
- Modal state transitions (upload → picker → loading → result)
- Picker skipped when product_id pre-supplied; shown when no product_id
- Product handle retained from State 2 — "Sipariş Ver" constructs correct URL
- Error state (State 5) on 502, 429, network failure, client validation failure
- "Tekrar Dene" returns to State 1
- "Kaydet" creates blob URL from binary response
- `X-Product-Title` header percent-decoded before display

**No E2E tests** — fal.ai calls are expensive and non-deterministic.

---

## 8. User Flow

1. Customer sees Reels ad → lands on `/pages/odanda-gor`
2. Reads 3-step explainer → taps "Hemen Dene"
3. Uploads room photo (gallery or camera)
4. Selects curtain from picker (product handle stored in modal state)
5. Sees loading screen (~10–45s depending on retries)
6. Sees generated room with curtain
7. Taps "Sipariş Ver" → navigates to `/{product_handle}` → Perde Tasarla configurator
8. Completes order

**From product page:**
Steps 1–4 replaced by tapping "Odanda Gör" on product page. Picker skipped (product pre-selected, handle known from page context).
