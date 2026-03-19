# PMS — Product Management System Design

> Local web dashboard for managing İnanç Tekstil's curtain product catalog,
> AI image generation, and Shopify synchronisation.

---

## 1. Problem Statement

The store currently has two disconnected CLI tools:

| Tool | Location | Purpose |
|------|----------|---------|
| Image generator | `ecommerce/pdp-image-generator/` | BAML + fal.ai lifestyle/texture image pipeline |
| Catalog script | `ecommerce/products/scripts/` | CSV → `catalog.json` rebuild |

There is no unified view of product status, no way to trigger image generation from a UI, and no GUI for Shopify operations. The PMS consolidates these into a single local web dashboard backed by PostgreSQL.

---

## 2. Goals

- **Product dashboard** — view all 14 designs with swatch images, image generation status, and Shopify sync status
- **Image generation** — trigger AI lifestyle/texture generation per SKU, watch live job progress
- **Shopify sync** — create/update products, upload images, manage metafields, read live state
- **Absorb existing tools** — pdp-image-generator pipeline and catalog scripts become internal libraries; their CLI wrappers continue working unchanged

---

## 3. Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Runtime | **Bun** | Consistent with existing tools |
| Backend | **Hono** | Lightweight, TypeScript-native, zero-config on Bun |
| Frontend | **Vite + React + TypeScript** | 3 pages only; no SSR needed; plain CSS |
| Database | **PostgreSQL 16** | Persistent job queue, relational product data |
| ORM | **Drizzle** | TypeScript-native, Bun-compatible, migration support |
| PG driver | **`postgres`** (porsager) | Bun-native SQL template literals |
| Job queue | **PostgreSQL + LISTEN/NOTIFY** | No Redis; persistent across restarts; SSE bridge |
| Live updates | **Server-Sent Events** | One-directional job updates, simpler than WebSockets |
| Logging | **Pino** | Structured JSON; `pino-pretty` in dev |
| Testing | **Vitest** | Unit + integration; test DB via Docker Compose |
| Shopify | **Admin GraphQL API** (direct `fetch`) | No heavy SDK needed |
| Infra | **Docker Compose** | Postgres + PMS service |

---

## 4. Directory Structure

```
ecommerce/pms/
├── package.json
├── tsconfig.json
├── .env.example
├── docker-compose.yml           # postgres + pms
├── docker-compose.test.yml      # isolated test DB (port 5433)
├── Dockerfile
│
├── src/
│   ├── server.ts                # Hono app entry — mounts routers, error handler, logger middleware
│   │
│   ├── routes/
│   │   ├── catalog.ts           # GET /api/catalog, GET /api/catalog/:id, PATCH /api/catalog/:id
│   │   ├── images.ts            # POST /api/images/generate, GET /api/images/:sku
│   │   ├── shopify.ts           # POST /api/shopify/sync/:id, metafields, upload-images
│   │   └── jobs.ts              # GET /api/jobs, DELETE /api/jobs/:id, GET /api/jobs/stream (SSE)
│   │
│   ├── db/
│   │   ├── client.ts            # postgres() connection pool singleton
│   │   ├── schema.ts            # Drizzle table definitions (see §6)
│   │   ├── migrations/          # Generated SQL migration files (drizzle-kit)
│   │   └── seed.ts              # Reads catalog.json → inserts to DB on first boot
│   │
│   ├── lib/
│   │   ├── catalog.ts           # DB-backed CRUD: getDesigns, getDesign, updateDesign
│   │   ├── shopify-client.ts    # ShopifyClient class (see §8)
│   │   ├── job-queue.ts         # enqueue(), worker loop, SSE emitter (see §9)
│   │   ├── image-paths.ts       # Resolve swatch paths and generated image paths
│   │   ├── logger.ts            # Pino singleton export
│   │   └── env.ts               # Parse + validate all env vars; fail fast on missing keys
│   │
│   ├── errors/
│   │   ├── base.ts              # AppError(message, code, statusCode, meta?)
│   │   ├── catalog.ts           # DesignNotFoundError, VariantNotFoundError
│   │   ├── shopify.ts           # ShopifyApiError, ShopifyRateLimitError
│   │   └── jobs.ts              # JobNotFoundError, JobAlreadyRunningError
│   │
│   ├── jobs/
│   │   ├── generate-lifestyle.ts  # Calls image-engine pipeline, appends to job.log
│   │   ├── generate-texture.ts
│   │   ├── shopify-sync.ts        # Create/update Shopify product + variants → write GIDs to DB
│   │   └── shopify-image-upload.ts # Staged upload (presigned URL) → productCreateMedia
│   │
│   └── image-engine/            # Symlinks into pdp-image-generator/src/
│       ├── generate.ts          # → ../../pdp-image-generator/src/generate.ts
│       ├── baml_src/            # → ../../pdp-image-generator/src/baml_src
│       ├── baml_client/         # → ../../pdp-image-generator/src/baml_client (gitignored)
│       └── lib/                 # → ../../pdp-image-generator/src/lib
│
├── frontend/
│   ├── index.html
│   ├── vite.config.ts           # dev proxy: /api → :3000, /assets → :3000
│   └── src/
│       ├── main.tsx             # React entry, hash router
│       ├── pages/
│       │   ├── ProductGrid.tsx  # All designs as cards; filter by type/status
│       │   ├── ProductDetail.tsx # Variants table, image gallery, Shopify sync panel
│       │   └── Jobs.tsx         # Live job list via SSE
│       ├── components/
│       │   ├── DesignCard.tsx   # Swatch thumbnail + badges + "Generate" button
│       │   ├── ImageGallery.tsx # Lifestyle/texture images per SKU
│       │   ├── JobRow.tsx       # Status badge + live log accordion
│       │   └── StatusBadge.tsx  # ACTIVE / DRAFT / MISSING
│       └── lib/
│           ├── api.ts           # Typed fetch wrappers for all REST endpoints
│           └── sse.ts           # SSE client — reconnects on drop
│
└── tests/
    ├── unit/
    │   ├── catalog.test.ts
    │   ├── shopify-client.test.ts
    │   ├── job-queue.test.ts
    │   ├── image-paths.test.ts
    │   └── errors.test.ts
    └── integration/
        ├── setup.ts             # beforeAll: run migrations + seed 2 designs; afterAll: drop DB
        ├── catalog.integration.ts
        ├── jobs.integration.ts
        └── shopify.integration.ts
```

