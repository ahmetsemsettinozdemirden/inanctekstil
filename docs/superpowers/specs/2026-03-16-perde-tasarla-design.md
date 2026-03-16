# Perde Tasarla - Design Specification

Custom curtain configurator for inanctekstil.store (Shopify), inspired by TAC.com.tr's "Aninda Perde" feature.

**Date:** 2026-03-16
**Status:** Ready for Review
**Competitor Analysis:** [docs/ecommerce/aninda-perde-feature-analysis.md](../../ecommerce/aninda-perde-feature-analysis.md)

---

## 1. Overview

A "Perde Tasarla" (Design Your Curtain) feature that lets customers configure custom curtains through a guided multi-step wizard on the product detail page, with a redesigned homepage serving as an educational hub with measurement guides, categories, and FAQ.

### Scope

- **Homepage redesign** -- hero, category cards, measurement guide videos, FAQ
- **Product configurator** -- step-by-step wizard replacing standard buy box on curtain PDPs
- **Backend pricing service** -- validates inputs, calculates price, creates Shopify Draft Orders
- **Navigation & branding** -- "Perde Tasarla" in main nav with accent styling

### Migration Note

This is a **from-scratch build for Shopify**, not a port of the existing WooCommerce `inanc-curtain-calculator` plugin. The WooCommerce plugin serves as reference for pricing formulas and business logic, but the architecture, UI, and integration are entirely new.

### Prerequisites

- Shopify collections must exist: `/collections/tul-perdeler`, `/collections/fon-perdeler`, `/collections/blackout-perdeler`
- Product metafields must be set (see Section 6.1)
- Pleat style photos provided by the user

### Out of Scope

