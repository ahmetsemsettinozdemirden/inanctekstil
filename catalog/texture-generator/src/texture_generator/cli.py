from __future__ import annotations

import argparse
from pathlib import Path

from texture_generator.pipeline import discover_skus, run_all


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Generate texture-512.jpg for all curtain fabric variants "
            "via LAB color transfer."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Dry run — list all SKUs that would be processed
  texture-generator catalog/swatch-assets/ --dry-run

  # Generate all textures
  texture-generator catalog/swatch-assets/ --report report.json

  # Re-generate specific SKUs
  texture-generator catalog/swatch-assets/ --sku BLK-001 BLK-013 --force

  # Custom output size
  texture-generator catalog/swatch-assets/ --size 1024
        """,
    )
    parser.add_argument(
        "swatch_assets_dir",
        type=Path,
        help="Path to catalog/swatch-assets/",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Regenerate texture-512.jpg even if it already exists",
    )
    parser.add_argument(
        "--sku",
        nargs="+",
        metavar="SKU",
        help="Only process specific SKUs (e.g. --sku BLK-001 BLK-013)",
    )
    parser.add_argument(
        "--size",
        type=int,
        default=512,
        metavar="PX",
        help="Output size in pixels, default 512",
    )
    parser.add_argument(
        "--report",
        type=Path,
        default=None,
        metavar="PATH",
        help="Write JSON report to this path (sorted by ΔE descending)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Discover SKUs and print plan — no files written",
    )

    args = parser.parse_args()

    if not args.swatch_assets_dir.exists():
        parser.error(f"swatch-assets directory not found: {args.swatch_assets_dir}")

    if args.dry_run:
        entries = discover_skus(args.swatch_assets_dir)
        if args.sku:
            entries = [e for e in entries if e.sku in args.sku]
        print(f"Found {len(entries)} SKUs:\n")
        by_design: dict[str, list[str]] = {}
        for e in entries:
            by_design.setdefault(e.design, []).append(e.sku)
        for design, skus in sorted(by_design.items()):
            print(f"  {design} ({len(skus)} variants)")
            for sku in skus:
                print(f"    {sku}")
        return

    run_all(
        swatch_assets_dir=args.swatch_assets_dir,
        force=args.force,
        sku_filter=args.sku,
        size=args.size,
        report_path=args.report,
    )


if __name__ == "__main__":
    main()
