"""
Stage 2 — fal.ai harmonization pass.

Two modes depending on fabric type:
  - Solid / sheer / opaque  → flux/dev img2img at low strength (0.20–0.25)
    Blends compositing seams, adds micro-texture. Preserves fold geometry.
  - DESENLİ (patterned)     → controlnet-sdxl + IP-Adapter (0.40–0.45)
    Injects fabric surface texture, weave detail, sheen via IP-Adapter.
    ControlNet with Stage 1 output preserves fold structure.

After AI generation a Lab-space color correction pass corrects drift back
toward the target spec color. Triggered when ΔE > LAB_CORRECTION_THRESHOLD.

Async batch: uses fal_client.submit() + handle.get() instead of run_async()
to avoid timeouts when processing 1400+ images. submit_all() dispatches all
jobs concurrently then collects results.

Requires: pip install fal-client requests
Requires: FAL_KEY env variable

Usage:
  python room_visualizer_fal.py --sku BLK-001 --room room-04
  python room_visualizer_fal.py --sku FON-042 --room room-04 --dry-run
  python room_visualizer_fal.py --sku DES-001 --room room-04  # uses IP-Adapter path
"""
import argparse
import asyncio
import base64
import io
import logging
import shutil
import time
from pathlib import Path
from typing import Optional

# ── Paths ─────────────────────────────────────────────────────────────────────

BASE          = Path('/Users/semsettin/workspace/inanc-tekstil/catalog')
ASSETS_DIR    = BASE / 'swatch-assets'
TEMPLATES_DIR = BASE / 'room-templates'

# ── Logging ───────────────────────────────────────────────────────────────────

log = logging.getLogger('room_visualizer_fal')

# ── Configuration ─────────────────────────────────────────────────────────────

# Solid / sheer — low-strength img2img: blends seams, adds micro-texture
FAL_SOLID_MODEL   = 'fal-ai/flux/dev'

# Patterned (DESENLİ) — ControlNet + IP-Adapter: injects weave, drape, sheen
# IP-Adapter scale 0.5–0.7: captures fabric style without destroying geometry
# ControlNet at 0.6: preserves fold structure from Stage 1 output
FAL_PATTERN_MODEL = 'fal-ai/controlnet-sdxl'
IP_ADAPTER_SCALE  = 0.60
CONTROLNET_SCALE  = 0.60

STRENGTH_BY_TYPE = {
    'opaque':  0.20,
    'sheer':   0.25,
    'double':  0.22,
    'pattern': 0.42,   # higher for pattern — more IP-Adapter influence needed
}

# Fixed seeds per room — ensures fold geometry + lighting stay identical
# across all SKU variants for the same room. Only fabric appearance changes.
SEEDS = {
    'room-01': 42,
    'room-02': 137,
    'room-03': 256,
    'room-04': 512,
}

# Lab post-correction: if ΔE between output and target exceeds this,
# apply Lab-space hue shift to pull output color back toward spec.
# 3 = imperceptible, 5 = just noticeable, 10 = clearly different
LAB_CORRECTION_THRESHOLD = 8.0

# ── Color helpers ─────────────────────────────────────────────────────────────

COLOR_NAMES = [
    ((0,   0,   0),    'black'),
    ((255, 255, 255),  'white'),
    ((128, 128, 128),  'grey'),
    ((220, 220, 220),  'light grey'),
    ((64,  64,  64),   'dark grey'),
    ((180, 130, 70),   'beige'),
    ((210, 180, 140),  'light beige'),
    ((245, 245, 220),  'cream'),
    ((139, 69,  19),   'brown'),
    ((101, 67,  33),   'dark brown'),
    ((0,   0,   139),  'dark blue'),
    ((70,  130, 180),  'steel blue'),
    ((135, 206, 235),  'sky blue'),
    ((0,   128, 0),    'green'),
    ((34,  139, 34),   'forest green'),
    ((128, 0,   0),    'dark red'),
    ((220, 20,  60),   'crimson'),
    ((255, 160, 0),    'orange'),
    ((128, 0,   128),  'purple'),
    ((0,   128, 128),  'teal'),
    ((72,  61,  139),  'dark slate blue'),
    ((184, 98,  42),   'terracotta'),
    ((47,  79,  47),   'dark green'),
]