- Shopify plan upgrade (stays on Basic)
- New product creation (works with existing 4 products)
- Custom measurement video production (uses TAC's YouTube videos initially)
- Mobile app

---

## 2. Architecture

```
┌──────────────────────────────────────────────────┐
│                  SHOPIFY STORE                    │
│                                                   │
│  ┌──────────────┐    ┌─────────────────────────┐  │
│  │  Homepage     │    │  Product Detail Page     │  │
│  │  (index.json) │    │  (Horizon theme +        │  │
│  │               │    │   custom JS/CSS)         │  │
│  │  - Hero       │    │                          │  │
│  │  - Categories │    │  ┌───────────────────┐   │  │
│  │  - Videos     │    │  │ Configurator UI   │   │  │
│  │  - FAQ        │    │  │ (Vanilla JS)      │   │  │
│  └──────────────┘    │  └─────────┬─────────┘   │  │
│                      └────────────┼──────────────┘  │
│                                   │                  │
└───────────────────────────────────┼──────────────────┘
                                    │
                     HTTPS POST /api/cart/add
                                    │
                     ┌──────────────▼──────────────┐
                     │   Hetzner Docker Container   │
                     │   (Bun + Hono)               │
                     │                              │
                     │  - Validates inputs          │
                     │  - Calculates price          │
                     │  - Creates Draft Order       │
                     │    via Shopify Admin API     │
                     │  - Returns checkout URL      │
                     └──────────────────────────────┘
                     perde-api.inanctekstil.store
                     (Traefik reverse proxy)
```

### Key Decisions

- **Vanilla JS** for configurator -- no framework needed for a 5-step form
- **Bun + Hono** backend -- lightweight, TypeScript, matches existing image-generator project
- **Draft Order API** for pricing -- only way to set custom prices on Shopify Basic plan
- **Hetzner hosting** for backend -- uses existing Docker + Traefik infrastructure
- **Line item properties** carry configuration data through to order fulfillment

### Known Limitations

- **One curtain per checkout** -- Draft Order constraint on Shopify Basic plan. Each "Sepete Ekle" redirects to checkout.
- **Upgrade path:** Shopify standard plan enables Cart Transform (Shopify Functions) for real multi-item cart with dynamic pricing. Frontend code stays the same -- only the backend endpoint changes.

---

## 3. Homepage Design

**URL:** `https://inanctekstil.store/` (replaces current homepage)

### Sections (top to bottom):

**1. Hero Section**
- Full-width lifestyle image background (reuse existing product photos)
- Title: "Perde Tasarla"
- Subtitle: "Pile secimi, olculer ve astar tipi gibi detaylari kisisellestirerek, mekaniniza uygun sik ve fonksiyonel perdeler olusturabilirsiniz."
- Three CTA buttons: `Tul Perdeler`, `Fon Perdeler`, `Blackout Perdeler` linking to respective collections

**2. Category Cards Section**
- Three cards side by side (stacks on mobile)
- Each card: collection image + title + short description + "Incele" button
- Links to `/collections/tul-perdeler`, `/collections/fon-perdeler`, `/collections/blackout-perdeler`
- Saten not shown (offered as lining add-on in Fon configurator)

**3. "Perde Olcusu Nasil Alinir?" Section**
- Section title + intro text
- Three YouTube embeds (stacks on mobile):
  - Kalorifer Ustu: `https://www.youtube.com/watch?v=k8r_DUzKrlI`
  - Cam Hizasinda: `https://www.youtube.com/watch?v=1BR3onEeMxk`
  - Yere Kadar Uzanan: `https://www.youtube.com/watch?v=2yQDL8eXHc8`
- Each with title and 1-line description below

**4. FAQ Accordion**
- "Sikca Sorulan Sorular" heading
- Questions:
  - Olculeri nasil almam gerekiyor?
  - Ozel dikilen perdeler iade edilebilir mi?
  - Siparisim ne kadar surede hazirlaniyor?
  - Kargo ucreti ne kadar?
  - Yikama ve bakim talimatlariniz nelerdir?
  - Taksit secenekleriniz nelerdir?

### Navigation Change:
- Add "Perde Tasarla" link to main nav with accent color styling

---

## 4. Product Configurator

### 4.1 Which Products Get the Configurator

| Product | Type | Configurator | Steps |
|---|---|---|---|
| TUL-001 | TUL | Yes | Olcu, Pile Stili (2 steps) |
| FON-001 | FON | Yes | Olcu, Pile Stili, Kanat, Astar (4 steps) |
| BLK-001 | BLACKOUT | Yes | Olcu, Pile Stili, Kanat (3 steps) |
| STN-001 | STN | No | Standard Shopify buy box |

STN-001 serves a **dual role**: it has its own product page with a standard buy box (for standalone saten fabric purchases), and it is also added as a separate 150 TL line item when a customer selects saten lining in the Fon configurator. The 150 TL lining price is a flat rate regardless of curtain dimensions.

The configurator **replaces** the standard quantity + add-to-cart buy box. Product images stay on the left (Horizon default).

### 4.2 Configurator Layout

```
┌─────────────────────────────────────┐
│ HAVUZ BLACKOUT Perde - BAMBU        │
│ Baslangic fiyati: 399 TL/metre     │
│                                     │
│ "Perdenizi 3 adimda                 │
│  tasarlayabilirsiniz."              │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ● 1  Olcu Secimi          →    │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ○ 2  Pile Stili Secimi    →    │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ○ 3  Kanat Secimi         →    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Toplam: --- TL                  │ │
│ │ (detaylari secince hesaplanir)  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ☐ Bu perde ozel dikileceği icin...  │
│                                     │
│ [       Sepete Ekle (disabled)    ] │
└─────────────────────────────────────┘
```

Steps expand **inline** when clicked (not slide-out drawers). Completed steps collapse and show a summary (e.g., "Olcu Secimi: 200 x 250").

### 4.3 Step Details

#### Step 1: Olcu Secimi (All curtain types)

**Inputs:**
- `En (cm)` -- width, min 50 cm, no max
- `Boy (cm)` -- height, min 50 cm, max from product metafield

> **Note:** Height is collected for **validation** (must not exceed product's max height / fabric width) and **fulfillment display** on the order. It does not affect pricing. All pricing formulas are based on width and pleat ratio only, since fabric is sold in bolts of a fixed width (the `fabric_width` metafield) and height determines whether the curtain fits within the bolt width.

**Visual aids:**
- SVG measurement diagram showing window with "en" and "boy" labeled
- Three measurement guide links (open in modal or new tab):
  - Cam hizasinda perde olcusu
  - Yere kadar uzanan perde olcusu
  - Kalorifer ustu perde olcusu

**Summary:** "Olcu Secimi: 300 x 250"

#### Step 2: Pile Stili Secimi (All curtain types)

**Options:** Three visual cards with photos (provided by user)

| Option | Ratio | Display Name |
|---|---|---|
| Card 1 | 1:2 | Duz Pile |
| Card 2 | 1:2.5 | Klasik Pile |
| Card 3 | 1:3 | Sik Pile |

Each card shows a photo of the pleat style with the name below.

**Summary:** "Pile Stili: Klasik Pile (1:2.5)"

#### Step 3: Kanat Secimi (FON and BLACKOUT only)

**Options:** Two cards with illustrations (SVG)

| Option | Value | Description |
|---|---|---|
| Tek Kanat | 1 | "Girilen olculer icin tek kanat (1 adet) perde siparis verdiginiz anlamina gelir." |
| Cift Kanat | 2 | "Girilen olculer icin cift kanat (2 adet) ayni olcude perde siparis verdiginiz anlamina gelir." |

**Summary:** "Kanat Secimi: Cift Kanat"

#### Step 4: Astar Secimi (FON only)

**Options:** Two cards

| Option | Value | Description |
|---|---|---|
| Astarsiz | false | "Ek ucret yok" |
| Saten Astar | true | "+150 TL" |

**Summary:** "Astar Secimi: Saten Astar (+150 TL)"

### 4.4 Live Price Display

Price updates on the frontend after each step. Shown as a breakdown:

**TUL example** (300cm width, 1:2.5 ratio):
```
Toplam: 1,605.00 TL
├─ Kumas: 7.5m x 189 TL/m = 1,417.50 TL
└─ Dikim: 7.5m x 25 TL/m = 187.50 TL
```

**FON example** (200cm width, 1:3 ratio, 2 panels, saten lining):
```
Toplam: 4,238.00 TL
├─ Kumas: 12m x 299 TL/m = 3,588.00 TL
├─ Dikim: 500.00 TL
└─ Saten Astar: 150.00 TL
```

Frontend calculation is for display only. Server-side calculation is authoritative.

### 4.5 Terms & Conditions

Required checkbox before "Sepete Ekle" enables:

> "Bu perde ozel olarak dikilecegi icin iade edilemez. Olculerinizi kontrol ettiginizi onayliyorum."

### 4.6 Validation Rules

- Width: min 50 cm
- Height: min 50 cm, max from product metafield (`curtain.max_height`)
- All steps must be completed
- Terms checkbox must be checked
- "Devam Et" disabled with inline error for invalid inputs

### 4.7 Edge Cases

- **Changing a previous step:** Re-expands it, resets subsequent steps, price recalculates
- **Backend error:** User-friendly message "Bir hata olustu, lutfen tekrar deneyin" with retry button
- **Multiple curtains:** One curtain per checkout (Draft Order limitation)

---

## 5. Backend Pricing Service

### 5.1 Endpoint

`POST https://perde-api.inanctekstil.store/api/cart/add`

### 5.2 Security & Configuration

- **CORS:** Allow only `https://inanctekstil.store` origin
- **Rate limiting:** 10 requests per minute per IP (prevents abuse of Draft Order creation)
- **Shopify API scopes required:** `write_draft_orders`, `read_products`
- **Environment variables:** `SHOPIFY_ACCESS_TOKEN`, `SHOPIFY_STORE_DOMAIN`

### 5.3 Request

```json
{
  "shop": "inanctekstil.store",
  "product_id": "gid://shopify/Product/15726200684625",
  "variant_id": "gid://shopify/ProductVariant/59200390725713",
  "configuration": {
    "width_cm": 200,
    "height_cm": 250,
    "pleat_ratio": 2.5,
    "panels": 1,
    "lining": false
  }
}
```

### 5.4 Processing

1. **Validate inputs** -- width/height ranges (integers, min 50 cm), pleat ratio in [2, 2.5, 3], panels in [1, 2] (default 1 for TUL), lining is boolean (default false)
2. **Look up product config** -- price per meter, product type, max height, sewing costs
3. **Calculate price:**
   ```
   TUL:
     meters = (width_cm / 100) * pleat_ratio
     fabric_cost = meters * price_per_meter
     sewing_cost = meters * 25
     total = fabric_cost + sewing_cost

   FON / BLACKOUT:
     meters = (width_cm / 100) * pleat_ratio * panels
     fabric_cost = meters * price_per_meter
     sewing_cost = 500
     total = fabric_cost + sewing_cost
   ```
4. **Create Draft Order** via Shopify Admin API:
   - Line item 1: Product variant with calculated price + line item properties
   - Line item 2 (if lining): STN-001 variant at 150 TL
5. **Complete Draft Order** → get invoice/checkout URL
6. **Return checkout URL** to frontend

### 5.5 Success Response

```json
{
  "success": true,
  "checkout_url": "https://inanctekstil.myshopify.com/...",
  "price_summary": {
    "fabric_meters": 7.5,
    "fabric_cost": 1417.50,
    "sewing_cost": 187.50,
    "lining_cost": 0,
    "total": 1605.00
  }
}
```

### 5.6 Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "En degeri en az 50 cm olmalidir."
  }
}
```

Error codes: `VALIDATION_ERROR`, `PRODUCT_NOT_FOUND`, `SHOPIFY_API_ERROR`, `RATE_LIMITED`

HTTP status codes: 400 (validation), 404 (product), 429 (rate limit), 502 (Shopify API failure)

### 5.7 Line Item Properties (on Draft Order)

Visible in Shopify admin for fulfillment:

**TUL example** (no Kanat/Astar fields):
```
En: 300 cm
Boy: 250 cm
Pile: Klasik Pile (1:2.5)
Kumas Metraj: 7.5 m
Kumas Tutari: 1,417.50 TL
Dikim Tutari: 187.50 TL
```

**FON example** (with Kanat and Astar):
```
En: 200 cm
Boy: 280 cm
Pile: Sik Pile (1:3)
Kanat: Cift Kanat
Kumas Metraj: 12 m
Kumas Tutari: 3,588.00 TL
Dikim Tutari: 500.00 TL
Astar: Saten Astar (+150 TL)
```

---

## 6. Data Model

### 6.1 Shopify Product Metafields

| Namespace.Key | Type | Description |
|---|---|---|
| `curtain.type` | `single_line_text` | `TUL`, `FON`, `BLACKOUT`, `STN` |
| `curtain.price_per_meter` | `number_decimal` | e.g., `189.00` |
| `curtain.max_height` | `number_integer` | e.g., `290` |
| `curtain.fabric_width` | `number_integer` | e.g., `290` |
| `curtain.has_lining` | `boolean` | `true` for FON only |
| `curtain.has_panel_choice` | `boolean` | `true` for FON, BLACKOUT |

### 6.2 Product Configuration

| Product | Type | Price/m | Max Height | Panel Choice | Lining |
|---|---|---|---|---|---|
| TUL-001 | TUL | 189 TL | 290 cm | No | No |
| FON-001 | FON | 299 TL | 300 cm | Yes | Yes |
| BLK-001 | BLACKOUT | 399 TL | 295 cm | Yes | No |
| STN-001 | STN | 249 TL | -- | -- | -- |

### 6.3 Sewing Costs (hardcoded in backend)

```
TUL_SEWING_PER_METER = 25       // TL per meter
FON_SEWING_FIXED = 500          // TL per order
BLACKOUT_SEWING_FIXED = 500     // TL per order
SATEN_LINING_FIXED = 150        // TL flat (separate line item)
```

---

## 7. File Structure

### Frontend (Shopify Theme)

```
theme/
├── templates/
│   └── index.json                     # Homepage (Perde Tasarla)
├── sections/
│   ├── perde-hero.liquid              # Hero with CTAs
│   ├── perde-categories.liquid        # Category cards
│   ├── perde-measurement-guide.liquid # YouTube embeds
│   └── perde-faq.liquid               # FAQ accordion
├── snippets/
│   └── curtain-configurator.liquid    # Configurator markup
└── assets/
    ├── curtain-configurator.js        # Configurator logic (vanilla JS)
    ├── curtain-configurator.css       # Scoped styles
    ├── measurement-diagram.svg        # Width/height diagram
    ├── pleat-1-2.jpg                  # Pleat photos (user provides)
    ├── pleat-1-2.5.jpg
    ├── pleat-1-3.jpg
    ├── panel-single.svg               # Tek kanat illustration
    └── panel-double.svg               # Cift kanat illustration
