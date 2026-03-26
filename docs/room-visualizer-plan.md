# Room Visualizer — Implementation Plan
**Date:** 2026-03-25
**Depends on:** `docs/room-visualizer-investigation.md`
**Output directory:** `catalog/swatch-cropper/`

---

## Overview

Build a pipeline that takes a flat fabric swatch (`swatch-corrected.jpg`) and a room template
(`rooms-depth/room-XX.jpg`) and produces a photorealistic room photo with the curtain showing
the exact fabric. Two stages:

- **Stage 1** — Deterministic PIL recoloring. Free, exact color, no AI.
- **Stage 2** — fal.ai harmonization at low strength. Optional quality polish.

Total output: `catalog/swatch-assets/{SKU}/rooms/room-{01..04}.jpg` for all 352 SKUs.

---

## Directory Layout After Implementation

```
catalog/
  room-templates/
    room-01-terracotta-wall-v2.jpg     ← source templates (existing)
    room-02-wine-wall-v2.jpg
    room-03-blue-wall-v2.jpg
    room-04-dark-green-v2.jpg
    room-01-mask.png                   ← curtain mask, RGBA (Task 1)
    room-02-mask.png
    room-03-mask.png
    room-04-mask.png
    room-01-neutral.jpg                ← neutral placeholder (Task 2, optional)
    room-02-neutral.jpg
    room-03-neutral.jpg
    room-04-neutral.jpg
    rooms.json                         ← room metadata (Task 1)

  swatch-assets/
    {SKU}/
      swatch.jpg
      swatch-corrected.jpg
      meta.json
      rooms/                           ← outputs (created by pipeline)
        room-01.jpg
        room-02.jpg
        room-03.jpg
        room-04.jpg
        room-01-stage1.jpg             ← stage 1 only, kept for comparison
        room-02-stage1.jpg
        ...

  swatch-cropper/
    room_visualizer.py                 ← Stage 1: PIL pipeline
    room_visualizer_fal.py             ← Stage 2: fal.ai harmonization
    room_batch.py                      ← batch runner + progress logging
    mask_editor.py                     ← browser tool for mask annotation
    tests/
      test_fold_map.py
      test_recolor.py
      test_composite.py
      test_pattern_tile.py
      test_pipeline.py                 ← integration tests
      test_batch.py
      fixtures/
        room-04-mask.png               ← test fixture mask
        BLK-001-expected-room-04.jpg   ← visual regression reference
```

---

## Task 1 — Room Metadata and Mask Annotation Tool

**File:** `catalog/room-templates/rooms.json`

```json
{
  "rooms": {
    "room-01": {
      "file": "room-01-terracotta-wall-v2.jpg",
      "wall_color": "#8B4513",
      "curtain_type": "sheer",
      "curtain_color_existing": "#F5F0E8",
      "suited_for": ["TUL"],
      "curtain_polygon": [[50,0],[640,0],[640,1024],[50,1024]],
      "window_region": [[80,80],[580,900]]
    },
    "room-02": {
      "file": "room-02-wine-wall-v2.jpg",
      "wall_color": "#3B1A1A",
      "curtain_type": "sheer",
      "curtain_color_existing": "#FFFFFF",
      "suited_for": ["TUL"],
      "curtain_polygon": [[0,0],[680,0],[680,1024],[0,1024]],
      "window_region": [[60,60],[600,950]]
    },
    "room-03": {
      "file": "room-03-blue-wall-v2.jpg",
      "wall_color": "#6B8FA8",
      "curtain_type": "double",
      "curtain_color_existing": "#7A9AB0",
      "suited_for": ["FON", "TUL"],
      "curtain_polygon": [[0,0],[200,0],[200,1024],[0,1024]],
      "sheer_polygon": [[180,0],[680,0],[680,1024],[180,1024]],
      "window_region": [[200,40],[680,940]]
    },
    "room-04": {
      "file": "room-04-dark-green-v2.jpg",
      "wall_color": "#2D4A2D",
      "curtain_type": "opaque",
      "curtain_color_existing": "#B8622A",
      "suited_for": ["BLACKOUT", "FON"],
      "curtain_polygon": [[0,0],[700,0],[700,1024],[0,1024]],
      "window_region": null
    }
  }
}
```

**File:** `catalog/swatch-cropper/mask_editor.py`

Browser tool (same pattern as `center_picker.py`) that:
1. Shows each room template
2. Lets user draw polygon for curtain region using clicks
3. Renders polygon as a filled white mask on black background
4. Saves PNG mask to `catalog/room-templates/room-XX-mask.png`
5. Server at port 8901 to avoid conflict with center_picker

**Mask format:** 1024×1024 RGBA PNG, curtain region = white (255,255,255), outside = black (0,0,0). For room-03 (double): separate masks per layer.

**Logging:**
```
[mask_editor] Loaded room-04-dark-green-v2.jpg (1024x1024)
[mask_editor] Polygon saved: 6 points → room-04-mask.png (white area: 682,341 px = 65.2%)
```

**Test:**
- Mask files are valid PNG, 1024×1024, binary (only 0 and 255 values)
- White pixel count > 30% and < 80% of total (sanity: curtain must be significant but not entire frame)
- Polygon closure check (last point connects to first)

