# Curtain Input Data Structure — Pilot (DARK BLACKOUT + MONICA)

## Pilot Scope

| Design | Type | SKUs | Current state |
|--------|------|------|---------------|
| DARK BLACKOUT | BLK | 28 | Swatches cropped, basic fabric fields in catalog.json |
| MONICA | FON | 11 | Swatches cropped, basic fabric fields in catalog.json |

These cover two distinct fabric types: opaque heavy blackout vs. draped fon — good for validating the pipeline across different behaviors.

---

## Current PMS Image Generation Flow

```
Swatch photo + Room photo
        ↓
AnalyzeSwatch (BAML/Claude) → FabricDescription (7 text fields)
        ↓
CraftLifestylePrompt (BAML/Claude) → optimized text prompt
        ↓
fal.ai nano-banana-pro/edit (Gemini Flash Image Pro)
        ↓
EvaluateLifestyleImage (BAML/Claude) → QualityScore (8 dimensions)
        ↓
Retry up to 3x if score < 7
```

### What's Missing

| Input | Current | Needed |
|-------|---------|--------|
| Fabric swatch | Photo (cropped square) | Same + extracted color values |
| Fabric physics | Text only (material, weight) | Numeric drape/stiffness/fold data |
| Drape reference | None | Photo of how fabric actually hangs |
| Texture detail | None | Macro photo of weave pattern |
| Light behavior | Text ("blackout"/"sheer") | Exact transmission %, sheen type |
| Hanging style | Hardcoded per type in prompt | Per-design pleat/fullness data |
| Room templates | 4 defined, image files missing | 4-6 diverse AI-generated rooms |

---

## Step 1: Create Design Asset Directories

Create `ecommerce/products/designs/` with a folder per pilot design:

```
ecommerce/products/designs/
  dark-blackout/
    fabric-profile.json    ← fill manually
    design-flat.jpg        ← bigger fabric swatch photo (iPhone)
    drape-reference.jpg    ← fabric hanging from hand (iPhone, new shot)
    texture-macro.jpg      ← iPhone macro mode close-up (iPhone, new)
    backlight-test.jpg     ← held against window (iPhone, optional for BLK)
  monica/
    fabric-profile.json
    design-flat.jpg
    drape-reference.jpg
    texture-macro.jpg
    backlight-test.jpg
```

The `design-flat.jpg` is what already exists (the bigger swatch). The other 3 shots are new photos taken with iPhone 17 — about 5 minutes per design.

---

## Step 2: fabric-profile.json Schema

One file per design (not per SKU). Fill in while holding the physical fabric.

```json
{
  "design": "DARK BLACKOUT",
  "curtain_type": "BLK",

  "material": {
    "primary": "polyester",
    "blend": null,
    "finish": "matte"
  },

  "physics": {
    "weight_gsm": null,
    "drape": "medium",
    "stiffness": "medium",
    "fold_depth": "medium",
    "recovery": "slow"
  },

  "optics": {
    "transparency": "blackout",
    "light_transmission_pct": 0,
    "sheen": "matte",
    "color_shifts_in_light": false
  },

  "surface": {
    "texture_description": "smooth dense weave, no visible pattern from 1m",
    "pattern": null,
    "pattern_repeat_cm": null,
    "two_sided": true,
    "front_vs_back": "front smooth, back slightly textured"
  },

  "hanging": {
    "style": "two-panel-closed",
    "pleat_type": "pinch",
    "fullness_ratio": 2.0,
    "hem_weighted": false
  },

  "notes": "Free-text observations while holding the fabric"
}
```

### How to Fill Each Field

| Field | How to measure | Values |
|-------|---------------|--------|
| `physics.drape` | Hold 30cm of fabric over hand edge. Observe how it falls. | `stiff` (hangs straight), `medium` (soft curve), `flowing` (liquid-like) |
| `physics.fold_depth` | Bunch the fabric, look at pleat depth. | `shallow` (flat creases), `medium`, `deep` (valley-like folds) |
| `physics.recovery` | Bunch it, release, time it. | `fast` (snaps back), `medium`, `slow` (stays bunched) |
| `optics.light_transmission_pct` | Hold to window. | `0` = pitch black, `20` = see shapes, `50` = see colors, `80+` = nearly clear |
| `optics.sheen` | Look at fabric under angled light. | `matte` (no reflection), `satin` (soft glow), `glossy` (mirror-like) |
| `hanging.fullness_ratio` | Standard for fabric type. | BLK: `2.0x`, FON: `2.0-2.5x`, TUL: `2.5-3.0x` |
| `hanging.pleat_type` | How the fabric is typically pleated. | `pinch`, `pencil`, `wave`, `goblet` |

---

## Step 3: iPhone Photography Protocol

For each of the 2 pilot designs, take these shots:

