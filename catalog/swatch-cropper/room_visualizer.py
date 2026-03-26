"""
Stage 1 — Deterministic PIL recoloring pipeline.

Takes a flat fabric swatch + room template + mask and produces a room photo
with the curtain showing the exact fabric color/pattern.
No AI, no cost. ~50ms per image on CPU.

Usage:
  python room_visualizer.py --sku BLK-001 --room room-04
  python room_visualizer.py --sku FON-042 --room room-04 --save-stage1
"""
import argparse
import json
import logging
import time
from dataclasses import dataclass, field
from math import ceil
from pathlib import Path
from typing import Optional

import numpy as np
from PIL import Image, ImageFilter

# ── Paths ─────────────────────────────────────────────────────────────────────

BASE          = Path('/Users/semsettin/workspace/inanc-tekstil/catalog')
ASSETS_DIR    = BASE / 'swatch-assets'
TEMPLATES_DIR = BASE / 'room-templates'
ROOMS_JSON    = TEMPLATES_DIR / 'rooms.json'

# ── Logging ───────────────────────────────────────────────────────────────────

log = logging.getLogger('room_visualizer')


def setup_logging(level=logging.INFO):
    logging.basicConfig(
        level=level,
        format='%(asctime)s  %(message)s',
        datefmt='%H:%M:%S',
    )


# ── Data structures ───────────────────────────────────────────────────────────

@dataclass
class RoomConfig:
    room_id:          str
    template:         np.ndarray          # H×W×3 uint8
    mask:             np.ndarray          # H×W float32 [0,1]
    existing_color:   tuple               # RGB of current curtain color
    curtain_type:     str                 # 'opaque' | 'sheer' | 'double'
    window_region:    Optional[list]      # [[x1,y1],[x2,y2]] or None
    sheer_mask:       Optional[np.ndarray] = None  # room-03 double layer


@dataclass
class FabricSpec:
    sku:               str
    dominant_color:    tuple              # RGB from thread_colors[0]
    thread_colors:     list
    appearance:        Optional[str]      # 'DESENLİ' | 'KOYU' | 'AÇIK' | None
    transparency_pct:  float             # 0.0=blackout, 1.0=fully sheer
    transparency_class: str             # 'blackout' | 'opaque' | 'sheer'
    pattern_repeat_cm: Optional[float]
    swatch_path:       Path
    design_swatch_path: Optional[Path]
    real_world_cm:     Optional[float]


class FabricLoadError(Exception):
    pass


class MaskNotFoundError(Exception):
    pass


# ── Hex helpers ───────────────────────────────────────────────────────────────

def hex_to_rgb(h: str) -> tuple:
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def rgb_to_hex(rgb: tuple) -> str:
    return '#{:02x}{:02x}{:02x}'.format(*rgb)


# ── Lab color space ───────────────────────────────────────────────────────────

def rgb_to_lab(rgb: tuple) -> tuple:
    """Convert sRGB (0-255) to CIE L*a*b* (D65 illuminant).

    Returns (L, a, b) where L in [0,100], a/b in roughly [-128,127].
    No external dependencies — pure Python.
    """
    # Normalize to [0,1]
    r, g, b = (c / 255.0 for c in rgb)

    # sRGB linearization (gamma decode)
    def _lin(c: float) -> float:
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    r, g, b = _lin(r), _lin(g), _lin(b)

    # Linear RGB → XYZ (sRGB / D65)
    x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b
    y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b
    z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b

    # Normalize by D65 white point
    x /= 0.95047
    y /= 1.00000
    z /= 1.08883

    # XYZ → Lab
    def _f(t: float) -> float:
        return t ** (1.0 / 3.0) if t > 0.008856 else 7.787 * t + 16.0 / 116.0

    fx, fy, fz = _f(x), _f(y), _f(z)
    L = 116.0 * fy - 16.0
    a = 500.0 * (fx - fy)
    b = 200.0 * (fy - fz)
    return (L, a, b)


def delta_e_lab(lab1: tuple, lab2: tuple) -> float:
    """CIE76 ΔE between two Lab colors. Threshold: <3 imperceptible, <10 acceptable."""
    return float(sum((a - b) ** 2 for a, b in zip(lab1, lab2)) ** 0.5)