---

## Task 2 — Neutral Room Templates (Optional but Recommended)

**File:** `catalog/swatch-cropper/neutralize_rooms.py`

Generate neutral (white/grey curtain) versions of each room template. Used as input for Task 3
to eliminate existing curtain color bias during recoloring.

**Two options:**

**Option A — PIL desaturation (free):**
```python
def neutralize_curtain(room_path, mask_path, out_path):
    room = np.array(Image.open(room_path).convert('RGB'))
    mask = np.array(Image.open(mask_path).convert('L')) / 255.0
    curtain = room.copy().astype(float)
    # Extract luminosity only, remove hue
    lum = 0.299*curtain[:,:,0] + 0.587*curtain[:,:,1] + 0.114*curtain[:,:,2]
    grey = np.stack([lum, lum, lum], axis=2)
    mask3 = mask[:,:,np.newaxis]
    neutral = (grey * mask3 + room * (1 - mask3)).astype(np.uint8)
    Image.fromarray(neutral).save(out_path, 'JPEG', quality=95)
```

**Option B — fal.ai regeneration ($0.10 total):**
- Send each room to `fal-ai/flux/dev` img2img at strength 0.30 with prompt
  `"same room, white linen curtains, no color cast, neutral fabric, interior design photo"`
- Fixed seed per room for reproducibility

**Logging:**
```
[neutralize] room-04: existing curtain color #B8622A → neutralized
[neutralize] curtain region dominant color before: #B8622A  after: #8A8A8A  (delta: 94.3)
[neutralize] saved: room-04-neutral.jpg
```

**Test:**
- Dominant color of masked curtain region in output is within 20 RGB units of neutral grey (128,128,128)
- Non-curtain region pixel values unchanged (< 2 delta from original)

---

## Task 3 — Stage 1: Core PIL Recoloring Pipeline

**File:** `catalog/swatch-cropper/room_visualizer.py`

### 3.1 Data Structures

```python
@dataclass
class RoomConfig:
    room_id: str         # 'room-01' .. 'room-04'
    template: np.ndarray # H×W×3 uint8
    mask: np.ndarray     # H×W float32 [0,1]
    existing_color: tuple[int,int,int]  # RGB of current curtain
    curtain_type: str    # 'opaque' | 'sheer' | 'double'

@dataclass
class FabricSpec:
    sku: str
    dominant_color: tuple[int,int,int]   # from thread_colors[0]
    thread_colors: list[tuple[int,int,int]]
    appearance: str | None               # 'DESENLİ' | 'KOYU' | 'AÇIK' | None
    transparency_pct: float              # 0.0 = blackout, 1.0 = fully sheer
    transparency_class: str             # 'blackout' | 'opaque' | 'sheer'
    pattern_repeat_cm: float | None
    swatch_path: Path
    design_swatch_path: Path | None      # designs/{NAME}/swatch.jpg if patterned
    real_world_cm: float | None          # from design meta.json
```

### 3.2 Functions

**`load_fabric_spec(sku: str, assets_dir: Path) -> FabricSpec`**

Reads `{SKU}/meta.json`. Parses `thread_colors[0]` as hex → RGB tuple.
Resolves `design_swatch_path` if appearance is `DESENLİ`.

Logging:
```
[fabric] BLK-001  color=#b4b6b1 (180,182,177)  class=blackout  appearance=None
[fabric] FON-042  color=#3a5f7d (58,95,125)   class=opaque    appearance=DESENLİ  pattern_repeat=12.0cm  texture=designs/SULTAN_22260/swatch.jpg
```

Raises `FabricLoadError` if meta.json missing or thread_colors empty.

---

**`extract_fold_map(room: RoomConfig) -> np.ndarray`**

Extracts luminosity of curtain region as H×W float32 [0,1].

```python
def extract_fold_map(room: RoomConfig) -> np.ndarray:
    r, g, b = room.template[:,:,0], room.template[:,:,1], room.template[:,:,2]
    lum = (0.299*r + 0.587*g + 0.114*b) / 255.0
    # Apply mask: only curtain region, rest is 0
    fold_map = lum * room.mask
    log.debug(f'  fold_map: min={fold_map[room.mask>0.5].min():.3f}  '
              f'max={fold_map[room.mask>0.5].max():.3f}  '
              f'mean={fold_map[room.mask>0.5].mean():.3f}  '
              f'std={fold_map[room.mask>0.5].std():.3f}')
    return fold_map
```

Logging:
```
[fold]  room-04  min=0.042  max=0.961  mean=0.487  std=0.198  contrast=0.919
```

A low std (<0.05) warns: `[fold] WARNING: low contrast fold map — may indicate uniform/solid region or mask issue`

---

**`neutralize_fold_map(fold_map: np.ndarray, existing_color: tuple, mask: np.ndarray) -> np.ndarray`**

Removes existing curtain hue from fold map so it is purely luminosity-based.

```python
def neutralize_fold_map(fold_map, existing_color, mask):
    # existing_color bias: how far from mid-grey (128,128,128) was it?
    ec = np.array(existing_color, dtype=float) / 255.0
    ec_lum = 0.299*ec[0] + 0.587*ec[1] + 0.114*ec[2]
    # Scale fold map to remove existing color's luminosity bias
    if ec_lum > 0.01:
        corrected = fold_map / ec_lum * 0.5
    else:
        corrected = fold_map
    return np.clip(corrected, 0, 1) * mask
```

