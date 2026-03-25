# Room Visualizer — Technical Investigation
**Date:** 2026-03-25
**Scope:** AI-generated room photos with accurate curtain fabric on fal.ai
**Status:** Pre-implementation — for review

---

## 1. Goal

Generate product room photos showing each curtain variant (352 SKUs) hanging in a realistic interior, with accurate fabric color, pattern, texture, and scale — using fal.ai models instead of local ComfyUI, starting from 1024×1024 flat swatch photos and pre-designed room templates.

---

## 2. Available Assets

### 2.1 Room Templates (`catalog/example/rooms-depth`)

Four 1024×1024 JPEG rooms. All have curtains as the primary subject, consistent composition: curtains fill the left 60–70% of frame, decorative element on right.

| File | Wall color | Curtain type | Suited for |
|------|-----------|-------------|-----------|
| `room-01-terracotta-wall-v2.jpg` | Terracotta/rust | Sheer voile, cream, backlit | TÜL variants |
| `room-02-wine-wall-v2.jpg` | Dark wine/plum | Sheer white, heavily backlit | TÜL variants |
| `room-03-blue-wall-v2.jpg` | Blue-grey | LEFT opaque + RIGHT sheer layer | FON + TÜL double |
| `room-04-dark-green-v2.jpg` | Dark forest green | Full opaque, heavy drape, rust | BLACKOUT / FON |

All rooms have natural lighting from window (backlit), pinch-pleat header detail visible, and rich fold/drape structure.

### 2.2 Turkish Room References (`catalog/example/rooms-turkish`)

Seven portrait photos (768×1376px) of real Turkish living rooms — authentic interiors with sofas, kilim rugs, TV units, plants. Currently all have sheer/white curtains. These are not template-ready for automated processing due to inconsistent composition. Suitable only for AI inpainting.

### 2.3 Fabric Textures

| Source | Format | Description |
|--------|--------|-------------|
| `catalog/swatch-assets/{SKU}/swatch-corrected.jpg` | 1024×1024 JPEG | Flat fabric swatch, color-corrected via retinex |
| `catalog/swatch-assets/{SKU}/meta.json` | JSON | `thread_colors` (hex), `thread_count`, `source_heic` |
| `catalog/swatch-assets/designs/{NAME}/swatch.jpg` | 1024×1024 JPEG | Design-level flat crop (one per product, not per variant) |
| `catalog/swatch-assets/designs/{NAME}/meta.json` | JSON | `real_world_cm`, `pixels_per_cm` — physical scale of texture |

### 2.4 Previous Texture Experiments (`catalog/example/textures-final`)

Two AI-generated draped fabric close-ups exist: `BLK-001-texture.webp` (teal) and `FON-001-texture.webp` (beige). These were generated independently — draped fabric photos without a room background. This approach was explored but does not scale: the fold shape of a standalone draped texture never matches the room template's fold geometry, making compositing impractical.

---

## 3. The Core Problem

A curtain in a room photo has three distinct visual layers:

| Layer | What it is | Must it change? |
|-------|-----------|----------------|
| **Structure** | Fold shape, drape geometry, pleat header | No — preserve from template |
| **Shading** | Highlights and shadow gradients from folds | No — preserve from template |
| **Appearance** | Fabric color, surface texture, pattern | Yes — apply from swatch |

The fundamental challenge: applying only the appearance layer while preserving structure and shading. Pure AI generation at high strength (img2img ≥ 0.5, txt2img) destroys the fold structure. It rewrites all three layers. This is why ComfyUI workflows use node-by-node separation — structure ControlNet, appearance IP-Adapter, shading preservation.

On fal.ai, the same separation must be built manually using PIL for the deterministic steps and AI only for the final harmonization pass.

---

## 4. Fabric Categories and Requirements