def measure_color_accuracy(
    output: np.ndarray,
    mask: np.ndarray,
    target_rgb: tuple,
) -> tuple[float, float]:
    """Measure color accuracy of output against target in mask region.

    Returns (delta_rgb, delta_e) where:
      delta_rgb — Euclidean distance in RGB space (0-441)
      delta_e   — CIE76 ΔE in Lab space (perceptually calibrated; <3 imperceptible)
    """
    curtain_px = output[mask > 0.5]
    if len(curtain_px) == 0:
        return 0.0, 0.0
    mean_rgb   = tuple(curtain_px.reshape(-1, 3).mean(axis=0).astype(int))
    delta_rgb  = float(np.linalg.norm(
        np.array(mean_rgb, dtype=float) - np.array(target_rgb, dtype=float)
    ))
    delta_e    = delta_e_lab(rgb_to_lab(mean_rgb), rgb_to_lab(target_rgb))
    return delta_rgb, delta_e


# ── Load fabric spec ──────────────────────────────────────────────────────────

def load_fabric_spec(sku: str, assets_dir: Path = ASSETS_DIR) -> FabricSpec:
    meta_path = assets_dir / sku / 'meta.json'
    if not meta_path.exists():
        raise FabricLoadError(f'meta.json not found: {meta_path}')

    meta = json.loads(meta_path.read_text())
    thread_colors_raw = meta.get('thread_colors', [])
    if not thread_colors_raw:
        raise FabricLoadError(f'{sku}: thread_colors is empty in meta.json')

    thread_colors = [hex_to_rgb(c) for c in thread_colors_raw]
    dominant_color = thread_colors[0]

    appearance = meta.get('appearance')
    sku_type   = meta.get('type', '')

    # Determine transparency class
    if 'BLACKOUT' in sku.upper() or 'BLK' in sku.upper():
        transparency_class = 'blackout'
        transparency_pct   = 0.0
    elif 'TUL' in sku.upper() or sku.upper().startswith('TUL'):
        transparency_class = 'sheer'
        transparency_pct   = 0.65
    else:
        transparency_class = 'opaque'
        transparency_pct   = 0.05

    swatch_path = assets_dir / sku / 'swatch-corrected.jpg'
    if not swatch_path.exists():
        swatch_path = assets_dir / sku / 'swatch.jpg'

    # Resolve design swatch if patterned
    design_swatch_path = None
    real_world_cm      = None

    if appearance == 'DESENLİ':
        design_name = meta.get('design_name') or meta.get('design') or sku
        safe_name   = design_name.replace('/', '_').replace('%', 'pct').replace(' ', '_')
        design_dir  = assets_dir / 'designs' / safe_name
        if design_dir.exists():
            design_swatch_path = design_dir / 'swatch.jpg'
            design_meta_path   = design_dir / 'meta.json'
            if design_meta_path.exists():
                dmeta = json.loads(design_meta_path.read_text())
                real_world_cm = dmeta.get('real_world_cm')

    log.info(
        f'[fabric] {sku}  color={rgb_to_hex(dominant_color)} '
        f'({dominant_color[0]},{dominant_color[1]},{dominant_color[2]})  '
        f'class={transparency_class}  appearance={appearance}'
        + (f'  pattern_cm={real_world_cm}' if real_world_cm else '')
    )

    return FabricSpec(
        sku=sku,
        dominant_color=dominant_color,
        thread_colors=thread_colors,
        appearance=appearance,
        transparency_pct=transparency_pct,
        transparency_class=transparency_class,
        pattern_repeat_cm=real_world_cm,
        swatch_path=swatch_path,
        design_swatch_path=design_swatch_path,
        real_world_cm=real_world_cm,
    )


# ── Load room config ──────────────────────────────────────────────────────────