Logging:
```
[neutralize]  existing_color=#B8622A  existing_lum=0.436
[neutralize]  fold_map range before: [0.042, 0.961]  after: [0.048, 1.000]
```

---

**`apply_solid_color(fold_map: np.ndarray, target_color: tuple, mask: np.ndarray) -> np.ndarray`**

Returns H×W×3 uint8 recolored curtain image.

```python
def apply_solid_color(fold_map, target_color, mask):
    tc = np.array(target_color, dtype=float)
    # Luminosity-preserve: multiply fold intensity by target color
    colored = fold_map[:,:,np.newaxis] * tc * 2.0  # *2 because fold is normalized to 0.5 mean
    colored = np.clip(colored, 0, 255).astype(np.uint8)
    # Mask out non-curtain
    mask3 = (mask[:,:,np.newaxis] > 0.1).astype(np.uint8)
    return colored * mask3
```

Logging:
```
[color]  target=#b4b6b1 (180,182,177)  output_mean=#b2b4af  delta=2.8 (pass, threshold=10)
```

Color delta check: measure dominant color of output masked region, assert Euclidean distance from target < 10.

---

**`apply_sheer_blend(fold_map, target_color, mask, window_region, room_template, transparency_pct)`**

For TÜL/sheer curtains: blend colored layer with window background.

```python
def apply_sheer_blend(fold_map, target_color, mask, window_region, template, transparency_pct):
    solid = apply_solid_color(fold_map, target_color, mask)
    opacity = 1.0 - transparency_pct   # 0.35 for typical tül
    blended = solid.astype(float) * opacity + template.astype(float) * transparency_pct
    return np.clip(blended, 0, 255).astype(np.uint8)
```

Logging:
```
[sheer]  transparency_pct=0.65  opacity=0.35  blend_alpha=0.35
[sheer]  window_brightness=0.82  output_brightness=0.74
```

---

**`apply_pattern_texture(room, fabric, fold_map) -> np.ndarray`**

For DESENLİ fabrics. Tiles design swatch at correct real-world scale, warps to curtain polygon, multiplies with fold map.

```python
def apply_pattern_texture(room, fabric, fold_map):
    assert fabric.design_swatch_path is not None
    assert fabric.real_world_cm is not None

    # Standard curtain dimensions
    CURTAIN_HEIGHT_CM = 240.0
    CURTAIN_WIDTH_CM  = 280.0  # 2× fullness

    # How many tiles needed
    tile_v = ceil(CURTAIN_HEIGHT_CM / fabric.real_world_cm)
    tile_h = ceil(CURTAIN_WIDTH_CM  / fabric.real_world_cm)

    log.info(f'[pattern]  real_world_cm={fabric.real_world_cm}  '
             f'tiles={tile_h}h × {tile_v}v  '
             f'total_tiles={tile_h*tile_v}')

    # Load and tile
    swatch = np.array(Image.open(fabric.design_swatch_path).convert('RGB'))
    tiled = np.tile(swatch, (tile_v, tile_h, 1))

    # Resize tiled to curtain region bounding box
    h, w = room.template.shape[:2]
    curtain_h = int(room.mask.sum(axis=1).max())
    curtain_w = int(room.mask.sum(axis=0).max())
    tiled_resized = np.array(Image.fromarray(tiled).resize((curtain_w, curtain_h), Image.LANCZOS))

    log.debug(f'[pattern]  tiled_shape={tiled.shape}  resized_to={curtain_w}×{curtain_h}')

    # Place in full-frame canvas
    canvas = np.zeros((h, w, 3), dtype=np.uint8)
    # find curtain bounding box
    ys, xs = np.where(room.mask > 0.1)
    y0, x0, y1, x1 = ys.min(), xs.min(), ys.max(), xs.max()
    resized = np.array(Image.fromarray(tiled).resize((x1-x0, y1-y0), Image.LANCZOS))
    canvas[y0:y1, x0:x1] = resized

    # Multiply with fold map for depth
    fold3 = np.stack([fold_map*2]*3, axis=2)
    textured = np.clip(canvas.astype(float) * fold3, 0, 255).astype(np.uint8)

    return textured
```

Logging:
```
[pattern]  SKU=FON-042  design=SULTAN_22260  real_world_cm=26.6
[pattern]  tiles=11h × 10v  total_tiles=110  swatch=1024×1024  tiled=10240×11264
[pattern]  curtain_bbox=(0,0)→(700,1024)  resized_to=700×1024
[pattern]  fold_multiply: min=0.042 max=0.961 mean=0.487
```

---

**`composite_into_room(room_template, curtain_layer, mask) -> np.ndarray`**

Alpha-composites the recolored curtain back into the room.

```python
def composite_into_room(template, curtain_layer, mask):
    mask3 = mask[:,:,np.newaxis]
    # Feather mask edges with gaussian blur to avoid hard seams
    mask_feathered = np.array(
        Image.fromarray((mask*255).astype(np.uint8)).filter(GaussianBlur(radius=3))
    ).astype(float) / 255.0
    mask3f = mask_feathered[:,:,np.newaxis]
    composite = (curtain_layer.astype(float) * mask3f +
                 template.astype(float) * (1 - mask3f))
    return np.clip(composite, 0, 255).astype(np.uint8)
```

