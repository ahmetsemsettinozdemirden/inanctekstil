# Product Catalog

Single source of truth for İnanç Tekstil's product catalog. All Shopify setup, image generation, and future tooling reads from `catalog.json`.

---

## Files

| File | Edit? | Purpose |
|---|---|---|
| `products.csv` | **Yes** | Raw product data — the only file you edit by hand |
| `catalog.json` | **Generated** | Single source of truth — do not edit by hand |
| `scripts/generate-catalog.ts` | No | Script that builds `catalog.json` from `products.csv` |
| `01-cropped-katalog-images/` | Add files | Swatch photos, one per SKU |
| `poli-life-fiyat-listesi.md` | No | Supplier price reference (informational only) |

---

## Workflow

### Adding or updating products

1. Edit `products.csv` — add rows or change price/width/colour
2. Add the swatch image to `01-cropped-katalog-images/{TYPE}/{SKU}.JPG`
3. Run the script:

```bash
cd ecommerce/products
npx tsx scripts/generate-catalog.ts
```

The script is **idempotent** — re-running it updates structural fields (price, width, colour, finish, composition) while preserving:
- Shopify product and variant IDs
- Fabric descriptions (once filled in)
- `fabric` descriptions (once filled in)

### Dry run (preview without writing)

```bash
npx tsx scripts/generate-catalog.ts --dry-run
```

---

## products.csv format

```
SKU, Name (İsim), Design (Desen), Colour (Renk), Width (Genişlik), Composition (Bileşim), Price (Fiyat)
```

| Column | Required | Notes |
|---|---|---|
| SKU | Yes | Format: `{TYPE}-{NNN}` e.g. `FON-001`, `TUL-015`, `BLK-039` |
| Name | No | Finish variant: `KOYU`, `AÇIK`, `DESENLİ`, `DÜZ`, `MAT`, `PARLAK`. Empty for most. |
| Design | Yes | Design/fabric name: `HÜRREM`, `BORNOVA`, `SULTAN 22260`, etc. |
| Colour | Yes | Colour code or name: `427`, `BEYAZ`, `21-0369`, etc. |
| Width | Yes | Fabric width in cm: `300`, `310`, `320` |
| Composition | No | Material breakdown: `%80 PES-%20 CO`. Empty if unknown. |
| Price | Yes | Per-metre cut price in TL. Same for all colours of a design. |

**SKU prefix determines the curtain type:**
- `FON` → opaque curtain (fon perde)
- `TUL` → sheer curtain (tül perde)
- `BLK` → blackout curtain
- `STN` → satin curtain (saten perde)

**The Name column creates a second Shopify variant option (Görünüm).**
When any colour in a design has a Name value, Shopify will show two dropdowns: Renk + Görünüm.
Examples: SULTAN 22260 (KOYU/AÇIK), ŞÖNİL BLACKOUT (DESENLİ/DÜZ), LÜX BLACKOUT (MAT/PARLAK).

---

## catalog.json structure

```json
{
  "designs": [ ... ]   // array of design entries — one per Shopify product
}
```

`catalog.json` contains only product data. Rooms, banners, and collections are image generation concerns and live in `pms/assets/input/manifest.json`.

### Design entry

One design = one Shopify product. All colour/finish variants are Shopify variants of that product.

```json
{
  "id": "fon-hurrem",               // stable internal ID, derived from type + design slug
  "curtain_type": "FON",            // FON | TUL | BLACKOUT | STN
  "design": "HÜRREM",               // original design name from CSV
  "width_cm": 310,                  // fabric width
  "price": 350,                     // cut price in TL (all colours share same price)
  "composition": null,              // material composition e.g. "%80 PES-%20 CO", or null

  "fabric": {
    "material": "polyester",        // material for AI image generation
    "transparency": "opaque",       // opaque | sheer | blackout
    "texture": null,                // FILL IN: e.g. "smooth woven", "velvet", "fine mesh"
    "weight": "heavy",              // light | medium | heavy
    "pattern": null                 // pattern description or null if solid
  },

  "shopify": {
    "product_id": null,             // filled in after Shopify product is created
    "handle": "fon-hurrem",         // Shopify URL handle
    "product_type": "FON",          // SKU prefix used as Shopify product type
    "status": "ACTIVE",
    "options": ["Renk"]             // ["Renk"] or ["Renk", "Görünüm"]
  },

  "variants": [
    {
      "sku": "FON-001",
      "colour": "427",
      "finish": null,               // KOYU/AÇIK/DESENLİ/DÜZ/MAT/PARLAK or null
      "swatch": "01-cropped-katalog-images/FON/FON-001.JPG",
      "shopify": {
        "variant_id": null,         // filled in after Shopify variant is created
        "status": "ACTIVE"
      }
    }
  ]
}
```