def load_room_config(room_id: str, templates_dir: Path = TEMPLATES_DIR) -> RoomConfig:
    rooms_json = templates_dir / 'rooms.json'
    if not rooms_json.exists():
        raise FileNotFoundError(f'rooms.json not found: {rooms_json}')

    rooms_data = json.loads(rooms_json.read_text())
    if room_id not in rooms_data['rooms']:
        raise KeyError(f'Room not found in rooms.json: {room_id}')

    cfg = rooms_data['rooms'][room_id]

    # Load template image
    img_path = templates_dir / cfg['file']
    template = np.array(Image.open(img_path).convert('RGB'))
    h, w = template.shape[:2]

    log.info(f'[room]  {room_id}  template={w}x{h}  type={cfg["curtain_type"]}')

    # Load mask
    mask_path = templates_dir / f'{room_id}-mask.png'
    if not mask_path.exists():
        raise MaskNotFoundError(
            f'Mask not found: {mask_path}\n'
            f'Run mask_editor.py to annotate curtain polygon.'
        )

    mask_img = Image.open(mask_path).convert('L').resize((w, h), Image.LANCZOS)
    mask = np.array(mask_img).astype(np.float32) / 255.0

    white_pct = 100 * mask.mean()
    log.info(f'[room]  {room_id}  mask={mask_path.name}  white={white_pct:.1f}%')

    if white_pct < 5:
        log.warning(f'[room] WARNING: mask is almost empty ({white_pct:.1f}%) — check mask file')
    if white_pct > 90:
        log.warning(f'[room] WARNING: mask covers {white_pct:.1f}% of frame — seems too large')

    # Load sheer mask (room-03 double layer)
    sheer_mask = None
    if cfg.get('curtain_type') == 'double':
        sheer_mask_path = templates_dir / f'{room_id}-sheer-mask.png'
        if sheer_mask_path.exists():
            sheer_img   = Image.open(sheer_mask_path).convert('L').resize((w, h), Image.LANCZOS)
            sheer_mask  = np.array(sheer_img).astype(np.float32) / 255.0
            log.info(f'[room]  {room_id}  sheer_mask={sheer_mask_path.name}')

    existing_color = hex_to_rgb(cfg.get('curtain_color_existing', '#808080'))

    return RoomConfig(
        room_id=room_id,
        template=template,
        mask=mask,
        existing_color=existing_color,
        curtain_type=cfg['curtain_type'],
        window_region=cfg.get('window_region'),
        sheer_mask=sheer_mask,
    )


# ── Stage 1 pipeline functions ────────────────────────────────────────────────

def extract_fold_map(room: RoomConfig) -> np.ndarray:
    """Extract luminosity of curtain region as H×W float32 [0,1]."""
    r = room.template[:, :, 0].astype(np.float32)
    g = room.template[:, :, 1].astype(np.float32)
    b = room.template[:, :, 2].astype(np.float32)
    lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0

    fold_map = lum * room.mask

    # Stats on curtain region only
    curtain_px = fold_map[room.mask > 0.5]
    if curtain_px.size > 0:
        fmin, fmax = curtain_px.min(), curtain_px.max()
        fmean, fstd = curtain_px.mean(), curtain_px.std()
        contrast = fmax - fmin
        log.debug(
            f'[fold]  {room.room_id}  min={fmin:.3f}  max={fmax:.3f}  '
            f'mean={fmean:.3f}  std={fstd:.3f}  contrast={contrast:.3f}'
        )
        if fstd < 0.05:
            log.warning(
                f'[fold] WARNING: low contrast fold map (std={fstd:.3f}) — '
                f'may indicate uniform region or mask issue'
            )
    return fold_map


def neutralize_fold_map(
    fold_map: np.ndarray,
    existing_color: tuple,
    mask: np.ndarray,
) -> np.ndarray:
    """Remove existing curtain hue bias so fold_map is purely luminosity."""
    ec = np.array(existing_color, dtype=np.float32) / 255.0
    ec_lum = 0.299 * ec[0] + 0.587 * ec[1] + 0.114 * ec[2]

    log.debug(
        f'[neutralize]  existing_color={rgb_to_hex(existing_color)}  '
        f'existing_lum={ec_lum:.3f}'
    )

    before_range = (fold_map[mask > 0.5].min(), fold_map[mask > 0.5].max()) if mask.sum() > 0 else (0, 0)

    if ec_lum > 0.01:
        corrected = fold_map / ec_lum * 0.5
    else:
        corrected = fold_map.copy()

    corrected = np.clip(corrected, 0.0, 1.0) * mask

    after_range = (corrected[mask > 0.5].min(), corrected[mask > 0.5].max()) if mask.sum() > 0 else (0, 0)
    log.debug(
        f'[neutralize]  range before: [{before_range[0]:.3f}, {before_range[1]:.3f}]  '
        f'after: [{after_range[0]:.3f}, {after_range[1]:.3f}]'
    )

    return corrected


