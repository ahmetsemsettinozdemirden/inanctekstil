from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

import cv2
import numpy as np

from texture_generator.lab_transfer import (
    center_crop_square,
    delta_e_dominant,
    lab_transfer,
)


def design_name_to_folder(design_name: str) -> str:
    """Convert meta.json `design` field to designs/ subdirectory name.

    Rules:
      - "%" → "pct"   ("%100 BLACKOUT" → "pct100_BLACKOUT")
      - " " → "_"
      Turkish characters (Ü, Ğ, etc.) are preserved unchanged.
    """
    return design_name.replace("%", "pct").replace(" ", "_")


@dataclass
class SwatchEntry:
    sku: str
    design: str
    design_folder: str
    design_swatch_path: Path
    variant_swatch_path: Path
    output_path: Path


def discover_skus(swatch_assets_dir: Path) -> list[SwatchEntry]:
    """
    Walk swatch_assets_dir and return one SwatchEntry per valid SKU.

    A valid SKU directory must have:
      - meta.json with a `design` field
      - swatch.jpg
      - a matching designs/{DESIGN_FOLDER}/swatch.jpg

    Prints WARNING for each SKU that fails validation (missing files).
    Returns entries sorted by SKU name.
    """
    designs_dir = swatch_assets_dir / "designs"
    entries: list[SwatchEntry] = []

    for meta_path in sorted(swatch_assets_dir.glob("*/meta.json")):
        sku_dir = meta_path.parent

        # Skip the designs/ directory itself
        if sku_dir.name == "designs":
            continue

        with open(meta_path) as f:
            meta = json.load(f)

        design_name: str = meta.get("design", "")
        if not design_name:
            print(f"WARNING: no 'design' field in {meta_path}")
            continue

        design_folder = design_name_to_folder(design_name)
        design_swatch = designs_dir / design_folder / "swatch.jpg"
        variant_swatch = sku_dir / "swatch.jpg"
        output_path = sku_dir / "texture-512.jpg"

        if not design_swatch.exists():
            print(f"WARNING: design swatch missing for {sku_dir.name}: {design_swatch}")
            continue
        if not variant_swatch.exists():
            print(f"WARNING: variant swatch missing for {sku_dir.name}")
            continue

        entries.append(
            SwatchEntry(
                sku=sku_dir.name,
                design=design_name,
                design_folder=design_folder,
                design_swatch_path=design_swatch,
                variant_swatch_path=variant_swatch,
                output_path=output_path,
            )
        )

    return entries


def generate_one(
    entry: SwatchEntry,
    force: bool = False,
    size: int = 512,
) -> str:
    """
    Generate texture-{size}.jpg for a single SKU via LAB color transfer.

    Returns:
      "generated" — file written successfully
      "skipped"   — output already exists and force=False
      "failed: <reason>" — could not read a source image
    """
    if entry.output_path.exists() and not force:
        return "skipped"

    design_img = cv2.imread(str(entry.design_swatch_path))
    if design_img is None:
        return f"failed: cannot read {entry.design_swatch_path}"

    variant_img = cv2.imread(str(entry.variant_swatch_path))
    if variant_img is None:
        return f"failed: cannot read {entry.variant_swatch_path}"

    design_img = center_crop_square(design_img)
    variant_img = center_crop_square(variant_img)

    result = lab_transfer(design_img, variant_img)
    result = cv2.resize(result, (size, size), interpolation=cv2.INTER_LANCZOS4)

    entry.output_path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(entry.output_path), result, [cv2.IMWRITE_JPEG_QUALITY, 95])

    return "generated"


def run_all(
    swatch_assets_dir: Path,
    force: bool = False,
    sku_filter: list[str] | None = None,
    size: int = 512,
    report_path: Path | None = None,
) -> dict:
    """
    Generate texture-{size}.jpg for all discoverable SKUs.

    Args:
        swatch_assets_dir: path to catalog/swatch-assets/
        force:             regenerate even if output already exists
        sku_filter:        if set, only process these SKU names
        size:              output image size in pixels (default 512)
        report_path:       if set, write JSON report here

    Returns:
        report dict with keys: generated_at, total, generated, skipped, failed, results
    """
    entries = discover_skus(swatch_assets_dir)

    if sku_filter:
        entries = [e for e in entries if e.sku in sku_filter]

    counts: dict[str, int] = {"generated": 0, "skipped": 0, "failed": 0}
    results = []

    for entry in entries:
        design_img = cv2.imread(str(entry.design_swatch_path))
        variant_img = cv2.imread(str(entry.variant_swatch_path))
        de = delta_e_dominant(design_img, variant_img) if (design_img is not None and variant_img is not None) else -1.0

        status = generate_one(entry, force=force, size=size)
        key = status.split(":")[0]
        counts[key] = counts.get(key, 0) + 1

        flag = " *** HIGH ΔE — review recommended" if de > 40 else ""
        print(f"  [{status:12s}] {entry.sku:12s}  ΔE={de:5.1f}  ({entry.design}){flag}")

        results.append({
            "sku": entry.sku,
            "design": entry.design,
            "delta_e": round(de, 1),
            "status": status,
            "output": str(entry.output_path.relative_to(swatch_assets_dir.parent)),
        })

    # Sort by ΔE descending — highest transfers first for easy review
    results.sort(key=lambda r: r["delta_e"], reverse=True)

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total": len(entries),
        **counts,
        "results": results,
    }

    if report_path:
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False))
        print(f"\nReport saved to {report_path}")

    print(
        f"\nDone: {counts['generated']} generated, "
        f"{counts['skipped']} skipped, "
        f"{counts.get('failed', 0)} failed"
    )
    return report
