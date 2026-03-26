"""
Upload per-variant room.jpg to Shopify as secondary images.

For each BLK/FON product, for each variant that has swatch-assets/{SKU}/room.jpg:
  - Uploads it with alt = variant's texture alt (colour code), variant_ids = [variant_id]
  - Skips variants that already have a room image linked
  - Never deletes or modifies any existing images

Usage:
  python upload_variant_rooms.py
  python upload_variant_rooms.py --dry-run
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


def upload_image(product_id: int, image_path: Path, alt: str, variant_ids: list) -> dict:
    attachment = base64.b64encode(image_path.read_bytes()).decode()
    return api_post(f'/products/{product_id}/images.json', {'image': {
        'attachment': attachment,
        'filename': 'room.jpg',
        'alt': alt,
        'variant_ids': variant_ids,
    }})['image']


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

    print(f'\n{title} (id={pid})')

    images = api_get(f'/products/{pid}/images.json')['images']

    # Build variant_id → alt map from existing texture images
    variant_alt: dict[int, str] = {}
    for img in images:
        if img['variant_ids'] and img['alt']:
            for vid in img['variant_ids']:
                variant_alt[vid] = img['alt']

    # Variants that already have a room image linked
    already_done = {
        vid
        for img in images
        if img['variant_ids'] and 'room' in img['src']
        for vid in img['variant_ids']
    }

    # Find variants with room.jpg not yet uploaded
    to_upload = []
    for v in variants:
        if v['id'] in already_done:
            continue
        room = SWATCH_DIR / v['sku'] / 'room.jpg'
        if room.exists():
            alt = variant_alt.get(v['id'], v['title'])
            to_upload.append((v, room, alt))

    print(f'  upload {len(to_upload)} variant room(s)')

    if dry_run:
        for v, room, alt in to_upload:
            print(f'    {v["sku"]} alt={alt!r}')
        return

    # Upload per-variant room images
    for v, room, alt in to_upload:
        img = upload_image(pid, room, alt=alt, variant_ids=[v['id']])
        print(f'  {v["sku"]} ({alt}) → image {img["id"]}')


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