Logging:
```
[composite]  mask_feather=radius3  seam_pixels=~2840  output_shape=(1024,1024,3)
```

---

**`run_stage1(sku, room_id, assets_dir, templates_dir, out_dir) -> Path`**

Top-level Stage 1 function. Orchestrates all steps above.

```python
def run_stage1(sku, room_id, assets_dir, templates_dir, out_dir):
    t0 = time.time()
    log.info(f'[stage1] START  sku={sku}  room={room_id}')

    fabric = load_fabric_spec(sku, assets_dir)
    room   = load_room_config(room_id, templates_dir)

    fold_map = extract_fold_map(room)
    fold_map = neutralize_fold_map(fold_map, room.existing_color, room.mask)

    if fabric.appearance == 'DESENLİ':
        curtain = apply_pattern_texture(room, fabric, fold_map)
    elif fabric.transparency_class in ('sheer', 'semi-sheer'):
        curtain = apply_sheer_blend(fold_map, fabric.dominant_color, room.mask,
                                    room.window_region, room.template,
                                    fabric.transparency_pct)
    else:
        curtain = apply_solid_color(fold_map, fabric.dominant_color, room.mask)

    output = composite_into_room(room.template, curtain, room.mask)
    out_path = out_dir / sku / 'rooms' / f'{room_id}-stage1.jpg'
    out_path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(output).save(out_path, 'JPEG', quality=92)

    elapsed = time.time() - t0
    log.info(f'[stage1] DONE   sku={sku}  room={room_id}  '
             f'time={elapsed:.2f}s  out={out_path}')
    return out_path
```

---

## Task 4 — Stage 2: fal.ai Harmonization

**File:** `catalog/swatch-cropper/room_visualizer_fal.py`

Depends on: `pip install fal-client`

### 4.1 Configuration

```python
FAL_MODELS = {
    'solid':   'fal-ai/flux/dev',        # img2img, strength 0.20
    'sheer':   'fal-ai/flux/dev',        # img2img, strength 0.25
    'pattern': 'fal-ai/flux-fill/dev',   # inpainting, strength 0.40
}

STRENGTH_BY_TYPE = {
    'opaque':  0.20,
    'sheer':   0.25,
    'double':  0.22,
    'pattern': 0.40,
}

# Fixed seeds per room for consistency across all SKU variants
SEEDS = {
    'room-01': 42,
    'room-02': 137,
    'room-03': 256,
    'room-04': 512,
}
```

### 4.2 Prompt Builder

```python
def build_prompt(fabric: FabricSpec, room: RoomConfig) -> str:
    color_name = hex_to_color_name(fabric.dominant_color)   # simple lookup table
    hex_code   = '#{:02x}{:02x}{:02x}'.format(*fabric.dominant_color)

    if fabric.transparency_class == 'blackout':
        fabric_desc = f'thick blackout curtain, {color_name} ({hex_code}), opaque, heavy drape'
    elif fabric.transparency_class == 'sheer':
        fabric_desc = f'sheer voile curtain, {color_name} tint, translucent, soft light'
    elif fabric.appearance == 'DESENLİ':
        fabric_desc = f'patterned curtain fabric, {color_name} tones, woven pattern, natural folds'
    else:
        fabric_desc = f'{color_name} curtain ({hex_code}), natural fabric, soft drape'

    return (
        f'interior design photo, {fabric_desc}, '
        f'photorealistic, natural window light, professional photography, '
        f'no artifacts, seamless fabric texture'
    )
```

Logging:
```
[fal] prompt: "interior design photo, dark teal curtain (#254548), thick blackout, ..."
```

### 4.3 Stage 2 Runner

```python
async def run_stage2(stage1_path: Path, fabric: FabricSpec, room: RoomConfig,
                     out_path: Path, dry_run=False) -> Path:
    t0 = time.time()
    log.info(f'[stage2] START  sku={fabric.sku}  room={room.room_id}')

    if dry_run:
        log.info(f'[stage2] DRY_RUN — skipping fal.ai call')
        shutil.copy(stage1_path, out_path)
        return out_path

    prompt   = build_prompt(fabric, room)
    strength = STRENGTH_BY_TYPE.get(room.curtain_type, 0.20)
    model    = FAL_MODELS.get('pattern' if fabric.appearance == 'DESENLİ' else 'solid')
    seed     = SEEDS[room.room_id]

    log.info(f'[stage2]  model={model}  strength={strength}  seed={seed}')
    log.info(f'[stage2]  prompt="{prompt[:80]}..."')

    with open(stage1_path, 'rb') as f:
        img_b64 = base64.b64encode(f.read()).decode()

    result = await fal_client.run_async(
        model,
        arguments={
            'image_url': f'data:image/jpeg;base64,{img_b64}',
            'prompt': prompt,
            'strength': strength,
            'seed': seed,
            'num_inference_steps': 28,
            'guidance_scale': 3.5,
        }
    )

    img_url = result['images'][0]['url']
    img_data = requests.get(img_url).content
    Image.open(io.BytesIO(img_data)).save(out_path, 'JPEG', quality=92)

    elapsed = time.time() - t0
    log.info(f'[stage2] DONE   sku={fabric.sku}  room={room.room_id}  '
             f'time={elapsed:.2f}s  cost_est=${strength*0.025:.4f}  out={out_path}')
    return out_path
```