| Shot | Filename | Setup | Purpose |
|------|----------|-------|---------|
| Flat swatch | `design-flat.jpg` | Already exists — the bigger fabric piece | Color/texture reference |
| Drape reference | `drape-reference.jpg` | Hold ~50cm from one hand, let hang against a **white wall**. Natural light, no flash. | Shows AI how folds actually look |
| Texture macro | `texture-macro.jpg` | iPhone macro mode, ~10cm from fabric surface. Capture weave pattern. | Surface detail for prompt |
| Backlight test | `backlight-test.jpg` | Hold fabric against bright window. Shoot from room side. | Light transmission (skip for full blackout) |

### Photography Tips

- Shoot in **HEIC** (default iPhone quality is fine)
- Use **natural daylight** — matches room scene lighting conditions
- Keep a **white paper** visible at frame edge for color reference
- For drape shot, use a **plain white wall** behind
- For macro shot, ensure sharp focus on weave pattern, not color

---

## Step 4: AI-Generated Room Templates

Generate 4-6 diverse empty room photos using fal.ai. Each room should have:
- An empty window (no curtains) with visible cornice (kartonpiyer)
- Clear floor area below window
- Styled furniture and props

### Target Room Variety

| Room ID | Style | Wall Color | Best For |
|---------|-------|------------|----------|
| `room-modern-light` | Modern salon, light walls | White/beige | Dark fabrics (DARK BLACKOUT) |
| `room-warm-terracotta` | Warm salon | Terracotta | Medium tones |
| `room-minimal-grey` | Minimalist | Grey | All types |
| `room-bedroom-neutral` | Yatak odası | Soft cream | FON types (MONICA) |
| `room-dark-elegant` | Elegant salon | Dark green/navy | Light fabrics |
| `room-bright-scandinavian` | Airy, Nordic | Pure white | Sheer/light fabrics |

Store in `ecommerce/pms/assets/input/rooms/` and update `manifest.json`.

---

## Step 5: PMS Schema Updates

### New columns on `designs` table (`ecommerce/pms/src/db/schema.ts`)

```typescript
// Fabric physics
fabricWeightGsm:          integer("fabric_weight_gsm"),
fabricDrape:              text("fabric_drape"),              // stiff, medium, flowing
fabricSheen:              text("fabric_sheen"),               // matte, satin, glossy
fabricLightTransmission:  integer("fabric_light_transmission_pct"),
fabricFoldDepth:          text("fabric_fold_depth"),          // shallow, medium, deep

// Hanging style
hangingStyle:             text("hanging_style"),              // two-panel-closed, two-panel-open, single-panel
hangingPleatType:         text("hanging_pleat_type"),         // pinch, pencil, wave
hangingFullnessRatio:     text("hanging_fullness_ratio"),     // "2.0"

// Reference photos (per-design, not per-SKU)
designPhotoPath:          text("design_photo_path"),
drapeReferencePath:       text("drape_reference_path"),
textureMacroPath:         text("texture_macro_path"),
```

---

## Step 6: BAML + Prompt Updates

### Update `types.baml` — add optional physics fields to `FabricDescription`

```
weight_gsm              int?
drape                   string?    @description("stiff, medium, or flowing")
sheen                   string?    @description("matte, satin, or glossy")
light_transmission_pct  int?
fold_depth              string?    @description("shallow, medium, or deep")
hanging_style           string?
pleat_type              string?
fullness_ratio          float?
```

### Update `craft_prompt.baml`

- Add `drape_reference: image?` as optional 3rd input image
- Expand the `FABRIC DETAILS:` block with physics fields
- Tell the prompt crafter to reference the drape photo for fold accuracy

### Update `helpers.ts`

Map new DB fields into `toFabricDescription()`.

### Update `generate.ts`

Pass drape reference as 3rd image URL to fal.ai when available:

```typescript
// Current
imageUrls: [roomUrl, swatchUrl]

// Enhanced (when drape reference exists)
imageUrls: [roomUrl, swatchUrl, drapeUrl]
```

---

## Step 7: Test Pipeline on Pilot

```bash
npx tsx src/generate.ts --sku BLK-001 --room room-modern-light
npx tsx src/generate.ts --sku FON-015 --room room-bedroom-neutral
```

Compare output quality against the old pipeline (without physics/drape reference).

---

## Execution Order

| # | Step | Who | Effort |
|---|------|-----|--------|
| 1 | Create directory structure + fabric-profile.json templates | Code | 10 min |
| 2 | iPhone photography: 2 designs × 3-4 shots | Manual | 10 min |
| 3 | Fill fabric-profile.json for both designs (holding physical fabric) | Manual | 10 min |
| 4 | Generate AI room templates via fal.ai, update manifest.json | Code | 30 min |
| 5 | DB schema migration + BAML type updates | Code | 30 min |
| 6 | Update prompt crafter + generation pipeline | Code | 1 hour |
| 7 | Test on BLK-001 + FON-015, compare quality | Code + Review | 30 min |
| 8 | If quality OK → bulk generate all 39 pilot SKUs | Code | Batch job |