---

## 5. Product Data: Migration from catalog.json

`catalog.json` is the current source of truth. On **first boot**, `src/db/seed.ts` reads it and populates PostgreSQL. After seeding, **PostgreSQL is the source of truth**. The original `catalog.json` and `products.csv` are retained as human-readable backups and for the existing CLI.

Migration mapping:

| catalog.json field | PostgreSQL table / column |
|--------------------|--------------------------|
| `designs[].id` | `designs.id` |
| `designs[].curtain_type` | `designs.curtain_type` |
| `designs[].design` | `designs.design_name` |
| `designs[].width_cm` | `designs.width_cm` |
| `designs[].price` | `designs.price` |
| `designs[].composition` | `designs.composition` |
| `designs[].fabric.*` | `designs.fabric_*` columns |
| `designs[].shopify.*` | `shopify_products` table (1:1) |
| `designs[].variants[].sku` | `variants.sku` |
| `designs[].variants[].colour` | `variants.colour` |
| `designs[].variants[].finish` | `variants.finish` |
| `designs[].variants[].swatch` | `variants.swatch_path` |
| `designs[].variants[].shopify.*` | `variants.shopify_variant_id`, `shopify_status` |

---

## 6. Database Schema

```typescript
// src/db/schema.ts (Drizzle)

export const designs = pgTable("designs", {
  id:                   text("id").primaryKey(),
  curtainType:          text("curtain_type").notNull(),
  designName:           text("design_name").notNull(),
  widthCm:              integer("width_cm").notNull(),
  price:                integer("price").notNull(),
  composition:          text("composition"),
  fabricMaterial:       text("fabric_material"),
  fabricTransparency:   text("fabric_transparency"),
  fabricTexture:        text("fabric_texture"),
  fabricWeight:         text("fabric_weight"),
  fabricPattern:        text("fabric_pattern"),
  createdAt:            timestamp("created_at").defaultNow(),
  updatedAt:            timestamp("updated_at").defaultNow(),
});

export const shopifyProducts = pgTable("shopify_products", {
  designId:    text("design_id").primaryKey().references(() => designs.id),
  productId:   text("product_id"),           // Shopify GID, null until synced
  handle:      text("handle"),
  productType: text("product_type"),
  status:      text("status").default("DRAFT"),
  options:     jsonb("options").default(["Renk"]),
  syncedAt:    timestamp("synced_at"),
});

export const variants = pgTable("variants", {
  sku:               text("sku").primaryKey(),
  designId:          text("design_id").notNull().references(() => designs.id),
  colour:            text("colour").notNull(),
  finish:            text("finish"),
  swatchPath:        text("swatch_path"),
  shopifyVariantId:  text("shopify_variant_id"),
  shopifyStatus:     text("shopify_status").default("DRAFT"),
  createdAt:         timestamp("created_at").defaultNow(),
});

export const generatedImages = pgTable("generated_images", {
  id:               serial("id").primaryKey(),
  sku:              text("sku").notNull().references(() => variants.sku),
  imageType:        text("image_type").notNull(),   // "lifestyle" | "texture"
  roomId:           text("room_id"),
  filePath:         text("file_path").notNull(),
  shopifyMediaId:   text("shopify_media_id"),
  evaluationScore:  integer("evaluation_score"),    // 1-10 from BAML evaluate
  createdAt:        timestamp("created_at").defaultNow(),
});

export const jobs = pgTable("jobs", {
  id:        text("id").primaryKey(),
  type:      text("type").notNull(),
  params:    jsonb("params").notNull(),
  status:    text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  startedAt: timestamp("started_at"),
  endedAt:   timestamp("ended_at"),
  error:     text("error"),
  result:    jsonb("result"),
  log:       text("log").array().default([]),
});
```