---

## Task 5 — Batch Runner

**File:** `catalog/swatch-cropper/room_batch.py`

```
Usage:
  python room_batch.py --rooms room-04 --stage 1 --limit 10
  python room_batch.py --rooms all --stage 1,2 --skus BLK-001..BLK-133
  python room_batch.py --rooms all --stage 1 --dry-run
  python room_batch.py --resume  # skip already-completed outputs
```

### 5.1 Logging Setup

```python
import logging, json
from datetime import datetime

def setup_logging(log_dir: Path):
    log_dir.mkdir(exist_ok=True)
    run_id = datetime.now().strftime('%Y%m%d_%H%M%S')

    # Console handler — INFO level, concise
    console = logging.StreamHandler()
    console.setLevel(logging.INFO)
    console.setFormatter(logging.Formatter('%(asctime)s  %(message)s', '%H:%M:%S'))

    # File handler — DEBUG level, full detail
    file_h = logging.FileHandler(log_dir / f'run_{run_id}.log')
    file_h.setLevel(logging.DEBUG)
    file_h.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(message)s'))

    # JSON handler — machine-readable per-SKU results
    # Written at end of each SKU, one JSON object per line
    json_path = log_dir / f'run_{run_id}.jsonl'

    logging.getLogger().addHandler(console)
    logging.getLogger().addHandler(file_h)
    return run_id, json_path
```

### 5.2 Progress and Result Tracking

```python
@dataclass
class SkuResult:
    sku: str
    room_id: str
    stage: int
    status: str           # 'ok' | 'error' | 'skipped'
    elapsed_s: float
    color_delta: float    # measured vs target
    out_path: str
    error: str | None

def write_jsonl(path: Path, result: SkuResult):
    with open(path, 'a') as f:
        f.write(json.dumps(asdict(result)) + '\n')
```

### 5.3 Batch Loop

```python
def run_batch(skus, rooms, stages, assets_dir, templates_dir, log_dir):
    run_id, jsonl_path = setup_logging(log_dir)
    total = len(skus) * len(rooms)
    done = errors = skipped = 0

    log.info(f'[batch] START  run_id={run_id}  skus={len(skus)}  rooms={len(rooms)}  '
             f'stages={stages}  total_images={total}')

    for i, (sku, room_id) in enumerate(itertools.product(skus, rooms), 1):
        out_final = assets_dir / sku / 'rooms' / f'{room_id}.jpg'
        if out_final.exists() and not args.force:
            log.debug(f'[batch] SKIP  {sku}/{room_id}  (already exists)')
            skipped += 1
            continue

        try:
            stage1_path = run_stage1(sku, room_id, assets_dir, templates_dir,
                                     assets_dir)
            if 2 in stages:
                fabric = load_fabric_spec(sku, assets_dir)
                room   = load_room_config(room_id, templates_dir)
                asyncio.run(run_stage2(stage1_path, fabric, room, out_final))
            else:
                shutil.copy(stage1_path, out_final)

            delta = measure_color_delta(out_final, sku, assets_dir)
            write_jsonl(jsonl_path, SkuResult(sku, room_id, max(stages),
                                              'ok', elapsed, delta, str(out_final), None))
            done += 1

        except Exception as e:
            log.error(f'[batch] ERROR  {sku}/{room_id}  {e}')
            write_jsonl(jsonl_path, SkuResult(sku, room_id, max(stages),
                                              'error', 0, 0, '', str(e)))
            errors += 1

        # Progress line every 10 images
        if i % 10 == 0:
            pct = i / total * 100
            log.info(f'[batch] PROGRESS  {i}/{total} ({pct:.0f}%)  '
                     f'done={done}  errors={errors}  skipped={skipped}')

    log.info(f'[batch] DONE  run_id={run_id}  done={done}  errors={errors}  '
             f'skipped={skipped}  log={jsonl_path}')
```

---

## Task 6 — Testing Suite

### 6.1 Unit Tests — Fold Map (`tests/test_fold_map.py`)

```python
def test_fold_map_shape():
    """Fold map must have same H×W as template, dtype float32."""
    room = make_test_room('room-04')
    fmap = extract_fold_map(room)
    assert fmap.shape == (1024, 1024)
    assert fmap.dtype == np.float32

def test_fold_map_range():
    """Fold map values must be in [0, 1]."""
    room = make_test_room('room-04')
    fmap = extract_fold_map(room)
    assert fmap.min() >= 0.0
    assert fmap.max() <= 1.0

def test_fold_map_contrast():
    """Curtain region must have meaningful contrast (std > 0.05)."""
    room = make_test_room('room-04')
    fmap = extract_fold_map(room)
    curtain_vals = fmap[room.mask > 0.5]
    assert curtain_vals.std() > 0.05, \
        f'Low contrast fold map: std={curtain_vals.std():.3f}'

def test_fold_map_zero_outside_mask():
    """Fold map must be zero outside mask."""
    room = make_test_room('room-04')
    fmap = extract_fold_map(room)
    outside = fmap[room.mask < 0.1]
    assert outside.max() < 0.01
```