def _find_clip_safe_scale(
    fold_curtain: np.ndarray,
    tc_max: float,
    n_iter: int = 30,
) -> float:
    """Binary search for scale s.t. mean(clip(fold * tc_max * s, 0, 255)) == tc_max.

    Accounts for highlight clipping: the naive 1/fold_mean scale assumes no
    clipping, but bright target colors cause high-luminosity fold pixels to
    clip at 255, dragging the output mean below target. This finds the exact
    scale where the actual post-clip mean equals the target.
    """
    fold_mean = float(fold_curtain.mean())
    if fold_mean < 1e-6 or tc_max < 1e-6:
        return 1.0
    # lo = naive scale (correct only when no clipping occurs)
    # hi = 5x naive (generous ceiling for heavy-clipping scenarios)
    lo = 1.0 / fold_mean
    hi = lo * 5.0
    for _ in range(n_iter):
        mid = (lo + hi) / 2.0
        mean_out = float(np.clip(fold_curtain * (tc_max * mid), 0.0, 255.0).mean())
        if mean_out < tc_max:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2.0


def apply_solid_color(
    fold_map: np.ndarray,
    target_color: tuple,
    mask: np.ndarray,
) -> np.ndarray:
    """Apply a solid fabric color using fold map for luminosity shading.

    Uses clip-safe adaptive scaling: binary-searches for the scale where the
    mean output pixel after clipping exactly equals the target color, regardless
    of how many fold highlights clip at 255.

    Returns H×W×3 uint8.
    """
    tc = np.array(target_color, dtype=np.float32)

    # Clip-safe scale: binary search so mean(clip(fold*tc*s, 0,255)) == tc
    curtain_vals = fold_map[mask > 0.5]
    if curtain_vals.size == 0:
        curtain_vals = np.array([0.5], dtype=np.float32)
    tc_max = float(tc.max())
    scale = _find_clip_safe_scale(curtain_vals, tc_max)
    fold_mean = float(curtain_vals.mean())

    log.debug(f'[color]  fold_mean={fold_mean:.3f}  clip_safe_scale={scale:.3f}')

    colored = fold_map[:, :, np.newaxis] * tc * scale
    colored = np.clip(colored, 0, 255).astype(np.uint8)

    # Zero out non-curtain pixels
    mask3 = (mask[:, :, np.newaxis] > 0.1).astype(np.uint8)
    result = colored * mask3

    # Log output color accuracy (RGB + Lab ΔE)
    delta_rgb, delta_e = measure_color_accuracy(result, mask, target_color)
    mean_rgb = tuple(result[mask > 0.5].reshape(-1, 3).mean(axis=0).astype(int)) if mask.sum() > 0 else target_color
    log.info(
        f'[color]  target={rgb_to_hex(target_color)}  '
        f'output_mean={rgb_to_hex(mean_rgb)}  '
        f'delta_rgb={delta_rgb:.1f}  delta_e={delta_e:.2f}'
        + (' ✓' if delta_e < 10 else '  WARN: ΔE > 10')
    )
    return result


