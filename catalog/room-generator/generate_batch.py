"""
Generate room images for all BLK/FON SKUs that don't yet have room.jpg.

Usage:
  python generate_batch.py              # generates all missing
  python generate_batch.py --dry-run    # shows what would run
  python generate_batch.py --model pro  # override model (default: pro)
"""
import argparse
import subprocess
import sys
from pathlib import Path

CATALOG_DIR = Path(__file__).parent.parent
SWATCH_DIR  = CATALOG_DIR / 'swatch-assets'
OUTPUT_DIR  = CATALOG_DIR / 'output'


def get_remaining_skus() -> list[str]:
    all_skus = sorted(
        p.parent.name
        for p in SWATCH_DIR.glob('*/meta.json')
        if p.parent.name.startswith(('BLK-', 'FON-'))
    )
    return [sku for sku in all_skus if not (SWATCH_DIR / sku / 'room.jpg').exists()]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', choices=['2', 'pro'], default='pro')
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()

    skus = get_remaining_skus()
    print(f'{len(skus)} SKUs to generate (model={args.model})\n')

    ok, failed = 0, []

    for i, sku in enumerate(skus, 1):
        print(f'[{i}/{len(skus)}] {sku}', flush=True)
        if args.dry_run:
            continue

        result = subprocess.run(
            [sys.executable, 'generate.py', '--sku', sku, '--model', args.model],
            capture_output=False,
        )

        if result.returncode != 0:
            print(f'  FAILED {sku}')
            failed.append(sku)
            continue

        # Copy to swatch-assets
        out_jpg = OUTPUT_DIR / f'{sku}.jpg'
        room_jpg = SWATCH_DIR / sku / 'room.jpg'
        if out_jpg.exists():
            room_jpg.write_bytes(out_jpg.read_bytes())
            print(f'  copied → {room_jpg}')
            ok += 1

    print(f'\nDone. OK={ok} failed={len(failed)}')
    if failed:
        print('Failed SKUs:', ' '.join(failed))


if __name__ == '__main__':
    main()