### 6.2 Unit Tests — Recoloring (`tests/test_recolor.py`)

```python
def test_solid_color_accuracy():
    """Output dominant color must match target within delta=10."""
    room   = make_test_room('room-04')
    fold   = extract_fold_map(room)
    fold   = neutralize_fold_map(fold, room.existing_color, room.mask)
    target = (37, 69, 72)   # DARK BLACKOUT #254548
    output = apply_solid_color(fold, target, room.mask)
    delta  = measure_dominant_color_delta(output, room.mask, target)
    assert delta < 10.0, f'Color delta too high: {delta:.1f}'

def test_solid_color_preserves_folds():
    """Fold contrast must be preserved after recoloring."""
    room   = make_test_room('room-04')
    fold   = extract_fold_map(room)
    fold   = neutralize_fold_map(fold, room.existing_color, room.mask)
    output = apply_solid_color(fold, (37,69,72), room.mask)
    out_lum = 0.299*output[:,:,0] + 0.587*output[:,:,1] + 0.114*output[:,:,2]
    curtain_lum = out_lum[room.mask > 0.5]
    assert curtain_lum.std() > 8.0, \
        f'Fold contrast lost after recoloring: std={curtain_lum.std():.1f}'

def test_dark_color(tmp_path):
    """Very dark fabric (blackout) must not wash out."""
    room   = make_test_room('room-04')
    fold   = extract_fold_map(room)
    fold   = neutralize_fold_map(fold, room.existing_color, room.mask)
    output = apply_solid_color(fold, (20, 22, 31), room.mask)  # #14161f
    curtain_mean = output[room.mask > 0.5].mean()
    assert curtain_mean < 80, f'Dark fabric too bright: mean={curtain_mean:.1f}'

def test_light_color():
    """Light fabric must not clip to white."""
    room   = make_test_room('room-04')
    fold   = extract_fold_map(room)
    fold   = neutralize_fold_map(fold, room.existing_color, room.mask)
    output = apply_solid_color(fold, (220, 215, 205), room.mask)  # near-white
    pct_clipped = (output[room.mask > 0.5] == 255).mean()
    assert pct_clipped < 0.05, f'Too many clipped pixels: {pct_clipped:.1%}'

def test_neutralize_removes_hue():
    """After neutralize, fold map applied with grey should produce grey output."""
    room   = make_test_room('room-04')
    fold   = extract_fold_map(room)
    fold_n = neutralize_fold_map(fold, room.existing_color, room.mask)
    grey   = (128, 128, 128)
    output = apply_solid_color(fold_n, grey, room.mask)
    r_mean = output[room.mask>0.5, 0].mean()
    g_mean = output[room.mask>0.5, 1].mean()
    b_mean = output[room.mask>0.5, 2].mean()
    # R, G, B means should be within 15 of each other (grey balance)
    assert abs(r_mean - g_mean) < 15, f'Hue bias after neutralize: R={r_mean:.0f} G={g_mean:.0f}'
    assert abs(r_mean - b_mean) < 15, f'Hue bias after neutralize: R={r_mean:.0f} B={b_mean:.0f}'
```

### 6.3 Unit Tests — Composite (`tests/test_composite.py`)

```python
def test_composite_shape():
    """Output must have same shape as template."""
    room    = make_test_room('room-04')
    fold    = extract_fold_map(room)
    fold    = neutralize_fold_map(fold, room.existing_color, room.mask)
    curtain = apply_solid_color(fold, (37,69,72), room.mask)
    output  = composite_into_room(room.template, curtain, room.mask)
    assert output.shape == room.template.shape

def test_composite_background_unchanged():
    """Non-curtain region must be within 5 delta of original template."""
    room    = make_test_room('room-04')
    fold    = extract_fold_map(room)
    fold    = neutralize_fold_map(fold, room.existing_color, room.mask)
    curtain = apply_solid_color(fold, (37,69,72), room.mask)
    output  = composite_into_room(room.template, curtain, room.mask)
    outside = room.mask < 0.05
    delta   = np.abs(output[outside].astype(float) - room.template[outside].astype(float))
    assert delta.max() < 5, f'Background changed: max_delta={delta.max()}'

def test_composite_no_black_holes():
    """No large fully-black region should appear in output."""
    room    = make_test_room('room-04')
    fold    = extract_fold_map(room)
    curtain = apply_solid_color(fold, (37,69,72), room.mask)
    output  = composite_into_room(room.template, curtain, room.mask)
    black   = (output.sum(axis=2) == 0)
    assert black.mean() < 0.001, f'Black holes detected: {black.mean():.4f} of pixels'
```

### 6.4 Unit Tests — Pattern Tiling (`tests/test_pattern_tile.py`)

