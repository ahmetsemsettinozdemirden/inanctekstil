from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path


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