```

### Backend (Hetzner)

```
perde-api/
├── Dockerfile
├── package.json
├── src/
│   ├── index.ts                       # Hono server entry
│   ├── routes/
│   │   └── cart.ts                    # POST /api/cart/add
│   ├── lib/
│   │   ├── calculator.ts             # Price calculation logic
│   │   ├── shopify.ts                # Shopify Admin API client
│   │   └── validator.ts              # Input validation
│   └── config/
│       └── products.ts               # Product config, prices, costs
└── tests/
    ├── calculator.test.ts
    └── cart.test.ts
```

### Infrastructure

- Docker container added to existing `docker-compose.yml` on Hetzner
- Traefik routes `perde-api.inanctekstil.store` to the container
- DNS A record added via `gitopsprod/dns.tf`

---

## 8. User Flows

### Flow 1: Customer orders a Tul curtain

1. Lands on homepage → sees hero, categories, measurement videos
2. Watches measurement video, learns how to measure
3. Clicks "Tul Perdeler" → `/collections/tul-perdeler`
4. Clicks TUL-001 → product page with configurator
5. Step 1: Enters 300 x 250 cm → "Devam Et"
6. Step 2: Selects "Klasik Pile (1:2.5)" → "Devam Et"
7. Sees price: Toplam 1,605.00 TL (fabric 1,417.50 + sewing 187.50)
8. Checks terms → clicks "Sepete Ekle"
9. Backend creates Draft Order → redirects to checkout
10. Completes payment → order with full specs visible in admin

### Flow 2: Customer orders Fon + Saten lining

1-4. Same but selects FON-001 (4 steps shown)
5. Step 1: Enters 200 x 280 cm
6. Step 2: Selects "Sik Pile (1:3)"
7. Step 3: Selects "Cift Kanat"
8. Step 4: Selects "Saten Astar (+150 TL)"
9. Sees price: Toplam 4,238.00 TL
   - Kumas: 12m x 299 TL = 3,588 TL
   - Dikim: 500 TL
   - Saten Astar: 150 TL (separate line item)
10. Checks terms → "Sepete Ekle"
11. Draft Order with 2 line items → checkout → payment

### Order in Shopify Admin:

```
Order #1001
──────────────────────────────────────
SUET Fon Perde - 9006          4,088.00 TL
  En: 200 cm
  Boy: 280 cm
  Pile: Sik Pile (1:3)
  Kanat: Cift Kanat
  Kumas Metraj: 12 m
  Kumas Tutari: 3,588.00 TL
  Dikim Tutari: 500.00 TL

Saten Astar - BEYAZ              150.00 TL
──────────────────────────────────────
Toplam:                        4,238.00 TL
```