```python
def test_tile_count():
    """Tile count must cover full curtain height at correct scale."""
    fabric = FabricSpec(sku='FON-042', ..., real_world_cm=26.6, appearance='DESENLİ')
    tile_v = ceil(240 / fabric.real_world_cm)
    tile_h = ceil(280 / fabric.real_world_cm)
    assert tile_v == 10
    assert tile_h == 11

def test_tile_covers_mask():
    """Tiled output must cover all mask pixels."""
    room   = make_test_room('room-04')
    fabric = make_test_fabric('FON-042', appearance='DESENLİ', real_world_cm=26.6)
    fold   = extract_fold_map(room)
    output = apply_pattern_texture(room, fabric, fold)
    curtain_black = (output.sum(axis=2) == 0) & (room.mask > 0.5)
    assert curtain_black.mean() < 0.001, 'Uncovered mask pixels in tiled output'

def test_scale_independence():
    """A 20cm real_world_cm fabric must produce more tiles than a 30cm one."""
    room    = make_test_room('room-04')
    fold    = extract_fold_map(room)
    fabric_small = make_test_fabric('X', real_world_cm=20.0, appearance='DESENLİ')
    fabric_large = make_test_fabric('Y', real_world_cm=30.0, appearance='DESENLİ')
    out_s   = apply_pattern_texture(room, fabric_small, fold)
    out_l   = apply_pattern_texture(room, fabric_large, fold)
    # The small-tile output should have higher spatial frequency (more variation)
    # measured as mean absolute gradient
    grad_s  = np.abs(np.diff(out_s.astype(float), axis=0)).mean()
    grad_l  = np.abs(np.diff(out_l.astype(float), axis=0)).mean()
    assert grad_s > grad_l, 'Smaller real_world_cm should produce finer pattern tiling'
```

### 6.5 Integration Tests (`tests/test_pipeline.py`)

```python
def test_full_pipeline_stage1_solid(tmp_path):
    """Full Stage 1 pipeline produces valid JPEG at correct path."""
    out = run_stage1('BLK-001', 'room-04', ASSETS_DIR, TEMPLATES_DIR, tmp_path)
    assert out.exists()
    img = Image.open(out)
    assert img.size == (1024, 1024)
    assert img.mode == 'RGB'

def test_full_pipeline_color_accuracy(tmp_path):
    """Stage 1 output curtain color must match meta.json thread_colors[0] within delta=10."""
    run_stage1('BLK-001', 'room-04', ASSETS_DIR, TEMPLATES_DIR, tmp_path)
    out = tmp_path / 'BLK-001' / 'rooms' / 'room-04-stage1.jpg'
    mask = load_mask('room-04', TEMPLATES_DIR)
    fabric = load_fabric_spec('BLK-001', ASSETS_DIR)
    delta = measure_dominant_color_delta(np.array(Image.open(out)), mask, fabric.dominant_color)
    assert delta < 10.0, f'Color delta {delta:.1f} exceeds threshold'

def test_full_pipeline_all_rooms(tmp_path):
    """Stage 1 produces outputs for all 4 rooms for one SKU."""
    for room_id in ['room-01', 'room-02', 'room-03', 'room-04']:
        run_stage1('BLK-001', room_id, ASSETS_DIR, TEMPLATES_DIR, tmp_path)
        out = tmp_path / 'BLK-001' / 'rooms' / f'{room_id}-stage1.jpg'
        assert out.exists(), f'Missing output for {room_id}'

def test_pipeline_all_fabric_types(tmp_path):
    """Pipeline handles all fabric categories without error."""
    test_cases = [
        ('BLK-001', 'blackout solid'),
        ('FON-001', 'opaque solid'),
        # ('TUL-001', 'sheer'),    # add when transparency_pct populated
        # ('FON-042', 'patterned'), # add when DESENLİ examples confirmed
    ]
    for sku, desc in test_cases:
        try:
            run_stage1(sku, 'room-04', ASSETS_DIR, TEMPLATES_DIR, tmp_path)
        except Exception as e:
            pytest.fail(f'Pipeline failed for {desc} ({sku}): {e}')

def test_visual_regression(tmp_path):
    """
    Stage 1 output must match saved reference image (SSIM > 0.99).
    Stage 1 is fully deterministic — identical outputs expected on every run.
    Reference images in tests/fixtures/.
    """
    run_stage1('BLK-001', 'room-04', ASSETS_DIR, TEMPLATES_DIR, tmp_path)
    out = Image.open(tmp_path / 'BLK-001' / 'rooms' / 'room-04-stage1.jpg')
    ref = Image.open(Path(__file__).parent / 'fixtures' / 'BLK-001-expected-room-04.jpg')
    ssim = compute_ssim(np.array(out), np.array(ref))
    assert ssim > 0.99, f'Visual regression failed: SSIM={ssim:.4f}'
```

### 6.6 Batch Validation (`tests/test_batch.py`)