def hex_to_rgb(h: str) -> tuple:
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def hex_to_color_name(rgb: tuple) -> str:
    best_name = 'neutral'
    best_dist = float('inf')
    for ref_rgb, name in COLOR_NAMES:
        dist = sum((a - b) ** 2 for a, b in zip(rgb, ref_rgb)) ** 0.5
        if dist < best_dist:
            best_dist = dist
            best_name = name
    return best_name


# ── Lab post-correction ────────────────────────────────────────────────────────

def _linearize(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _delinearize(c: float) -> float:
    if c <= 0.0031308:
        return 12.92 * c
    return 1.055 * (c ** (1.0 / 2.4)) - 0.055


def rgb_to_lab(rgb: tuple) -> tuple:
    """sRGB (0-255) → CIE L*a*b* (D65)."""
    r, g, b = (_linearize(c / 255.0) for c in rgb)
    x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047
    y = (0.2126729 * r + 0.7151522 * g + 0.0721750 * b) / 1.00000
    z = (0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / 1.08883

    def _f(t: float) -> float:
        return t ** (1.0 / 3.0) if t > 0.008856 else 7.787 * t + 16.0 / 116.0

    fx, fy, fz = _f(x), _f(y), _f(z)
    return (116.0 * fy - 16.0, 500.0 * (fx - fy), 200.0 * (fy - fz))


def delta_e_lab(lab1: tuple, lab2: tuple) -> float:
    return float(sum((a - b) ** 2 for a, b in zip(lab1, lab2)) ** 0.5)


def apply_lab_correction(
    img_arr: 'np.ndarray',
    mask: 'np.ndarray',
    target_rgb: tuple,
) -> 'np.ndarray':
    """Shift mean Lab color of masked region toward target_rgb.

    Computes the Lab offset between current mean and target, then applies
    the offset per-channel within the curtain mask. Preserves luminosity
    structure (fold shading) — only shifts hue and chroma.

    Only applied if ΔE > LAB_CORRECTION_THRESHOLD.
    Returns corrected H×W×3 uint8 array.
    """
    import numpy as np

    curtain_px = img_arr[mask > 0.5]
    if len(curtain_px) == 0:
        return img_arr

    mean_rgb = tuple(curtain_px.reshape(-1, 3).mean(axis=0).astype(int))
    current_lab = rgb_to_lab(mean_rgb)
    target_lab  = rgb_to_lab(target_rgb)
    delta_e     = delta_e_lab(current_lab, target_lab)

    log.debug(
        f'[lab_correction]  current={mean_rgb}  target={target_rgb}  '
        f'ΔE={delta_e:.2f}  threshold={LAB_CORRECTION_THRESHOLD}'
    )

    if delta_e <= LAB_CORRECTION_THRESHOLD:
        log.debug(f'[lab_correction]  ΔE={delta_e:.2f} ≤ threshold — skipping correction')
        return img_arr

    log.info(
        f'[lab_correction]  ΔE={delta_e:.2f} > threshold — applying Lab correction  '
        f'{mean_rgb} → {target_rgb}'
    )

    # Compute RGB shift needed: approximate by scaling per-channel
    # More robust than Lab-space transforms for uint8 images
    result = img_arr.copy().astype(np.float32)
    mask3  = mask[:, :, np.newaxis]

    for ch in range(3):
        current_mean = curtain_px[:, ch].mean()
        target_val   = float(target_rgb[ch])
        if current_mean > 1.0:
            scale = target_val / current_mean
            # Apply scale only within mask, clamp to [0.3, 3.0] to prevent blowout
            scale  = max(0.3, min(3.0, scale))
            shifted = result[:, :, ch] * (1.0 + (scale - 1.0) * mask[:, :])
            result[:, :, ch] = np.clip(shifted, 0, 255)

    corrected = np.clip(result, 0, 255).astype(np.uint8)

    # Measure result
    new_px  = corrected[mask > 0.5]
    new_mean = tuple(new_px.reshape(-1, 3).mean(axis=0).astype(int))
    new_de   = delta_e_lab(rgb_to_lab(new_mean), target_lab)
    log.info(f'[lab_correction]  after correction: ΔE={new_de:.2f}  mean={new_mean}')

    return corrected


# ── Prompt builder ────────────────────────────────────────────────────────────

def build_prompt(dominant_color: tuple, transparency_class: str, appearance: Optional[str]) -> str:
    color_name = hex_to_color_name(dominant_color)
    hex_code   = '#{:02x}{:02x}{:02x}'.format(*dominant_color)

    if transparency_class == 'blackout':
        fabric_desc = f'thick blackout curtain, {color_name} ({hex_code}), opaque, heavy drape'
    elif transparency_class == 'sheer':
        fabric_desc = f'sheer voile curtain, {color_name} tint, translucent, soft light through fabric'
    elif appearance == 'DESENLİ':
        fabric_desc = (
            f'patterned curtain fabric, {color_name} tones, woven textile pattern, '
            f'natural folds, fabric weave visible, rich surface texture'
        )
    else:
        fabric_desc = f'{color_name} curtain ({hex_code}), natural fabric, soft drape'

    prompt = (
        f'interior design photo, {fabric_desc}, '
        f'photorealistic, natural window light, professional photography, '
        f'no artifacts, seamless fabric texture'
    )
    log.info(f'[fal] prompt: "{prompt[:100]}..."')
    return prompt


# ── fal.ai image upload helper ────────────────────────────────────────────────

def _img_to_data_url(path: Path) -> str:
    with open(path, 'rb') as f:
        return 'data:image/jpeg;base64,' + base64.b64encode(f.read()).decode()


def _download_image(url: str) -> 'Image':
    """Download image from fal CDN URL."""
    import requests
    from PIL import Image as PILImage
    data = requests.get(url, timeout=30).content
    return PILImage.open(io.BytesIO(data)).convert('RGB')


# ── Stage 2 — single image ─────────────────────────────────────────────────────

async def run_stage2(
    stage1_path: Path,
    sku: str,
    room_id: str,
    dominant_color: tuple,
    transparency_class: str,
    curtain_type: str,
    appearance: Optional[str],
    out_path: Path,
    mask_path: Optional[Path] = None,
    swatch_path: Optional[Path] = None,
    dry_run: bool = False,
) -> dict:
    """Run Stage 2 harmonization for one image. Returns result dict with metrics.

    For DESENLİ fabrics: uses controlnet-sdxl + IP-Adapter (swatch_path required).
    For solid/sheer/opaque: uses flux/dev img2img at low strength.

    Uses fal_client.submit() → handle.get() instead of run_async() to avoid
    HTTP timeouts during batch processing of 1400+ images.
    """
    import numpy as np
    from PIL import Image as PILImage

    t0 = time.time()
    log.info(f'[stage2] START  sku={sku}  room={room_id}  appearance={appearance}')

    if not stage1_path.exists():
        raise FileNotFoundError(f'Stage 1 output not found: {stage1_path}')

    out_path.parent.mkdir(parents=True, exist_ok=True)

    # ── dry run ───────────────────────────────────────────────────────────────
    if dry_run:
        log.info('[stage2] DRY_RUN — copying stage1 as output')
        shutil.copy(stage1_path, out_path)
        return {'status': 'dry_run', 'elapsed_s': 0.0, 'delta_e': 0.0, 'delta_rgb': 0.0}

    try:
        import fal_client
    except ImportError:
        raise ImportError('Install: pip install fal-client requests')

    is_pattern = appearance == 'DESENLİ' and swatch_path and swatch_path.exists()
    prompt     = build_prompt(dominant_color, transparency_class, appearance)
    seed       = SEEDS.get(room_id, 42)
    strength   = STRENGTH_BY_TYPE.get('pattern' if is_pattern else curtain_type, 0.20)

    # ── DESENLİ path: controlnet-sdxl + IP-Adapter ───────────────────────────
    if is_pattern:
        log.info(
            f'[stage2]  mode=pattern  model={FAL_PATTERN_MODEL}  '
            f'ip_adapter_scale={IP_ADAPTER_SCALE}  controlnet_scale={CONTROLNET_SCALE}  seed={seed}'
        )
        arguments = {
            'prompt':                    prompt,
            'negative_prompt':           'blurry, distorted fabric, wrong color, pixelated pattern, bad drape',
            'image_url':                 _img_to_data_url(stage1_path),   # structure reference
            'controlnet_image_url':      _img_to_data_url(stage1_path),   # fold structure (canny/depth)
            'ip_adapter_image_url':      _img_to_data_url(swatch_path),   # fabric texture injection
            'ip_adapter_scale':          IP_ADAPTER_SCALE,
            'controlnet_conditioning_scale': CONTROLNET_SCALE,
            'strength':                  strength,
            'seed':                      seed,
            'num_inference_steps':       30,
            'guidance_scale':            7.5,
        }
        if mask_path and mask_path.exists():
            arguments['mask_url'] = _img_to_data_url(mask_path)

    # ── Solid / sheer path: flux img2img ─────────────────────────────────────
    else:
        log.info(
            f'[stage2]  mode=solid  model={FAL_SOLID_MODEL}  '
            f'strength={strength}  seed={seed}'
        )
        arguments = {
            'image_url':           _img_to_data_url(stage1_path),
            'prompt':              prompt,
            'strength':            strength,
            'seed':                seed,
            'num_inference_steps': 28,
            'guidance_scale':      3.5,
        }

    # ── Submit → poll (avoids HTTP timeouts in batch) ─────────────────────────
    model = FAL_PATTERN_MODEL if is_pattern else FAL_SOLID_MODEL
    log.debug(f'[stage2] submit: {model}')
    handle = await asyncio.get_event_loop().run_in_executor(
        None,
        lambda: fal_client.submit(model, arguments=arguments),
    )
    log.debug(f'[stage2] submitted, request_id={handle.request_id}')

    # Poll for result (blocking in executor to stay non-blocking in event loop)
    result = await asyncio.get_event_loop().run_in_executor(
        None,
        lambda: handle.get(),
    )

    # ── Download and save ─────────────────────────────────────────────────────
    img_url = result['images'][0]['url']
    img     = _download_image(img_url)
    img_arr = __import__('numpy').array(img)

    # ── Lab post-correction ───────────────────────────────────────────────────
    if mask_path and mask_path.exists():
        mask_arr = __import__('numpy').array(
            PILImage.open(mask_path).convert('L').resize(img.size, PILImage.LANCZOS)
        ).astype(float) / 255.0
        img_arr = apply_lab_correction(img_arr, mask_arr, dominant_color)
        # Measure final accuracy
        curtain_px = img_arr[mask_arr > 0.5]
        if len(curtain_px) > 0:
            mean_out  = tuple(curtain_px.reshape(-1, 3).mean(axis=0).astype(int))
            delta_e   = delta_e_lab(rgb_to_lab(mean_out), rgb_to_lab(dominant_color))
            delta_rgb = float(__import__('numpy').linalg.norm(
                __import__('numpy').array(mean_out, float) - __import__('numpy').array(dominant_color, float)
            ))
        else:
            delta_e = delta_rgb = 0.0
    else:
        delta_e = delta_rgb = 0.0

    PILImage.fromarray(img_arr).save(out_path, 'JPEG', quality=92)

    elapsed = time.time() - t0
    cost_est = strength * (0.04 if is_pattern else 0.025)
    log.info(
        f'[stage2] DONE   sku={sku}  room={room_id}  '
        f'time={elapsed:.2f}s  cost_est=${cost_est:.4f}  '
        f'ΔE={delta_e:.2f}  delta_rgb={delta_rgb:.1f}  out={out_path}'
    )
    return {
        'status':    'ok',
        'elapsed_s': round(elapsed, 3),
        'delta_e':   round(delta_e, 3),
        'delta_rgb': round(delta_rgb, 1),
    }


def run_stage2_sync(
    stage1_path: Path,
    sku: str,
    room_id: str,
    dominant_color: tuple,
    transparency_class: str,
    curtain_type: str,
    appearance: Optional[str],
    out_path: Path,
    mask_path: Optional[Path] = None,
    swatch_path: Optional[Path] = None,
    dry_run: bool = False,
) -> dict:
    return asyncio.run(run_stage2(
        stage1_path, sku, room_id, dominant_color, transparency_class,
        curtain_type, appearance, out_path, mask_path, swatch_path, dry_run,
    ))


# ── Stage 2 — concurrent batch ─────────────────────────────────────────────────

async def run_stage2_batch_async(
    jobs: list[dict],
    dry_run: bool = False,
    concurrency: int = 8,
) -> list[dict]:
    """Submit up to `concurrency` Stage 2 jobs in parallel using asyncio.

    Each job dict must contain:
      stage1_path, sku, room_id, dominant_color, transparency_class,
      curtain_type, appearance, out_path
    Optional: mask_path, swatch_path

    Returns list of result dicts in same order as jobs.
    """
    semaphore = asyncio.Semaphore(concurrency)

    async def _bounded(job: dict) -> dict:
        async with semaphore:
            try:
                return await run_stage2(
                    stage1_path=job['stage1_path'],
                    sku=job['sku'],
                    room_id=job['room_id'],
                    dominant_color=job['dominant_color'],
                    transparency_class=job['transparency_class'],
                    curtain_type=job['curtain_type'],
                    appearance=job.get('appearance'),
                    out_path=job['out_path'],
                    mask_path=job.get('mask_path'),
                    swatch_path=job.get('swatch_path'),
                    dry_run=dry_run,
                )
            except Exception as e:
                import traceback
                log.error(f'[stage2_batch] ERR  {job["sku"]} × {job["room_id"]}: {e}')
                log.debug(traceback.format_exc())
                return {'status': 'error', 'error': str(e), 'elapsed_s': 0.0,
                        'delta_e': 0.0, 'delta_rgb': 0.0,
                        'sku': job['sku'], 'room_id': job['room_id']}

    tasks = [_bounded(job) for job in jobs]
    log.info(f'[stage2_batch] Submitting {len(tasks)} jobs (concurrency={concurrency})')
    results = await asyncio.gather(*tasks)
    ok  = sum(1 for r in results if r.get('status') == 'ok')
    err = sum(1 for r in results if r.get('status') == 'error')
    log.info(f'[stage2_batch] Complete: {ok} ok, {err} errors / {len(tasks)} total')
    return list(results)


# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    logging.basicConfig(level=logging.INFO, format='%(asctime)s  %(message)s', datefmt='%H:%M:%S')

    parser = argparse.ArgumentParser(description='Stage 2 fal.ai harmonization')
    parser.add_argument('--sku',       required=True)
    parser.add_argument('--room',      required=True)
    parser.add_argument('--dry-run',   action='store_true')
    parser.add_argument('--debug',     action='store_true')
    args = parser.parse_args()

    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)

    from room_visualizer import load_fabric_spec, load_room_config, FabricLoadError

    try:
        fabric = load_fabric_spec(args.sku, ASSETS_DIR)
        room   = load_room_config(args.room, TEMPLATES_DIR)
    except FabricLoadError as e:
        print(f'ERROR: {e}')
        raise SystemExit(1)

    stage1_path = ASSETS_DIR / args.sku / 'rooms' / f'{args.room}-stage1.jpg'
    out_path    = ASSETS_DIR / args.sku / 'rooms' / f'{args.room}.jpg'
    mask_path   = TEMPLATES_DIR / f'{args.room}-mask.png'
    swatch_path = fabric.design_swatch_path

    result = run_stage2_sync(
        stage1_path=stage1_path,
        sku=fabric.sku,
        room_id=args.room,
        dominant_color=fabric.dominant_color,
        transparency_class=fabric.transparency_class,
        curtain_type=room.curtain_type,
        appearance=fabric.appearance,
        out_path=out_path,
        mask_path=mask_path if mask_path.exists() else None,
        swatch_path=swatch_path,
        dry_run=args.dry_run,
    )
    print(f'Output: {out_path}  ΔE={result["delta_e"]}')


if __name__ == '__main__':
    main()