| Category | Examples | Challenge | Stage 1 approach | Stage 2 needed? |
|----------|---------|-----------|-----------------|-----------------|
| **Solid opaque** | %100 BLACKOUT, DARK BLACKOUT, HAVUZ BLACKOUT, HERMES BLACKOUT, plain FON | Exact color match | Luminosity-preserve recolor | Optional |
| **Solid sheer (TÜL)** | Plain tül variants | Color tint + transparency | Recolor + opacity blend with window | Recommended |
| **Patterned (DESENLİ)** | DESENLİ FON variants | Pattern must tile correctly at real scale across folds | Texture projection + multiply | Required |
| **Textured weave** | Some FON variants with subtle surface texture | Subtle surface detail beyond plain color | Recolor | Optional |

Appearance field in `Products - v2.csv` maps SKUs to these categories:
- `DESENLİ` → patterned
- `KOYU` / `AÇIK` → solid, 2 thread colors (slight texture variation)
- (blank) → solid single color

---

## 5. Recommended Pipeline: 2-Stage Architecture

### Stage 1 — Deterministic Recoloring (PIL, no AI, no cost)

**Pre-requisite (one-time):** Define curtain mask polygons for each of the 4 room templates. These are static per template — annotated once, stored as `room-01-mask.png` etc. alongside the templates.

**Per-SKU pipeline:**

```
Input: room_template.jpg + mask.png + SKU meta.json
                    ↓
1. Load room as numpy array
2. Extract curtain region using mask
3. Convert curtain region to grayscale luminosity (fold map)
   fold_map = 0.299R + 0.587G + 0.114B  → range [0,1]
4a. [Solid fabric]
    target_rgb = thread_colors[0]  (from meta.json)
    recolored = fold_map[:,:,np.newaxis] * target_rgb
5a. [Patterned fabric]
    tile_count_v = curtain_height_cm / real_world_cm
    tile_count_h = curtain_width_cm  / real_world_cm
    tiled = tile_and_warp(design_swatch, curtain_polygon, tile_count)
    recolored = tiled * fold_map[:,:,np.newaxis]  (multiply blend)
6.  Alpha-composite recolored curtain back into room template
Output: room_{sku}_{room_id}_stage1.jpg
```

**Result quality:** Exact color accuracy, correct shading/depth, zero hallucination, fast (~50ms/image on CPU), zero cost.

**Limitations:**
- Mask edges may look composited if not feathered
- Existing curtain color bleeds through at blend boundaries
- Sheer curtains need different handling (see section 5.3)

### Stage 2 — AI Harmonization (fal.ai, optional)

Fixes the compositing artifacts from Stage 1 and adds photorealistic surface detail.

```
Input: stage1_output.jpg
                    ↓
fal-ai/flux/dev  (image_to_image)
  strength:    0.15–0.25
  prompt:      "interior design photo, {color_name} curtain,
                natural fabric drape, soft window light,
                photorealistic, clean"
  seed:        fixed per room template  ← consistency across variants
Output: room_{sku}_{room_id}_final.jpg
```

**Why fixed seed per room?** Ensures the background, furniture, lighting, and curtain geometry stay identical across all SKU variants for the same room. Only the fabric appearance changes.

**Why low strength (0.15–0.25)?** At this range the model makes micro-corrections (edge blending, surface grain) without altering fold structure. Above 0.3 it starts reinterpreting the fold geometry.

### Stage 2 Alternative — Inpainting (for patterned fabrics)

For DESENLİ variants where the Stage 1 tiling needs more naturalistic integration:

```
Input: room_template.jpg + curtain mask + stage1_tiled_preview.jpg
                    ↓
fal-ai/flux-fill/dev  (inpainting)
  mask:        curtain region mask
  strength:    0.35–0.45
  prompt:      "curtain with {pattern_description} fabric pattern,
                natural folds, interior design, photorealistic"
  image:       stage1 tiled output as conditioning reference
Output: room_{sku}_{room_id}_final.jpg
```

---

## 6. Sheer / TÜL Fabrics — Special Handling