---

## 7. Logging

```typescript
// src/lib/logger.ts
import pino from "pino";
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport: process.env.NODE_ENV === "development"
    ? { target: "pino-pretty" }
    : undefined,
});
```

Log levels:

| Level | Usage |
|-------|-------|
| `debug` | Shopify GraphQL request/response bodies, DB queries |
| `info` | Job started/completed, routes mounted, server started |
| `warn` | Recoverable errors (retry, rate limit, validation failure) |
| `error` | Unhandled errors, job failures, DB connection failures |

All route handlers receive a `logger.child({ route })` context. Job handlers receive a `logger.child({ jobId, type })` context.

---

## 8. Error Handling

```typescript
// errors/base.ts
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly meta?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// errors/catalog.ts
export class DesignNotFoundError extends AppError {
  constructor(id: string) {
    super(`Design not found: ${id}`, "DESIGN_NOT_FOUND", 404, { id });
  }
}
export class VariantNotFoundError extends AppError {
  constructor(sku: string) {
    super(`Variant not found: ${sku}`, "VARIANT_NOT_FOUND", 404, { sku });
  }
}

// errors/shopify.ts
export class ShopifyApiError extends AppError {
  constructor(message: string, errors: unknown[]) {
    super(message, "SHOPIFY_API_ERROR", 502, { errors });
  }
}
export class ShopifyRateLimitError extends AppError {
  constructor(retryAfter: number) {
    super("Shopify rate limit hit", "SHOPIFY_RATE_LIMIT", 429, { retryAfter });
  }
}

// errors/jobs.ts
export class JobNotFoundError extends AppError {
  constructor(id: string) {
    super(`Job not found: ${id}`, "JOB_NOT_FOUND", 404, { id });
  }
}
export class JobAlreadyRunningError extends AppError {
  constructor(id: string) {
    super(`Job ${id} is already running`, "JOB_ALREADY_RUNNING", 409, { id });
  }
}
```

Global Hono error handler in `src/server.ts`:

```typescript
app.onError((err, c) => {
  if (err instanceof AppError) {
    logger.warn({ err, code: err.code }, err.message);
    return c.json({ error: err.code, message: err.message, meta: err.meta }, err.statusCode);
  }
  logger.error({ err }, "Unhandled error");
  return c.json({ error: "INTERNAL_ERROR", message: "Internal server error" }, 500);
});
```

---

## 9. Job Queue

PostgreSQL-backed, no external queue service required.

**Flow:**

```
Client          API             DB               Worker
  |               |               |                 |
  |--POST /jobs-->|               |                 |
  |               |--INSERT job-->|                 |
  |               |--NOTIFY------>|                 |
  |<---{ jobId }--|               |                 |
  |               |               |<--LISTEN--------|
  |               |               |--NOTIFY-------->|
  |               |               |<--SELECT+LOCK---|
  |               |               |--UPDATE running>|
  |               |               |     [execute]   |
  |               |               |<--UPDATE log----|  (per step)
  |               |               |<--NOTIFY------->|  (per step)
  |               |               |<--UPDATE done---|
  |               |               |<--NOTIFY------->|
```

**SSE bridge:**

```
GET /api/jobs/stream
  → Opens dedicated pg connection
  → LISTEN job_update
  → On NOTIFY(jobId): SELECT job, stream as data: {json}\n\n
  → On client disconnect: UNLISTEN, release connection
```

