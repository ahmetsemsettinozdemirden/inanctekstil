"""
Upload texture-512.jpg per variant to Shopify, linked via variant_ids.

For each BLK-* and FON-* Shopify product:
  - Deletes all existing product images
  - Uploads swatch-assets/{SKU}/texture-512.jpg for each variant with:
      alt        = variant title (colour code)
      variant_ids = [variant_id]
  - Appends room.jpg (shared, no variant link) if found for any variant

Usage:
  python upload_variant_textures.py
  python upload_variant_textures.py --dry-run
"""
import argparse
import base64
import requests
from pathlib import Path

CATALOG_DIR   = Path(__file__).parent.parent
SWATCH_DIR    = CATALOG_DIR / 'swatch-assets'

SHOPIFY_DOMAIN = 'inanc-tekstil.myshopify.com'
SHOPIFY_TOKEN  = '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'
API_VERSION    = '2025-01'
HEADERS        = {
    'X-Shopify-Access-Token': SHOPIFY_TOKEN,
    'Content-Type': 'application/json',
}


def api_get(path: str) -> dict:
    resp = requests.get(f'https://{SHOPIFY_DOMAIN}/admin/api/{API_VERSION}{path}', headers=HEADERS)
    resp.raise_for_status()
    return resp.json()


def api_post(path: str, payload: dict) -> dict:
    resp = requests.post(f'https://{SHOPIFY_DOMAIN}/admin/api/{API_VERSION}{path}', headers=HEADERS, json=payload)
    resp.raise_for_status()
    return resp.json()


def api_delete(path: str) -> None:
    requests.delete(f'https://{SHOPIFY_DOMAIN}/admin/api/{API_VERSION}{path}', headers=HEADERS)


def upload_image(product_id: int, image_path: Path, alt: str | None = None,
                 variant_ids: list | None = None, position: int | None = None) -> dict:
    attachment = base64.b64encode(image_path.read_bytes()).decode()
    payload: dict = {'attachment': attachment, 'filename': image_path.name}
    if alt is not None:
        payload['alt'] = alt
    if variant_ids:
        payload['variant_ids'] = variant_ids
    if position is not None:
        payload['position'] = position
    return api_post(f'/products/{product_id}/images.json', {'image': payload})['image']


def get_all_blk_fon_products() -> list:
    data = api_get('/products.json?limit=250')
    return [
        p for p in data['products']
        if any(v['sku'].startswith(('BLK-', 'FON-')) for v in p['variants'])
    ]


def process_product(product: dict, dry_run: bool) -> None:
    pid      = product['id']
    title    = product['title']
    variants = product['variants']

    print(f'\n{title} (id={pid}, {len(variants)} variants)')

    # Find room.jpg: use first variant whose SKU has one
    room_jpg = None
    for v in variants:
        candidate = SWATCH_DIR / v['sku'] / 'room.jpg'
        if candidate.exists():
            room_jpg = candidate
            break

    # Collect variants that have a texture
    to_upload = []
    missing   = []
    for v in variants:
        tex = SWATCH_DIR / v['sku'] / 'texture-512.jpg'
        if tex.exists():
            to_upload.append((v, tex))
        else:
            missing.append(v['sku'])

    if missing:
        print(f'  WARN missing texture for: {", ".join(missing)}')

    if dry_run:
        print(f'  DRY-RUN: would upload {len(to_upload)} textures + {"1 room" if room_jpg else "no room"}')
        return

    # Delete all existing images
    existing = api_get(f'/products/{pid}/images.json').get('images', [])
    for img in existing:
        api_delete(f'/products/{pid}/images/{img["id"]}.json')
    print(f'  deleted {len(existing)} existing images')

    # Upload per-variant textures
    for pos, (v, tex) in enumerate(to_upload, start=1):
        img = upload_image(pid, tex, alt=v['title'], variant_ids=[v['id']], position=pos)
        print(f'  {v["sku"]} ({v["title"]}) → image {img["id"]}')

    # Upload shared room.jpg if available
    if room_jpg:
        img = upload_image(pid, room_jpg, position=len(to_upload) + 1)
        print(f'  room.jpg ({room_jpg.parent.name}) → image {img["id"]}')


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()

    products = get_all_blk_fon_products()
    print(f'Found {len(products)} BLK/FON products')

    for product in products:
        process_product(product, args.dry_run)

    print('\nDone.')


if __name__ == '__main__':
    main()