def apply_sheer_blend(
    fold_map: np.ndarray,
    target_color: tuple,
    mask: np.ndarray,
    template: np.ndarray,
    transparency_pct: float,
) -> np.ndarray:
    """For TÜL/sheer fabrics: blend tinted fold with window background.

    Returns H×W×3 uint8.
    """
    solid = apply_solid_color(fold_map, target_color, mask)
    opacity = 1.0 - transparency_pct

    blended = (
        solid.astype(np.float32) * opacity
        + template.astype(np.float32) * transparency_pct
    )
    result = np.clip(blended, 0, 255).astype(np.uint8)

    # Only blend within mask
    mask3 = mask[:, :, np.newaxis]
    final = (result.astype(np.float32) * mask3
             + template.astype(np.float32) * (1 - mask3))
    final = np.clip(final, 0, 255).astype(np.uint8)

    brightness_in  = template[mask > 0.5].astype(float).mean() / 255.0 if mask.sum() > 0 else 0
    brightness_out = final[mask > 0.5].astype(float).mean() / 255.0 if mask.sum() > 0 else 0
    log.info(
        f'[sheer]  transparency_pct={transparency_pct:.2f}  opacity={opacity:.2f}  '
        f'window_brightness={brightness_in:.2f}  output_brightness={brightness_out:.2f}'
    )
    return final


def apply_pattern_texture(
    room: RoomConfig,
    fabric: FabricSpec,
    fold_map: np.ndarray,
) -> np.ndarray:
    """For DESENLİ fabrics: tile design swatch at correct real-world scale.

    Returns H×W×3 uint8.
    """
    assert fabric.design_swatch_path is not None, 'design_swatch_path required for DESENLİ'
    assert fabric.real_world_cm is not None, 'real_world_cm required for DESENLİ'

    CURTAIN_HEIGHT_CM = 240.0
    CURTAIN_WIDTH_CM  = 280.0  # 2× fullness

    tile_v = ceil(CURTAIN_HEIGHT_CM / fabric.real_world_cm)
    tile_h = ceil(CURTAIN_WIDTH_CM  / fabric.real_world_cm)

    log.info(
        f'[pattern]  {fabric.sku}  design={fabric.design_swatch_path.parent.name}  '
        f'real_world_cm={fabric.real_world_cm}  '
        f'tiles={tile_h}h × {tile_v}v  total={tile_h * tile_v}'
    )

    swatch = np.array(Image.open(fabric.design_swatch_path).convert('RGB'))
    tiled  = np.tile(swatch, (tile_v, tile_h, 1))
    log.debug(f'[pattern]  swatch={swatch.shape[1]}×{swatch.shape[0]}  tiled={tiled.shape[1]}×{tiled.shape[0]}')

    h, w = room.template.shape[:2]

    # Find curtain bounding box from mask
    ys, xs = np.where(room.mask > 0.1)
    if len(ys) == 0:
        log.warning('[pattern] Empty mask — returning blank canvas')
        return np.zeros((h, w, 3), dtype=np.uint8)

    y0, x0, y1, x1 = int(ys.min()), int(xs.min()), int(ys.max()), int(xs.max())
    bw, bh = x1 - x0, y1 - y0

    # Resize tiled texture to curtain bounding box
    resized = np.array(
        Image.fromarray(tiled.astype(np.uint8)).resize((bw, bh), Image.LANCZOS)
    )
    log.debug(f'[pattern]  curtain_bbox=({x0},{y0})→({x1},{y1})  resized_to={bw}×{bh}')

    # Place in full-frame canvas
    canvas = np.zeros((h, w, 3), dtype=np.uint8)
    canvas[y0:y1, x0:x1] = resized

    # Multiply with fold map for depth shading
    fold3    = np.stack([fold_map * 2.0] * 3, axis=2)
    textured = np.clip(canvas.astype(np.float32) * fold3, 0, 255).astype(np.uint8)

    fm_vals = fold_map[room.mask > 0.5]
    log.debug(
        f'[pattern]  fold_multiply: min={fm_vals.min():.3f} max={fm_vals.max():.3f} '
        f'mean={fm_vals.mean():.3f}'
    )
    return textured


