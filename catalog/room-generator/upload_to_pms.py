"""
Upload generated room images to PMS server.

Converts catalog/output/{SKU}.jpg → WebP, SCPs to server,
then upserts a record in the generated_images table.

Usage:
  python upload_to_pms.py BLK-073 FON-002 ...
  python upload_to_pms.py --all          (uploads every file in catalog/output/)
"""
import argparse
import io
import subprocess
import sys
from pathlib import Path

from PIL import Image

CATALOG_DIR = Path(__file__).parent.parent
OUTPUT_DIR  = CATALOG_DIR / 'output'

SERVER      = 'root@5.75.165.158'
SSH_KEY     = Path.home() / '.ssh' / 'inanctekstil'
REMOTE_BASE = '/opt/products/02-final-katalog-images'
ROOM_ID     = 'generated'


def type_dir(sku: str) -> str:
    prefix = sku.split('-')[0]
    return prefix  # BLK → BLK, FON → FON


def upload(sku: str) -> None:
    jpg = OUTPUT_DIR / f'{sku}.jpg'
    if not jpg.exists():
        print(f'  SKIP {sku} — {jpg} not found')
        return

    # Convert to WebP in memory
    buf = io.BytesIO()
    Image.open(jpg).convert('RGB').save(buf, format='WEBP', quality=90)
    webp_bytes = buf.getvalue()

    tdir      = type_dir(sku)
    remote_dir  = f'{REMOTE_BASE}/{tdir}/{sku}'
    remote_file = f'{remote_dir}/{sku}-room-{ROOM_ID}.webp'
    rel_path    = f'02-final-katalog-images/{tdir}/{sku}/{sku}-room-{ROOM_ID}.webp'

    # Ensure remote directory exists
    subprocess.run(
        ['ssh', '-i', str(SSH_KEY), SERVER, f'mkdir -p {remote_dir}'],
        check=True,
    )

    # SCP the WebP bytes via stdin
    proc = subprocess.run(
        ['ssh', '-i', str(SSH_KEY), SERVER, f'cat > {remote_file}'],
        input=webp_bytes,
        check=True,
    )

    # Upsert DB record
    sql = (
        f"DELETE FROM generated_images WHERE sku = '{sku}' AND image_type = 'lifestyle' AND room_id = '{ROOM_ID}';"
        f"INSERT INTO generated_images (sku, image_type, room_id, file_path) "
        f"VALUES ('{sku}', 'lifestyle', '{ROOM_ID}', '{rel_path}');"
    )
    result = subprocess.run(
        ['ssh', '-i', str(SSH_KEY), SERVER,
         f"docker exec postgres psql -U pms -d pms -c \"{sql}\""],
    )
    if result.returncode != 0:
        print(f'  WARN {sku} — DB insert failed (variant may not exist in PMS), file uploaded anyway')
        return

    print(f'  OK  {sku} → {rel_path}')


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('skus', nargs='*')
    parser.add_argument('--all', action='store_true', help='upload all files in catalog/output/')
    args = parser.parse_args()

    if args.all:
        skus = [p.stem for p in sorted(OUTPUT_DIR.glob('*.jpg'))]
    elif args.skus:
        skus = args.skus
    else:
        parser.print_help()
        sys.exit(1)

    print(f'Uploading {len(skus)} image(s)…')
    for sku in skus:
        upload(sku)
    print('Done.')


if __name__ == '__main__':
    main()