```python
def test_batch_produces_all_outputs(tmp_path):
    """Batch over 5 SKUs × 4 rooms produces 20 output files."""
    test_skus = ['BLK-001', 'BLK-002', 'BLK-003', 'FON-001', 'FON-002']
    run_batch(test_skus, ['room-01','room-02','room-03','room-04'],
              stages=[1], assets_dir=ASSETS_DIR, templates_dir=TEMPLATES_DIR,
              log_dir=tmp_path/'logs')
    outputs = list((tmp_path/'..'/ASSETS_DIR).rglob('rooms/room-*.jpg'))
    assert len(outputs) == 20

def test_batch_jsonl_log(tmp_path):
    """Batch produces valid JSONL log with one entry per image."""
    run_batch(['BLK-001'], ['room-04'], stages=[1],
              assets_dir=ASSETS_DIR, templates_dir=TEMPLATES_DIR,
              log_dir=tmp_path)
    jsonl = list(tmp_path.glob('run_*.jsonl'))[0]
    entries = [json.loads(l) for l in jsonl.read_text().splitlines()]
    assert len(entries) == 1
    assert entries[0]['status'] == 'ok'
    assert entries[0]['sku'] == 'BLK-001'
    assert entries[0]['room_id'] == 'room-04'
    assert 'color_delta' in entries[0]
    assert 'elapsed_s' in entries[0]

def test_batch_resume(tmp_path):
    """Batch with --resume skips already-completed outputs."""
    # First run
    run_batch(['BLK-001'], ['room-04'], stages=[1], ...)
    # Second run — must skip
    with patch('room_visualizer.run_stage1') as mock_stage1:
        run_batch(['BLK-001'], ['room-04'], stages=[1], resume=True, ...)
        mock_stage1.assert_not_called()

def test_batch_continues_after_error(tmp_path):
    """A single failing SKU must not abort the entire batch."""
    with patch('room_visualizer.load_fabric_spec',
               side_effect=lambda sku, *a: (_ for _ in ()).throw(ValueError('bad meta'))
               if sku == 'BLK-002' else original_load(sku, *a)):
        run_batch(['BLK-001', 'BLK-002', 'BLK-003'], ['room-04'], ...)
    jsonl = list(tmp_path.glob('*.jsonl'))[0]
    entries = {e['sku']: e for e in [json.loads(l) for l in jsonl.read_text().splitlines()]}
    assert entries['BLK-001']['status'] == 'ok'
    assert entries['BLK-002']['status'] == 'error'
    assert entries['BLK-003']['status'] == 'ok'
```

---

## Task 7 — Color Delta Measurement (QA Helper)

Used in tests and logged per image to verify color accuracy objectively.

```python
def measure_dominant_color_delta(output: np.ndarray,
                                  mask: np.ndarray,
                                  target_rgb: tuple) -> float:
    """
    Measure Euclidean RGB distance between the dominant color
    of the output's curtain region and the target color.
    Lower is better. Threshold: < 10 = pass.
    """
    curtain_pixels = output[mask > 0.5].astype(float)
    measured = curtain_pixels.mean(axis=0)   # [R, G, B]
    target   = np.array(target_rgb, dtype=float)
    delta    = np.linalg.norm(measured - target)
    log.debug(f'  color_delta: measured=#{int(measured[0]):02x}{int(measured[1]):02x}'
              f'{int(measured[2]):02x}  target=#{target_rgb[0]:02x}{target_rgb[1]:02x}'
              f'{target_rgb[2]:02x}  delta={delta:.1f}')
    return float(delta)
```

---

## Task 8 — Batch Report Generator

After a batch run, generate an HTML report for visual review:

```python
def generate_report(jsonl_path: Path, assets_dir: Path, out_html: Path):
    """
    Produces report.html showing:
    - Summary table: total, ok, errors, mean color_delta, mean elapsed
    - Per-room color accuracy histogram
    - Thumbnail grid: each SKU × room with color_delta overlay
    - Error list with tracebacks
    """
```

Sample report output:
```
Run: 20260325_143022
Total: 1408  OK: 1401  Errors: 7  Skipped: 0
Mean color_delta: 4.2  Max: 18.7  Threshold failures (>10): 3
Mean elapsed: 0.08s/image  Stage: 1 only

Errors:
  FON-042/room-03: FabricLoadError: design swatch not found
  ...
```

---

## Implementation Order

| Task | Effort | Depends on | Output |
|------|--------|-----------|--------|
| T1 — rooms.json + mask editor | 2h | — | masks, rooms.json |
| T2 — neutral templates | 1h | T1 | room-XX-neutral.jpg |
| T3 — Stage 1 core pipeline | 4h | T1, T2 | room_visualizer.py |
| T4 — Stage 2 fal.ai | 2h | T3 | room_visualizer_fal.py |
| T5 — batch runner | 2h | T3, T4 | room_batch.py |
| T6 — test suite | 3h | T3, T5 | tests/ |
| T7 — color delta QA | 0.5h | T3 | in room_visualizer.py |
| T8 — report generator | 1h | T5, T7 | report.html |

**Total: ~15h**

First working output: T1 + T3 (6h) → produces Stage 1 room image for BLK-001 × room-04.

---

## Acceptance Criteria

| Criteria | Threshold |
|----------|----------|
| Color accuracy (Stage 1, solid) | delta < 10 RGB units for 95% of SKUs |
| Color accuracy (Stage 1, dark fabrics) | delta < 15 |
| Fold contrast preservation | output std > 80% of input std |
| Background unchanged | max delta < 5 in non-curtain region |
| No black holes | < 0.1% fully-black pixels |
| Determinism | SSIM > 0.99 on repeated runs (Stage 1) |
| Stage 2 consistency | SSIM > 0.92 for same room, different SKUs in same fabric class |
| Batch error rate | < 1% on full 352-SKU run |
| Stage 1 throughput | > 10 images/second on CPU |