Sheer curtains are translucent — you see the window and outside through them. The `transparency_pct` field in meta.json (planned, from backlit photography) quantifies this. Without it, TÜL is approximated as transparency_pct ≈ 0.65.

Recoloring approach for sheer:

```python
# Extract window region (behind curtain)
window_layer = room_template[curtain_mask]

# Apply fabric as tinted overlay
tint_rgb   = thread_colors[0]
opacity    = 1 - transparency_pct  # 0.35 for typical tül

recolored = window_layer * transparency_pct + tint_rgb * opacity
```

For heavily backlit rooms (rooms 01 and 02), the window brightness dominates — only color tint is needed, not full recoloring.

---

## 7. Color Accuracy — The Neutralization Problem

Rooms 01–04 do NOT have neutral (white/grey) curtains — they have colored ones (cream, white, rust/terracotta). Recoloring from a colored base introduces hue bias.

**Example:** Room 04 has rust/terracotta curtains. Applying dark teal fabric via simple multiply blend results in brownish teal, not pure teal.

Two solutions:

**Option A: Neutralize first (recommended)**
```python
# Step 1: Divide by existing curtain color to get pure luminosity
existing_color = measure_curtain_dominant_color(room_template, mask)
luminosity = rgb / existing_color  # normalize to [0,1] per channel

# Step 2: Apply new fabric color
recolored = luminosity * new_color
```

**Option B: Generate neutral room templates (one-time)**
Regenerate each room template with white/neutral placeholder curtains. Costs ~$0.10 total for 4 rooms on fal.ai. Makes all subsequent recoloring trivially accurate. **This is the cleaner long-term solution.**

---

## 8. Real-World Scale for Pattern Tiling

For patterned fabrics, `meta.json` in `swatch-assets/designs/` provides:
- `real_world_cm`: physical size represented by 1024×1024 texture (e.g., 26.6cm × 26.6cm for SULTAN 22260)
- `pixels_per_cm`: scale factor (~41 px/cm across all designs)

Standard curtain dimensions: 240cm drop × 140cm width (2× fullness = 280cm fabric width).

**Tile count calculation:**
```python
tile_v = 240 / real_world_cm   # e.g. 240 / 26.6 = 9.0 vertical tiles
tile_h = 280 / real_world_cm   # e.g. 280 / 26.6 = 10.5 horizontal tiles
```

Without this scaling, patterns appear either comically oversized or invisible as microprint.

---

## 9. fal.ai Model Selection

| Use case | Model | Strength | Est. cost/img |
|----------|-------|----------|--------------|
| Solid fabric — harmonization | `fal-ai/flux/dev` img2img | 0.15–0.25 | ~$0.004 |
| Sheer/TÜL — harmonization | `fal-ai/flux/dev` img2img | 0.20–0.30 | ~$0.005 |
| Patterned — inpainting | `fal-ai/flux-fill/dev` | 0.35–0.45 | ~$0.025 |
| Turkish rooms — inpainting | `fal-ai/flux-fill/dev` | 0.50–0.60 | ~$0.025 |

**Models that will not work reliably for this use case:**
- High-strength img2img (≥ 0.5) — fold structure collapses
- Pure txt2img with hex color in prompt — ignored by all current models
- IP-Adapter/style reference alone — too much creative freedom, color unreliable
- ControlNet without mask isolation — background structure bleeds through

---

## 10. Cost Estimate — Full Catalog

| Scope | Images | Unit cost | Total |
|-------|--------|-----------|-------|
| 352 SKUs × 4 rooms, Stage 1 only | 1,408 | $0 | **$0** |
| + Stage 2 harmonization, solid fabrics (~70%) | ~986 | $0.004 | **~$4** |
| + Stage 2 inpainting, patterned fabrics (~30%) | ~422 | $0.025 | **~$10** |
| Turkish rooms, 352 SKUs × 7 rooms | 2,464 | $0.025 | **~$62** |
| **Total (rooms-depth only)** | **1,408** | | **~$14** |
| **Total (all rooms)** | **3,872** | | **~$76** |