**Concurrency:** max 2 jobs running simultaneously. Worker checks `(SELECT COUNT(*) FROM jobs WHERE status = 'running') < 2` before claiming next pending job. Uses `FOR UPDATE SKIP LOCKED` for safe concurrent workers.

**Cancellation:** `DELETE /api/jobs/:id` sets `status = 'cancelled'` only if `status = 'pending'`. Returns 409 if running.

---

## 10. Shopify Client

```typescript
// src/lib/shopify-client.ts
export class ShopifyClient {
  private readonly endpoint: string;
  private readonly headers: Record<string, string>;

  constructor(storeDomain: string, accessToken: string) {
    this.endpoint = `https://${storeDomain}/admin/api/2025-01/graphql.json`;
    this.headers = {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    };
  }

  // Reads
  getProduct(productId: string): Promise<ShopifyProduct>
  getMetafields(ownerId: string, namespace: string): Promise<Metafield[]>

  // Product writes
  createProduct(input: ProductInput): Promise<ShopifyProduct>
  updateProduct(productId: string, input: Partial<ProductInput>): Promise<ShopifyProduct>

  // Variant writes
  createVariants(productId: string, variants: VariantInput[]): Promise<ShopifyVariant[]>
  updateVariant(variantId: string, input: Partial<VariantInput>): Promise<ShopifyVariant>

  // Media (staged upload flow: presigned URL → binary upload → productCreateMedia)
  uploadProductMedia(productId: string, files: MediaInput[]): Promise<ShopifyMedia[]>

  // Metafields
  setMetafields(ownerId: string, metafields: MetafieldInput[]): Promise<void>

  // Collections
  addProductToCollection(collectionId: string, productId: string): Promise<void>

  // Internal: handles 429 with exponential backoff (max 3 retries)
  private gql<T>(query: string, variables?: object): Promise<T>
}
```

Metafields managed:

| Key | Type | Usage |
|-----|------|-------|
| `custom.fiyat_metre` | `number_integer` | Price per metre (TL) for calculator |
| `custom.pile_oranlari` | `single_line_text_field` | Pile ratios e.g. "1:2,1:2.5,1:3" |
| `custom.kumas_tipi` | `single_line_text_field` | Fabric type: tul / fon / blackout |
| `custom.dikis_maliyeti` | `number_integer` | Sewing cost per metre (TL) |

---

## 11. API Reference

```
# Catalog
GET    /api/catalog                    → DesignWithShopify[]
GET    /api/catalog/:designId          → DesignWithShopify
PATCH  /api/catalog/:designId          → { price?, composition?, fabric? } → DesignWithShopify

# Images
POST   /api/images/generate            → { sku, flow: "lifestyle"|"texture"|"all", room? } → { jobId }
GET    /api/images/:sku                → { lifestyle: GeneratedImage[], texture: GeneratedImage|null }