def composite_into_room(
    template: np.ndarray,
    curtain_layer: np.ndarray,
    mask: np.ndarray,
    feather_radius: int = 3,
) -> np.ndarray:
    """Alpha-composite the recolored curtain back into the room.

    Feathers mask edges to avoid hard seams.
    Returns H×W×3 uint8.
    """
    mask_img = Image.fromarray((mask * 255).astype(np.uint8))
    mask_feathered = np.array(
        mask_img.filter(ImageFilter.GaussianBlur(radius=feather_radius))
    ).astype(np.float32) / 255.0

    mask3f = mask_feathered[:, :, np.newaxis]
    composite = (
        curtain_layer.astype(np.float32) * mask3f
        + template.astype(np.float32) * (1.0 - mask3f)
    )
    result = np.clip(composite, 0, 255).astype(np.uint8)

    seam_px = int(np.sum((mask_feathered > 0.05) & (mask_feathered < 0.95)))
    log.debug(
        f'[composite]  feather_radius={feather_radius}  '
        f'seam_pixels={seam_px:,}  output={result.shape[1]}×{result.shape[0]}'
    )
    return result


# ── Top-level Stage 1 runner ──────────────────────────────────────────────────

def run_stage1(
    sku: str,
    room_id: str,
    assets_dir: Path = ASSETS_DIR,
    templates_dir: Path = TEMPLATES_DIR,
    out_dir: Path = ASSETS_DIR,
    save_stage1_copy: bool = True,
) -> Path:
    """Run the full Stage 1 recoloring pipeline for one SKU × room pair.

    Returns the path to the saved output JPEG.
    """
    t0 = time.time()
    log.info(f'[stage1] START  sku={sku}  room={room_id}')

    fabric = load_fabric_spec(sku, assets_dir)
    room   = load_room_config(room_id, templates_dir)

    fold_map = extract_fold_map(room)
    fold_map = neutralize_fold_map(fold_map, room.existing_color, room.mask)

    if fabric.appearance == 'DESENLİ' and fabric.design_swatch_path:
        curtain = apply_pattern_texture(room, fabric, fold_map)
        curtain = composite_into_room(room.template, curtain, room.mask)
    elif fabric.transparency_class == 'sheer':
        curtain = apply_sheer_blend(
            fold_map, fabric.dominant_color, room.mask,
            room.template, fabric.transparency_pct,
        )
    else:
        curtain = apply_solid_color(fold_map, fabric.dominant_color, room.mask)
        curtain = composite_into_room(room.template, curtain, room.mask)

    # Handle double-layer room (room-03): apply sheer over opaque
    if room.curtain_type == 'double' and room.sheer_mask is not None:
        sheer_fold = extract_fold_map(
            RoomConfig(
                room_id=room_id,
                template=room.template,
                mask=room.sheer_mask,
                existing_color=room.existing_color,
                curtain_type='sheer',
                window_region=room.window_region,
            )
        )
        sheer_fold = neutralize_fold_map(sheer_fold, room.existing_color, room.sheer_mask)
        sheer_layer = apply_sheer_blend(
            sheer_fold, fabric.dominant_color, room.sheer_mask,
            curtain, fabric.transparency_pct,
        )
        curtain = sheer_layer
        log.info(f'[stage1] Double layer: opaque + sheer composited')

    # Save output
    out_path = out_dir / sku / 'rooms' / f'{room_id}-stage1.jpg'
    out_path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(curtain).save(out_path, 'JPEG', quality=92)

    elapsed = time.time() - t0
    log.info(
        f'[stage1] DONE   sku={sku}  room={room_id}  '
        f'time={elapsed:.2f}s  out={out_path}'
    )
    return out_path


# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    setup_logging(logging.INFO)

    parser = argparse.ArgumentParser(description='Stage 1 PIL recoloring pipeline')
    parser.add_argument('--sku',    required=True, help='e.g. BLK-001')
    parser.add_argument('--room',   required=True, help='e.g. room-04')
    parser.add_argument('--debug',  action='store_true')
    parser.add_argument('--save-stage1', action='store_true', default=True)
    args = parser.parse_args()

    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)

    try:
        out = run_stage1(args.sku, args.room)
        print(f'Output: {out}')
    except MaskNotFoundError as e:
        print(f'ERROR: {e}')
        raise SystemExit(1)
    except FabricLoadError as e:
        print(f'ERROR: {e}')
        raise SystemExit(1)


if __name__ == '__main__':
    main()