### ID stability

Design `id` is derived as `{sku_prefix_lower}-{design_slug}`. Examples:
- `FON` + `HÜRREM` → `fon-hurrem`
- `FON` + `SULTAN 22260` → `fon-sultan-22260`
- `BLK` + `ŞÖNİL BLACKOUT` → `blk-sonil-blackout`
- `TUL` + `BORNOVA` → `tul-bornova`

IDs are stable as long as the SKU prefix and design name don't change in the CSV.

---

## After running the script

### 1. Fill in fabric.texture

The script leaves `fabric.texture` as `null` for all designs except STN. This field is used by the AI image generator to produce accurate lifestyle photos.

Either fill it in manually by editing `catalog.json`, or use the PMS fabric analysis tool via the design detail page (⚗ Analiz button per variant).

Fabric textures by design (fill these in):

| Design | Suggested texture |
|---|---|
| HÜRREM | smooth woven |
| SULTAN 22260 | jacquard woven |
| HERA | smooth matte |
| YAĞMUR | textured weave |
| BORNOVA | fine woven mesh |
| PALU | open weave mesh |
| DESA | dense woven |
| ŞÖNİL BLACKOUT | chenille woven |
| LÜX BLACKOUT | smooth high-sheen |
| DARK BLACKOUT | smooth matte |
| %100 BLACKOUT | smooth dense |
| HERMES BLACKOUT | jacquard woven |
| HAVUZ BLACKOUT | smooth woven |
| SATEN | smooth satin (auto-filled) |

### 2. Add swatch images

Place swatch photos at: `01-cropped-katalog-images/{TYPE}/{SKU}.JPG`

### 3. Create Shopify products

Use the PMS at `pms.inanctekstil.store` — open a design and click "Shopify'a aktar" to create the product and variants via the Shopify API. The PMS writes back `product_id` and `variant_id` into the database.

---

## Current product catalog

| Type | Design | SKUs | Price |
|---|---|---|---|
| STN | SATEN | 2 | 150 TL |
| TUL | BORNOVA | 5 | 230 TL |
| TUL | PALU | 5 | 250 TL |
| TUL | DESA | 5 | 310 TL |
| FON | HÜRREM | 32 | 350 TL |
| FON | SULTAN 22260 | 60 | 430 TL |
| FON | HERA | 21 | 430 TL |
| FON | YAĞMUR | 11 | 500 TL |
| BLK | ŞÖNİL BLACKOUT | 38 | 750 TL |
| BLK | LÜX BLACKOUT | 40 | 590 TL |
| BLK | DARK BLACKOUT | 28 | 520 TL |
| BLK | %100 BLACKOUT | 25 | 590 TL |
| BLK | HERMES BLACKOUT | 52 | 750 TL |
| BLK | HAVUZ BLACKOUT | 28 | 230 TL |
| **Total** | **14 designs** | **352 SKUs** | |

14 Shopify products, not 352. Each design is one product; colours and finishes are variants.

---

## How consumers use catalog.json

### Image generator (`pms/src/image-engine`)

Iterates `catalog.designs`, then for each design iterates `design.variants`. For each variant it generates lifestyle images (swatch + room → AI image) and texture images. Uses `design.fabric` + `variant.colour` + `variant.swatch` as inputs. Room selection is configured in `pms/assets/input/manifest.json`.

### PMS Shopify sync

The PMS (`pms.inanctekstil.store`) handles all Shopify product management. It reads from its PostgreSQL database (seeded from `catalog.json`) and syncs products/variants to Shopify, writing back IDs into the DB.