# Static assets
GET    /assets/swatches/:type/:file    → binary (swatch JPEG)
GET    /assets/generated/:type/:sku/* → binary (generated WebP)

# Shopify
GET    /api/shopify/status             → { designs: { id, productId, status, variantCount }[] }
POST   /api/shopify/sync/:designId     → { createIfMissing?: boolean } → { jobId }
POST   /api/shopify/upload-images/:sku → { } → { jobId }
GET    /api/shopify/metafields/:pid    → Metafield[]
POST   /api/shopify/metafields/:pid    → MetafieldInput[] → { updated: number }

# Jobs
GET    /api/jobs                       → Job[]  (last 100, newest first)
GET    /api/jobs/:id                   → Job
DELETE /api/jobs/:id                   → 200 | 409 (if running)
GET    /api/jobs/stream                → SSE stream of job_update events
```

---

## 12. Docker Compose

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: pms
      POSTGRES_USER: pms
      POSTGRES_PASSWORD: pms
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "pms"]
      interval: 5s
      retries: 5

  pms:
    build: .
    ports: ["3000:3000"]
    env_file: .env
    environment:
      DATABASE_URL: postgres://pms:pms@postgres:5432/pms
      SHOPIFY_STORE_DOMAIN: 1z7hb1-2d.myshopify.com
      NODE_ENV: production
    depends_on:
      postgres: { condition: service_healthy }
    volumes:
      - ../../products:/app/products:ro

volumes:
  postgres_data:
```

```yaml
# docker-compose.test.yml
services:
  postgres-test:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: pms_test
      POSTGRES_USER: pms
      POSTGRES_PASSWORD: pms
    ports: ["5433:5432"]
```

---

## 13. Testing Strategy

### Unit Tests (`tests/unit/`, no DB)

| File | Covers |
|------|--------|
| `catalog.test.ts` | `findDesign`, `updateDesign`, `designToShopifyInput` — pure functions |
| `shopify-client.test.ts` | `createProduct`, `setMetafields` — mock `fetch`, test error handling + retry |
| `job-queue.test.ts` | Enqueue, status transitions, concurrency limit |
| `image-paths.test.ts` | Swatch path resolution, generated image discovery |
| `errors.test.ts` | Error class hierarchy, HTTP status codes, meta fields |

```bash
bun test tests/unit/
```

### Integration Tests (`tests/integration/`, real DB on port 5433)

| File | Covers |
|------|--------|
| `setup.ts` | `beforeAll`: migrations + seed 2 designs; `afterAll`: drop tables |
| `catalog.integration.ts` | `GET /api/catalog`, `PATCH /api/catalog/:id` with real Postgres |
| `jobs.integration.ts` | Full job lifecycle (mocked executor) → DB state verification |
| `shopify.integration.ts` | Full sync job (mocked Shopify HTTP) → variant IDs written to DB |

```bash
docker compose -f docker-compose.test.yml up -d
bun test tests/integration/
docker compose -f docker-compose.test.yml down
```

---

## 14. Image Engine Integration

The existing `pdp-image-generator` CLI is **not modified**. The PMS imports its source via symlinks:

```
pms/src/image-engine/generate.ts  → ln -s ../../pdp-image-generator/src/generate.ts
pms/src/image-engine/lib/         → ln -s ../../pdp-image-generator/src/lib
pms/src/image-engine/baml_src/    → ln -s ../../pdp-image-generator/src/baml_src
pms/src/image-engine/baml_client/ → ln -s ../../pdp-image-generator/src/baml_client
```

PMS job handlers call the exported pipeline functions and forward progress to `job.log`:

```typescript
// jobs/generate-lifestyle.ts
import { runLifestyle } from "../image-engine/generate";

export async function executeLifestyleJob(params: JobParams, log: (line: string) => void) {
  return runLifestyle(params.sku, params.room ?? "all", log);
}
```

The `generate.ts` pipeline functions need to accept an optional `Logger` callback — a minimal, backward-compatible change to the existing file.

---

## 15. Implementation Phases

| Phase | Goal | Acceptance |
|-------|------|-----------|
| **1 — Foundation** | Server boots, catalog loads from DB | `curl /api/catalog` → 14 designs |
| **2 — Product Grid** | Visual dashboard in browser | 14 cards with swatch thumbnails |
| **3 — Image Jobs** | Trigger generation, watch live progress | Job streams log lines, image appears |
| **4 — Shopify Sync** | Create/update Shopify products | Unsynced design gets GID in DB |
| **5 — Image Upload** | Push generated images to Shopify | WebP visible in Shopify product media |
| **6 — Polish** | Inline editing, bulk actions, CSV import | End-to-end day-to-day workflow |

---

## 16. Prerequisites

Before starting Phase 1:

- [ ] Create Shopify private app at `https://1z7hb1-2d.myshopify.com/admin/apps/development`
  - Scopes needed: `read_products`, `write_products`, `read_product_listings`, `write_files`
  - Copy the Admin API access token → `SHOPIFY_ACCESS_TOKEN`
- [ ] Docker Desktop running (for Postgres)
- [ ] Copy env vars from `pdp-image-generator/.env` → `pms/.env` (`FAL_KEY`, `AWS_*`)

---

## 17. Environment Variables

```bash
# pms/.env.example

# Database
DATABASE_URL=postgres://pms:pms@localhost:5432/pms

# Shopify
SHOPIFY_STORE_DOMAIN=1z7hb1-2d.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_...

# Image generation (from pdp-image-generator)
FAL_KEY=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1

# App
PORT=3000
LOG_LEVEL=info   # debug | info | warn | error
NODE_ENV=development
```

---

## 18. Key Files Referenced

| File | Role |
|------|------|
| `ecommerce/products/catalog.json` | Seed source for first-boot DB population |
| `pdp-image-generator/src/generate.ts` | Image pipeline — exported functions used by job handlers |
| `pdp-image-generator/src/lib/helpers.ts` | `CatalogDesign` type definitions — must stay compatible |
| `pdp-image-generator/src/lib/fal-client.ts` | fal.ai upload/generate/download (used as-is via symlink) |
| `products/scripts/generate-catalog.ts` | CSV parse/merge logic — absorbed into `src/lib/catalog.ts` |
