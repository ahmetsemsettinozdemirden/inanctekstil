"""
Generate a room visualisation for one fabric variant.

Usage:
  python generate.py --sku BLK-073 --out /tmp/out
  python generate.py --sku BLK-075 --out /tmp/out --model pro --seed 12345 --dry-run

Models:
  2   fal-ai/nano-banana-2/edit    (default) supports thinking_level
  pro fal-ai/nano-banana-pro/edit  no thinking_level param

Inputs (resolved automatically):
  swatch-assets/{sku}/texture-512.jpg
  swatch-assets/{sku}/meta.json
  swatch-assets/designs/{DESIGN}/room-without-blackout.png
  swatch-assets/designs/{DESIGN}/room-with-blackout.png

Output:
  {out}/{sku}.jpg
"""
import argparse
import io
import json
import sys
from pathlib import Path

import fal_client
import requests
from dotenv import load_dotenv
from PIL import Image

load_dotenv(Path(__file__).parent / '.env')

CATALOG_DIR = Path(__file__).parent.parent
SWATCH_DIR  = CATALOG_DIR / 'swatch-assets'
OUTPUT_DIR  = CATALOG_DIR / 'output'

MODELS = {
    '2':   'fal-ai/nano-banana-2/edit',
    'pro': 'fal-ai/nano-banana-pro/edit',
}


def load_meta(sku: str) -> dict:
    if not (sku.startswith('BLK-') or sku.startswith('FON-')):
        sys.exit(f'Only BLK-* and FON-* SKUs are supported, got: {sku}')
    path = SWATCH_DIR / sku / 'meta.json'
    if not path.exists():
        sys.exit(f'meta.json not found: {path}')
    meta = json.loads(path.read_text())

    design_folder = meta['design'].replace('%', 'pct').replace(' ', '_')
    design_meta_path = SWATCH_DIR / 'designs' / design_folder / 'meta.json'
    if design_meta_path.exists():
        meta['_design'] = json.loads(design_meta_path.read_text())
    else:
        meta['_design'] = {}

    design_dir = SWATCH_DIR / 'designs' / design_folder
    room_clean = design_dir / 'room-without-blackout.png'
    room_ref   = design_dir / 'room-with-blackout.png'
    if not room_clean.exists():
        sys.exit(f'room-without-blackout.png not found for design: {design_folder}')
    if not room_ref.exists():
        sys.exit(f'room-with-blackout.png not found for design: {design_folder}')
    meta['_room_clean'] = room_clean
    meta['_room_ref']   = room_ref

    return meta


def build_prompt(meta: dict) -> str:
    colors = ', '.join(meta['thread_colors'][:2])

    transparency_pct = meta.get('transparency_pct')
    transparency_class = meta.get('transparency_class', 'opaque')
    if transparency_pct is not None:
        opaque_pct = round((1 - transparency_pct) * 100)
        if transparency_class == 'blackout':
            opacity = f'{opaque_pct}% opaque blackout, blocks all light'
        else:
            opacity = f'{opaque_pct}% opaque'
    else:
        opacity = 'fully opaque'

    appearance = meta.get('appearance')
    if appearance == 'DESENLİ':
        pattern = 'woven jacquard pattern visible on the surface'
    elif appearance == 'DÜZ':
        pattern = 'smooth, plain weave with no visible pattern'
    else:
        pattern = 'solid fabric'

    real_world_cm = meta.get('_design', {}).get('real_world_cm')
    scale = (
        f'The third image shows a {real_world_cm}cm × {real_world_cm}cm section of the actual fabric. '
        if real_world_cm else ''
    )

    return (
        f'The first image shows a room without curtains. '
        f'The second image shows the same room with curtains already hanging. '
        f'Replace the curtain texture in the second image with the fabric shown in the third image. '
        f'{scale}'
        f'The replacement fabric is {colors}, {opacity}, {pattern}. '
        f'Keep the curtain shape, folds, and drape exactly as they appear in the second image. '
        f'Do not change anything else: walls, floor, furniture, lighting.'
    )


def upload(path: Path) -> str:
    buf = io.BytesIO()
    Image.open(path).save(buf, format='JPEG')
    url = fal_client.upload(buf.getvalue(), content_type='image/jpeg')
    print(f'  uploaded {path.name} → {url[:60]}…')
    return url


def run(sku: str, out_dir: Path, seed: int, dry_run: bool, model: str = '2') -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)

    meta    = load_meta(sku)
    texture = SWATCH_DIR / sku / 'texture-512.jpg'
    if not texture.exists():
        sys.exit(f'texture not found: {texture}')

    prompt = build_prompt(meta)
    print(f'SKU:    {sku}')
    print(f'Prompt: {prompt}\n')

    if dry_run:
        print('DRY RUN — skipping API call')
        out_path = out_dir / f'{sku}.jpg'
        Image.open(meta['_room_ref']).save(out_path, 'JPEG')
        return out_path

    print('Uploading images…')
    urls = [upload(meta['_room_clean']), upload(meta['_room_ref']), upload(texture)]

    model_id = MODELS[model]
    args = {
        'prompt':           prompt,
        'image_urls':       urls,
        'seed':             seed,
        'resolution':       '2K',
        'aspect_ratio':     '9:16',
        'num_images':       1,
        'output_format':    'jpeg',
        'safety_tolerance': '6',
    }
    if model == '2':
        args['thinking_level'] = 'minimal'

    print(f'\nCalling {model_id}…')
    result = fal_client.run(model_id, arguments=args)

    image_url = result['images'][0]['url']
    print(f'Result: {image_url[:80]}…')

    resp = requests.get(image_url, timeout=60)
    resp.raise_for_status()

    out_path = out_dir / f'{sku}.jpg'
    out_path.write_bytes(resp.content)
    print(f'Saved:  {out_path}')
    return out_path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--sku',     required=True)
    parser.add_argument('--out',     type=Path, default=OUTPUT_DIR)
    parser.add_argument('--model',   choices=['2', 'pro'], default='2')
    parser.add_argument('--seed',    type=int, default=42817)
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()

    run(args.sku, args.out, args.seed, args.dry_run, args.model)


if __name__ == '__main__':
    main()
