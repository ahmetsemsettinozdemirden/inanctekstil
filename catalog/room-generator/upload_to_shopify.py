"""
Upload room.jpg images from swatch-assets/{SKU}/ to the corresponding Shopify product.

Reads SKU → Shopify product_id mapping from PMS DB (via SSH), then
POSTs each image to the Shopify product images REST API.

Usage:
  python upload_to_shopify.py BLK-073 FON-002 ...
  python upload_to_shopify.py --all
"""
import argparse
import base64
import json
import subprocess
import sys
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / '.env')

CATALOG_DIR   = Path(__file__).parent.parent
SWATCH_DIR    = CATALOG_DIR / 'swatch-assets'

SHOPIFY_DOMAIN = 'inanc-tekstil.myshopify.com'
SHOPIFY_TOKEN  = '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'
API_VERSION    = '2025-01'
SSH_KEY        = Path.home() / '.ssh' / 'inanctekstil'
SERVER         = 'root@5.75.165.158'


def get_product_id(sku: str) -> str | None:
    """Look up Shopify product_id for a SKU from the PMS DB."""
    sql = (
        f"SELECT sp.product_id FROM variants v "
        f"JOIN designs d ON v.design_id = d.id "
        f"JOIN shopify_products sp ON d.id = sp.design_id "
        f"WHERE v.sku = '{sku}' AND sp.product_id IS NOT NULL LIMIT 1;"
    )
    result = subprocess.run(
        ['ssh', '-i', str(SSH_KEY), SERVER,
         f"docker exec postgres psql -U pms -d pms -t -c \"{sql}\""],
        capture_output=True, text=True,
    )
    line = result.stdout.strip()
    if not line:
        return None
    # line: "gid://shopify/Product/15731513720913"
    return line.split('/')[-1].strip()


def existing_image_ids(product_id: str) -> list[str]:
    """Return IDs of all current product images."""
    url = f'https://{SHOPIFY_DOMAIN}/admin/api/{API_VERSION}/products/{product_id}/images.json'
    resp = requests.get(url, headers={'X-Shopify-Access-Token': SHOPIFY_TOKEN})
    resp.raise_for_status()
    return [str(img['id']) for img in resp.json().get('images', [])]


def delete_image(product_id: str, image_id: str) -> None:
    url = f'https://{SHOPIFY_DOMAIN}/admin/api/{API_VERSION}/products/{product_id}/images/{image_id}.json'
    requests.delete(url, headers={'X-Shopify-Access-Token': SHOPIFY_TOKEN})


def upload_image(product_id: str, image_path: Path, position: int | None = None) -> dict:
    """Upload image as base64 attachment to Shopify product."""
    attachment = base64.b64encode(image_path.read_bytes()).decode()
    url = f'https://{SHOPIFY_DOMAIN}/admin/api/{API_VERSION}/products/{product_id}/images.json'
    payload: dict = {'attachment': attachment, 'filename': image_path.name}
    if position is not None:
        payload['position'] = position
    resp = requests.post(
        url,
        headers={
            'X-Shopify-Access-Token': SHOPIFY_TOKEN,
            'Content-Type': 'application/json',
        },
        json={'image': payload},
    )
    resp.raise_for_status()
    return resp.json()['image']


def process(sku: str) -> None:
    room_jpg = SWATCH_DIR / sku / 'room.jpg'
    if not room_jpg.exists():
        print(f'  SKIP {sku} — room.jpg not found')
        return

    product_id = get_product_id(sku)
    if not product_id:
        print(f'  SKIP {sku} — no Shopify product found')
        return

    texture = SWATCH_DIR / sku / 'texture-512.jpg'
    if not texture.exists():
        print(f'  SKIP {sku} — texture-512.jpg not found')
        return

    # Replace all images: texture first (primary), room second
    for img_id in existing_image_ids(product_id):
        delete_image(product_id, img_id)

    upload_image(product_id, texture, position=1)
    img = upload_image(product_id, room_jpg)
    print(f'  OK  {sku} → product {product_id} → room image {img["id"]} ({img["src"][:60]}…)')


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('skus', nargs='*')
    parser.add_argument('--all', action='store_true')
    args = parser.parse_args()

    if args.all:
        skus = [p.parent.name for p in sorted(SWATCH_DIR.glob('*/room.jpg'))]
    elif args.skus:
        skus = args.skus
    else:
        parser.print_help()
        sys.exit(1)

    print(f'Uploading {len(skus)} image(s) to Shopify…')
    for sku in skus:
        process(sku)
    print('Done.')


if __name__ == '__main__':
    main()