---

## 11. Implementation Milestones

### Milestone 1 — Proof of concept, solid fabric, one room
- Define curtain mask for `room-04` (opaque, simplest case)
- PIL pipeline: luminosity extract → neutralize existing color → apply new color → composite
- Test with 3 SKUs: one dark, one mid, one light
- Expected result: correct color, correct fold shading, no AI yet

### Milestone 2 — AI harmonization
- Add fal.ai Stage 2 call after Milestone 1
- Compare Stage 1 vs Stage 2 quality
- Tune strength parameter to find minimum effective value
- Validate fixed-seed consistency across 10 variants

### Milestone 3 — All 4 rooms, solid fabrics
- Extend masks to rooms 01–03
- Handle sheer rooms (01, 02) with opacity blending
- Room 03 double-layer (opaque + sheer)
- Batch-process full BLACKOUT and plain FON catalog

### Milestone 4 — Patterned fabrics
- Implement tile + perspective warp projector
- Use `real_world_cm` for correct scale
- Add flux-fill inpainting pass
- Test with DESENLŐ variants

### Milestone 5 — Turkish rooms
- Define inpainting workflow (no pre-made mask needed — model identifies curtain)
- Or: generate curtain segmentation masks using `fal-ai/imageutils/rembg` or similar
- Batch-process all 7 rooms × 352 SKUs

---

## 12. Open Questions

1. **Neutral room templates**: Should we regenerate rooms-depth with white/neutral placeholder curtains for cleaner recoloring? Cost: ~$0.10, time: 30 minutes. Recommended before Milestone 1.

2. **Transparency data**: `transparency_pct` is not yet in SKU meta.json (requires backlit photography). TÜL pipeline is approximate until this is added. How critical is sheer accuracy in the first release?

3. **Pattern scale validation**: `real_world_cm` values range from 15–27cm across designs. Is this correct? The physical tile count for a 240cm curtain would be 9–16 tiles — this should be verified visually against physical samples before batch generation.

4. **Turkish rooms**: Do we need these in the first release, or are the 4 rooms-depth templates sufficient for launch?

5. **Variant-level vs design-level textures**: For patterned fabrics, should each SKU variant produce a distinct room image (different color of the same pattern), or is one representative image per design sufficient? The former requires per-SKU tiled texture at correct color; the latter can share one image per design.

---

## 13. File Layout After Implementation

```
catalog/
  swatch-assets/
    {SKU}/
      swatch.jpg
      swatch-corrected.jpg       ← input for recoloring
      meta.json                  ← thread_colors, thread_count
      rooms/
        room-01.jpg              ← final output per room
        room-02.jpg
        room-03.jpg
        room-04.jpg
  room-templates/
    room-01-terracotta-wall-v2.jpg
    room-01-mask.png             ← curtain mask (one-time annotation)
    room-01-neutral.jpg          ← neutral placeholder version (optional)
    ...

catalog/swatch-cropper/
  room_visualizer.py             ← Stage 1 PIL pipeline
  room_visualizer_fal.py         ← Stage 2 fal.ai harmonization
```

---

## 14. Summary Recommendation

| Step | Action | Priority |
|------|--------|----------|
| Now | Decide on neutral room templates (re-generate or neutralize in code) | High |
| Now | Verify `real_world_cm` values against physical samples | High |
| M1 | PIL recoloring pipeline, room-04, solid fabrics | High |
| M2 | fal.ai harmonization pass, tune strength | Medium |
| M3 | All 4 rooms, full solid catalog (~245 SKUs) | High |
| M4 | Patterned fabric pipeline | Medium |
| M5 | Turkish rooms inpainting | Low |

The core insight: **the room templates already contain the hard part** (realistic drape, lighting, composition). The AI's job is only to make the recoloring invisible — a low-strength harmonization pass, not full generation. This keeps cost low, color accurate, and results consistent across the full catalog.
