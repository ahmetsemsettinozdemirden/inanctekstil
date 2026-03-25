# Texture Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Python CLI that reads `catalog/swatch-assets/designs/{DESIGN}/swatch.jpg` as the structure source and `catalog/swatch-assets/{SKU}/swatch.jpg` as the color reference, applies Reinhard LAB color transfer, and saves `catalog/swatch-assets/{SKU}/texture-512.jpg` for every variant.

**Architecture:** Three focused modules — `lab_transfer.py` owns the image math (transfer algorithm, ΔE computation, crop/resize), `pipeline.py` owns file discovery and orchestration (reads meta.json, resolves paths, calls lab_transfer, writes output), `cli.py` is the entry point (argparse, dry-run, per-SKU filter, JSON report). All image I/O uses OpenCV BGR uint8. LAB operations use float32 with OpenCV's native LAB convention (L in [0,100], A/B in [-127,127]).

**Tech Stack:** Python 3.9+, OpenCV (`opencv-python`), NumPy, pytest — same stack as `catalog/swatch-cropper/`.

---

## Background: Key Data Facts

**Design name → folder mapping** (meta.json `design` field → `designs/` subfolder):

| meta.json `design` | Folder name |
|--------------------|-------------|
| `"DARK BLACKOUT"` | `DARK_BLACKOUT` |
| `"HAVUZ BLACKOUT"` | `HAVUZ_BLACKOUT` |
| `"%100 BLACKOUT"` | `pct100_BLACKOUT` |
| `"HERMES BLACKOUT"` | `HERMES_BLACKOUT` |
| `"ENZA"` | `ENZA` |
| `"MONICA"` | `MONICA` |
| `"SULTAN 22260"` | `SULTAN_22260` |
| `"SÜET"` | `SÜET` |
| `"YAĞMUR"` | `YAĞMUR` |

Rule: `replace("%" , "pct").replace(" ", "_")` — preserves Turkish characters.

**Input files (always exist per SKU):**
- `catalog/swatch-assets/{SKU}/swatch.jpg` — variant color reference, 1024×1024 JPEG
- `catalog/swatch-assets/designs/{DESIGN_FOLDER}/swatch.jpg` — design structure reference, square JPEG (size varies)
- `catalog/swatch-assets/{SKU}/meta.json` — contains `"design"` field

**Output:**
- `catalog/swatch-assets/{SKU}/texture-512.jpg` — 512×512 JPEG, quality 95

**Design texture types:**
- Plain/solid (DARK_BLACKOUT, HAVUZ_BLACKOUT, pct100_BLACKOUT, ENZA, MONICA, SÜET, YAĞMUR): single dominant color, fine weave
- Multi-tone woven (HERMES_BLACKOUT): bouclé loop texture with two visible thread colors — LAB transfer maps color distribution proportionally, acceptable result

---

## File Structure

```
catalog/texture-generator/
  pyproject.toml                     new — project config, deps, entry point
  src/
    texture_generator/
      __init__.py                    new — empty
      lab_transfer.py                new — center_crop_square(), lab_transfer(), delta_e_dominant()
      pipeline.py                    new — SwatchEntry dataclass, design_name_to_folder(),
                                           discover_skus(), generate_one(), run_all()
      cli.py                         new — argparse entry point (main())
  tests/
    __init__.py                      new — empty
    test_lab_transfer.py             new — unit tests for all lab_transfer.py functions
    test_pipeline.py                 new — unit tests for pipeline discovery and mapping
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `catalog/texture-generator/pyproject.toml`
- Create: `catalog/texture-generator/src/texture_generator/__init__.py`
- Create: `catalog/texture-generator/tests/__init__.py`

- [ ] **Step 1.1: Create the pyproject.toml**

```toml
[project]
name = "texture-generator"
version = "0.1.0"
description = "LAB color transfer texture generator for curtain fabric variants"
requires-python = ">=3.9"
dependencies = [
    "opencv-python>=4.8.0",
    "numpy>=1.24.0",
]

[project.scripts]
texture-generator = "texture_generator.cli:main"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/texture_generator"]

[tool.pytest.ini_options]
testpaths = ["tests"]
```

- [ ] **Step 1.2: Create empty `__init__.py` files**

```bash
mkdir -p catalog/texture-generator/src/texture_generator
mkdir -p catalog/texture-generator/tests
touch catalog/texture-generator/src/texture_generator/__init__.py
touch catalog/texture-generator/tests/__init__.py
```

- [ ] **Step 1.3: Install the project in dev mode**

```bash
cd catalog/texture-generator
uv venv
uv pip install -e ".[dev]" 2>/dev/null || uv pip install -e .
uv pip install pytest
```

- [ ] **Step 1.4: Verify pytest runs (empty suite)**

```bash
cd catalog/texture-generator
uv run pytest -v
```

Expected output: `no tests ran` or `0 passed`

- [ ] **Step 1.5: Commit scaffold**

```bash
git add catalog/texture-generator/
git commit -m "feat(texture-generator): scaffold project"
```

---

## Task 2: LAB Transfer Core

**Files:**
- Create: `catalog/texture-generator/src/texture_generator/lab_transfer.py`
- Create: `catalog/texture-generator/tests/test_lab_transfer.py`

### 2a: center_crop_square

- [ ] **Step 2a.1: Write the failing tests**

`catalog/texture-generator/tests/test_lab_transfer.py`:

```python
import numpy as np
import pytest
from texture_generator.lab_transfer import center_crop_square


class TestCenterCropSquare:
    def test_square_image_unchanged(self):
        img = np.zeros((64, 64, 3), dtype=np.uint8)
        out = center_crop_square(img)
        assert out.shape == (64, 64, 3)

    def test_wide_image_crops_height(self):
        img = np.zeros((64, 100, 3), dtype=np.uint8)
        out = center_crop_square(img)
        assert out.shape == (64, 64, 3)

    def test_tall_image_crops_width(self):
        img = np.zeros((100, 64, 3), dtype=np.uint8)
        out = center_crop_square(img)
        assert out.shape == (64, 64, 3)

    def test_crop_takes_center(self):
        """Center column of a wide image should appear at the center of output."""
        img = np.zeros((8, 16, 3), dtype=np.uint8)
        img[:, 4:12] = 255  # center 8 columns are white
        out = center_crop_square(img)
        # Output should be all white (we cropped to the center 8 cols)
        assert out.min() == 255
```

- [ ] **Step 2a.2: Run tests — expect ImportError/FAIL**

```bash
cd catalog/texture-generator
uv run pytest tests/test_lab_transfer.py::TestCenterCropSquare -v
```

Expected: `ImportError: cannot import name 'center_crop_square'`

- [ ] **Step 2a.3: Implement `center_crop_square`**

`catalog/texture-generator/src/texture_generator/lab_transfer.py`:

```python
import cv2
import numpy as np


def center_crop_square(img: np.ndarray) -> np.ndarray:
    """Crop image to largest centered square."""
    h, w = img.shape[:2]
    size = min(h, w)
    y = (h - size) // 2
    x = (w - size) // 2
    return img[y : y + size, x : x + size]
```

- [ ] **Step 2a.4: Run tests — expect PASS**

```bash
cd catalog/texture-generator
uv run pytest tests/test_lab_transfer.py::TestCenterCropSquare -v
```

Expected: `4 passed`

---

### 2b: lab_transfer

- [ ] **Step 2b.1: Add failing tests for lab_transfer**

Append to `catalog/texture-generator/tests/test_lab_transfer.py`:

```python
from texture_generator.lab_transfer import lab_transfer


def make_solid(bgr: tuple, size: int = 16) -> np.ndarray:
    img = np.zeros((size, size, 3), dtype=np.uint8)
    img[:] = bgr
    return img


class TestLabTransfer:
    def test_output_shape_matches_design(self):
        design = make_solid((200, 50, 50))
        variant = make_solid((50, 200, 50))
        result = lab_transfer(design, variant)
        assert result.shape == design.shape

    def test_output_dtype_is_uint8(self):
        design = make_solid((200, 50, 50))
        variant = make_solid((50, 200, 50))
        result = lab_transfer(design, variant)
        assert result.dtype == np.uint8

    def test_pixel_values_in_valid_range(self):
        design = make_solid((220, 30, 10))
        variant = make_solid((10, 30, 220))
        result = lab_transfer(design, variant)
        assert int(result.min()) >= 0
        assert int(result.max()) <= 255

    def test_solid_design_takes_variant_color(self):
        """Solid design recolored to solid variant: output mean ~ variant mean."""
        design = make_solid((180, 60, 60))   # blue-ish BGR
        variant = make_solid((60, 60, 180))  # red-ish BGR
        result = lab_transfer(design, variant)
        for ch in range(3):
            diff = abs(int(result[:, :, ch].mean()) - int(variant[:, :, ch].mean()))
            assert diff < 20, f"Channel {ch}: result mean {result[:,:,ch].mean():.1f} vs variant {variant[:,:,ch].mean():.1f}"

    def test_same_color_is_identity(self):
        """Transferring the same color produces nearly identical output."""
        color = (100, 150, 200)
        design = make_solid(color, 32)
        variant = make_solid(color, 32)
        result = lab_transfer(design, variant)
        diff = np.abs(result.astype(int) - design.astype(int))
        assert int(diff.max()) < 5

    def test_texture_structure_preserved(self):
        """High-contrast design: local contrast should survive transfer."""
        # Design: alternating dark/light rows
        design = np.zeros((32, 32, 3), dtype=np.uint8)
        design[::2] = 200  # even rows bright
        design[1::2] = 50  # odd rows dark
        variant = make_solid((60, 120, 60), 32)  # uniform green

        result = lab_transfer(design, variant)
        # Rows should still have different brightness after transfer
        even_mean = result[::2].mean()
        odd_mean = result[1::2].mean()
        assert abs(float(even_mean) - float(odd_mean)) > 10
```

- [ ] **Step 2b.2: Run tests — expect ImportError/FAIL**

```bash
cd catalog/texture-generator
uv run pytest tests/test_lab_transfer.py::TestLabTransfer -v
```

Expected: `ImportError: cannot import name 'lab_transfer'`

- [ ] **Step 2b.3: Implement `lab_transfer`**

Append to `catalog/texture-generator/src/texture_generator/lab_transfer.py`:

```python
def lab_transfer(design: np.ndarray, variant: np.ndarray) -> np.ndarray:
    """
    Reinhard et al. LAB color transfer.
    Transfers color statistics of `variant` onto the structure of `design`.

    Args:
        design:  BGR uint8 ndarray — structure source (will be recolored)
        variant: BGR uint8 ndarray — color source

    Returns:
        BGR uint8 ndarray — design structure with variant color statistics applied
    """
    design_f = design.astype(np.float32) / 255.0
    variant_f = variant.astype(np.float32) / 255.0

    design_lab = cv2.cvtColor(design_f, cv2.COLOR_BGR2LAB)
    variant_lab = cv2.cvtColor(variant_f, cv2.COLOR_BGR2LAB)

    result = design_lab.copy()

    for ch in range(3):
        d_mean = float(design_lab[:, :, ch].mean())
        d_std = float(design_lab[:, :, ch].std())
        v_mean = float(variant_lab[:, :, ch].mean())
        v_std = float(variant_lab[:, :, ch].std())

        if d_std < 1e-6:
            result[:, :, ch] = v_mean
        else:
            result[:, :, ch] = (
                (design_lab[:, :, ch] - d_mean) * (v_std / d_std) + v_mean
            )

    # Clip to valid OpenCV float32 LAB ranges
    result[:, :, 0] = np.clip(result[:, :, 0], 0.0, 100.0)    # L: [0, 100]
    result[:, :, 1] = np.clip(result[:, :, 1], -127.0, 127.0)  # A: [-127, 127]
    result[:, :, 2] = np.clip(result[:, :, 2], -127.0, 127.0)  # B: [-127, 127]

    output_f = cv2.cvtColor(result, cv2.COLOR_LAB2BGR)
    return np.clip(output_f * 255.0, 0, 255).astype(np.uint8)
```

- [ ] **Step 2b.4: Run tests — expect PASS**

```bash
cd catalog/texture-generator
uv run pytest tests/test_lab_transfer.py::TestLabTransfer -v
```

Expected: `6 passed`

---

### 2c: delta_e_dominant

- [ ] **Step 2c.1: Add failing tests for delta_e_dominant**

Append to `catalog/texture-generator/tests/test_lab_transfer.py`:

```python
from texture_generator.lab_transfer import delta_e_dominant


class TestDeltaEDominant:
    def test_same_image_is_near_zero(self):
        img = make_solid((100, 150, 200))
        de = delta_e_dominant(img, img)
        assert de < 0.5

    def test_black_vs_white_is_large(self):
        black = make_solid((0, 0, 0))
        white = make_solid((255, 255, 255))
        de = delta_e_dominant(black, white)
        assert de > 50

    def test_similar_colors_have_small_delta_e(self):
        img1 = make_solid((100, 100, 100))
        img2 = make_solid((110, 110, 110))
        de = delta_e_dominant(img1, img2)
        assert de < 10

    def test_returns_float(self):
        img = make_solid((100, 100, 100))
        assert isinstance(delta_e_dominant(img, img), float)
```

- [ ] **Step 2c.2: Run tests — expect ImportError/FAIL**

```bash
cd catalog/texture-generator
uv run pytest tests/test_lab_transfer.py::TestDeltaEDominant -v
```

Expected: `ImportError: cannot import name 'delta_e_dominant'`

- [ ] **Step 2c.3: Implement `delta_e_dominant`**

Append to `catalog/texture-generator/src/texture_generator/lab_transfer.py`:

```python
def delta_e_dominant(img1: np.ndarray, img2: np.ndarray) -> float:
    """
    CIE76 ΔE between the dominant (mean) LAB colors of two BGR images.
    Higher values mean the color transfer is more dramatic.
    ΔE > 30: very different (dark teal design → near-white variant).
    ΔE < 10: very similar colors, minimal transfer needed.
    """
    lab1 = cv2.cvtColor(img1.astype(np.float32) / 255.0, cv2.COLOR_BGR2LAB)
    lab2 = cv2.cvtColor(img2.astype(np.float32) / 255.0, cv2.COLOR_BGR2LAB)
    mean1 = lab1.reshape(-1, 3).mean(axis=0)
    mean2 = lab2.reshape(-1, 3).mean(axis=0)
    return float(np.sqrt(np.sum((mean1 - mean2) ** 2)))
```

- [ ] **Step 2c.4: Run all lab_transfer tests — expect PASS**

```bash
cd catalog/texture-generator
uv run pytest tests/test_lab_transfer.py -v
```

Expected: `14 passed`

- [ ] **Step 2c.5: Commit**

```bash
git add catalog/texture-generator/src/texture_generator/lab_transfer.py \
        catalog/texture-generator/tests/test_lab_transfer.py
git commit -m "feat(texture-generator): implement LAB color transfer, crop, delta-E"
```

---

## Task 3: SKU Discovery & Design Name Mapping

**Files:**
- Create: `catalog/texture-generator/src/texture_generator/pipeline.py`
- Create: `catalog/texture-generator/tests/test_pipeline.py`

### 3a: design_name_to_folder

- [ ] **Step 3a.1: Write failing tests**

`catalog/texture-generator/tests/test_pipeline.py`:

```python
import json
import pytest
from pathlib import Path
from texture_generator.pipeline import design_name_to_folder, discover_skus


class TestDesignNameToFolder:
    def test_spaces_become_underscores(self):
        assert design_name_to_folder("DARK BLACKOUT") == "DARK_BLACKOUT"

    def test_percent_becomes_pct(self):
        assert design_name_to_folder("%100 BLACKOUT") == "pct100_BLACKOUT"

    def test_no_change_when_already_clean(self):
        assert design_name_to_folder("ENZA") == "ENZA"

    def test_turkish_chars_preserved(self):
        assert design_name_to_folder("SÜET") == "SÜET"
        assert design_name_to_folder("YAĞMUR") == "YAĞMUR"

    def test_sultan_with_number(self):
        assert design_name_to_folder("SULTAN 22260") == "SULTAN_22260"

    def test_havuz_blackout(self):
        assert design_name_to_folder("HAVUZ BLACKOUT") == "HAVUZ_BLACKOUT"

    def test_hermes_blackout(self):
        assert design_name_to_folder("HERMES BLACKOUT") == "HERMES_BLACKOUT"
```

- [ ] **Step 3a.2: Run tests — expect ImportError/FAIL**

```bash
cd catalog/texture-generator
uv run pytest tests/test_pipeline.py::TestDesignNameToFolder -v
```

Expected: `ImportError: cannot import name 'design_name_to_folder'`

- [ ] **Step 3a.3: Implement `design_name_to_folder`**

`catalog/texture-generator/src/texture_generator/pipeline.py`:

```python
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
```

- [ ] **Step 3a.4: Run tests — expect PASS**

```bash
cd catalog/texture-generator
uv run pytest tests/test_pipeline.py::TestDesignNameToFolder -v
```

Expected: `7 passed`

---

### 3b: discover_skus

- [ ] **Step 3b.1: Add failing tests for discover_skus**

Append to `catalog/texture-generator/tests/test_pipeline.py`:

```python
class TestDiscoverSkus:
    def _make_sku(self, root: Path, sku: str, design: str) -> None:
        """Helper: scaffold a minimal SKU directory."""
        sku_dir = root / sku
        sku_dir.mkdir(parents=True)
        (sku_dir / "swatch.jpg").write_bytes(b"fake")
        (sku_dir / "meta.json").write_text(json.dumps({"sku": sku, "design": design}))

    def _make_design(self, root: Path, design_name: str) -> None:
        """Helper: scaffold a minimal design swatch."""
        folder = design_name_to_folder(design_name)
        design_dir = root / "designs" / folder
        design_dir.mkdir(parents=True)
        (design_dir / "swatch.jpg").write_bytes(b"fake")

    def test_finds_single_valid_sku(self, tmp_path):
        self._make_design(tmp_path, "DARK BLACKOUT")
        self._make_sku(tmp_path, "BLK-001", "DARK BLACKOUT")

        entries = discover_skus(tmp_path)

        assert len(entries) == 1
        assert entries[0].sku == "BLK-001"
        assert entries[0].design == "DARK BLACKOUT"
        assert entries[0].design_folder == "DARK_BLACKOUT"

    def test_finds_multiple_skus(self, tmp_path):
        self._make_design(tmp_path, "DARK BLACKOUT")
        self._make_sku(tmp_path, "BLK-001", "DARK BLACKOUT")
        self._make_sku(tmp_path, "BLK-002", "DARK BLACKOUT")

        entries = discover_skus(tmp_path)
        assert len(entries) == 2

    def test_output_path_is_texture_512_jpg(self, tmp_path):
        self._make_design(tmp_path, "ENZA")
        self._make_sku(tmp_path, "FON-001", "ENZA")

        entries = discover_skus(tmp_path)
        assert entries[0].output_path.name == "texture-512.jpg"
        assert entries[0].output_path.parent.name == "FON-001"

    def test_skips_sku_missing_design_swatch(self, tmp_path, capsys):
        (tmp_path / "designs").mkdir()
        self._make_sku(tmp_path, "BLK-001", "MISSING DESIGN")

        entries = discover_skus(tmp_path)
        assert len(entries) == 0
        captured = capsys.readouterr()
        assert "WARNING" in captured.out

    def test_skips_sku_missing_variant_swatch(self, tmp_path, capsys):
        self._make_design(tmp_path, "DARK BLACKOUT")
        sku_dir = tmp_path / "BLK-001"
        sku_dir.mkdir()
        # meta.json but NO swatch.jpg
        (sku_dir / "meta.json").write_text(json.dumps({"sku": "BLK-001", "design": "DARK BLACKOUT"}))

        entries = discover_skus(tmp_path)
        assert len(entries) == 0
        captured = capsys.readouterr()
        assert "WARNING" in captured.out

    def test_designs_directory_not_treated_as_sku(self, tmp_path):
        self._make_design(tmp_path, "DARK BLACKOUT")
        # No SKU dirs — only 'designs/' exists

        entries = discover_skus(tmp_path)
        assert len(entries) == 0

    def test_entries_sorted_by_sku(self, tmp_path):
        self._make_design(tmp_path, "DARK BLACKOUT")
        self._make_sku(tmp_path, "BLK-003", "DARK BLACKOUT")
        self._make_sku(tmp_path, "BLK-001", "DARK BLACKOUT")
        self._make_sku(tmp_path, "BLK-002", "DARK BLACKOUT")

        entries = discover_skus(tmp_path)
        assert [e.sku for e in entries] == ["BLK-001", "BLK-002", "BLK-003"]
```

- [ ] **Step 3b.2: Run tests — expect ImportError/FAIL**

```bash
cd catalog/texture-generator
uv run pytest tests/test_pipeline.py::TestDiscoverSkus -v
```

Expected: `ImportError: cannot import name 'discover_skus'`

- [ ] **Step 3b.3: Implement `SwatchEntry` dataclass and `discover_skus`**

Append to `catalog/texture-generator/src/texture_generator/pipeline.py`:

```python
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
```

- [ ] **Step 3b.4: Run all pipeline tests — expect PASS**

```bash
cd catalog/texture-generator
uv run pytest tests/test_pipeline.py -v
```

Expected: `15 passed`

- [ ] **Step 3b.5: Commit**

```bash
git add catalog/texture-generator/src/texture_generator/pipeline.py \
        catalog/texture-generator/tests/test_pipeline.py
git commit -m "feat(texture-generator): SKU discovery and design name mapping"
```

---

## Task 4: Generator Pipeline

**Files:**
- Modify: `catalog/texture-generator/src/texture_generator/pipeline.py`

### 4a: generate_one

- [ ] **Step 4a.1: Write the failing test**

Append to `catalog/texture-generator/tests/test_pipeline.py`:

```python
import numpy as np
import cv2
from texture_generator.pipeline import generate_one


class TestGenerateOne:
    def _make_real_swatch(self, path: Path, bgr: tuple, size: int = 64) -> None:
        img = np.zeros((size, size, 3), dtype=np.uint8)
        img[:] = bgr
        path.parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(path), img)

    def _make_entry(self, tmp_path: Path, design_bgr=(50, 120, 50), variant_bgr=(200, 80, 80)) -> "SwatchEntry":
        from texture_generator.pipeline import SwatchEntry
        design_path = tmp_path / "designs" / "DARK_BLACKOUT" / "swatch.jpg"
        variant_path = tmp_path / "BLK-001" / "swatch.jpg"
        output_path = tmp_path / "BLK-001" / "texture-512.jpg"
        self._make_real_swatch(design_path, design_bgr)
        self._make_real_swatch(variant_path, variant_bgr)
        return SwatchEntry(
            sku="BLK-001",
            design="DARK BLACKOUT",
            design_folder="DARK_BLACKOUT",
            design_swatch_path=design_path,
            variant_swatch_path=variant_path,
            output_path=output_path,
        )

    def test_generates_output_file(self, tmp_path):
        entry = self._make_entry(tmp_path)
        status = generate_one(entry)
        assert status == "generated"
        assert entry.output_path.exists()

    def test_output_is_512x512(self, tmp_path):
        entry = self._make_entry(tmp_path)
        generate_one(entry)
        img = cv2.imread(str(entry.output_path))
        assert img is not None
        assert img.shape == (512, 512, 3)

    def test_skips_existing_without_force(self, tmp_path):
        entry = self._make_entry(tmp_path)
        generate_one(entry)
        status = generate_one(entry)  # second call
        assert status == "skipped"

    def test_force_regenerates_existing(self, tmp_path):
        entry = self._make_entry(tmp_path)
        generate_one(entry)
        status = generate_one(entry, force=True)
        assert status == "generated"

    def test_custom_size(self, tmp_path):
        entry = self._make_entry(tmp_path)
        generate_one(entry, size=256)
        img = cv2.imread(str(entry.output_path))
        assert img.shape == (256, 256, 3)
```

- [ ] **Step 4a.2: Run tests — expect ImportError/FAIL**

```bash
cd catalog/texture-generator
uv run pytest tests/test_pipeline.py::TestGenerateOne -v
```

Expected: `ImportError: cannot import name 'generate_one'`

- [ ] **Step 4a.3: Implement `generate_one`**

Append to `catalog/texture-generator/src/texture_generator/pipeline.py` (add import at top):

```python
# Add at top of pipeline.py, after existing imports:
import cv2
import numpy as np
from texture_generator.lab_transfer import center_crop_square, lab_transfer
```

Then append the function:

```python
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
```

- [ ] **Step 4a.4: Run tests — expect PASS**

```bash
cd catalog/texture-generator
uv run pytest tests/test_pipeline.py::TestGenerateOne -v
```

Expected: `5 passed`

---

### 4b: run_all

- [ ] **Step 4b.1: Write the failing test**

Append to `catalog/texture-generator/tests/test_pipeline.py`:

```python
from texture_generator.pipeline import run_all


class TestRunAll:
    def _scaffold(self, root: Path, skus: list[tuple[str, str]], bgr=(100, 100, 100)):
        """Scaffold multiple SKUs with real JPEG swatches."""
        designs_seen = set()
        for sku, design in skus:
            folder = design_name_to_folder(design)
            if folder not in designs_seen:
                design_path = root / "designs" / folder / "swatch.jpg"
                design_path.parent.mkdir(parents=True, exist_ok=True)
                img = np.full((64, 64, 3), bgr, dtype=np.uint8)
                cv2.imwrite(str(design_path), img)
                designs_seen.add(folder)

            sku_dir = root / sku
            sku_dir.mkdir(parents=True, exist_ok=True)
            variant_bgr = (bgr[0] + 30, bgr[1], bgr[2])
            img = np.full((64, 64, 3), variant_bgr, dtype=np.uint8)
            cv2.imwrite(str(sku_dir / "swatch.jpg"), img)
            (sku_dir / "meta.json").write_text(json.dumps({"sku": sku, "design": design}))

    def test_generates_all_skus(self, tmp_path):
        self._scaffold(tmp_path, [
            ("BLK-001", "DARK BLACKOUT"),
            ("BLK-002", "DARK BLACKOUT"),
        ])
        report = run_all(tmp_path)
        assert report["generated"] == 2
        assert report["skipped"] == 0

    def test_skips_existing_on_second_run(self, tmp_path):
        self._scaffold(tmp_path, [("BLK-001", "DARK BLACKOUT")])
        run_all(tmp_path)
        report = run_all(tmp_path)
        assert report["skipped"] == 1
        assert report["generated"] == 0

    def test_force_regenerates(self, tmp_path):
        self._scaffold(tmp_path, [("BLK-001", "DARK BLACKOUT")])
        run_all(tmp_path)
        report = run_all(tmp_path, force=True)
        assert report["generated"] == 1

    def test_sku_filter(self, tmp_path):
        self._scaffold(tmp_path, [
            ("BLK-001", "DARK BLACKOUT"),
            ("BLK-002", "DARK BLACKOUT"),
        ])
        report = run_all(tmp_path, sku_filter=["BLK-001"])
        assert report["total"] == 1
        assert report["generated"] == 1

    def test_report_contains_delta_e(self, tmp_path):
        self._scaffold(tmp_path, [("BLK-001", "DARK BLACKOUT")])
        report = run_all(tmp_path)
        assert "delta_e" in report["results"][0]
        assert isinstance(report["results"][0]["delta_e"], float)

    def test_report_sorted_by_delta_e_descending(self, tmp_path):
        # Two SKUs with different variant colors = different ΔE
        folder = "DARK_BLACKOUT"
        design_path = tmp_path / "designs" / folder / "swatch.jpg"
        design_path.parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(design_path), np.full((64, 64, 3), (100, 100, 100), dtype=np.uint8))

        for sku, bgr in [("BLK-001", (200, 200, 200)), ("BLK-002", (10, 10, 10))]:
            d = tmp_path / sku
            d.mkdir()
            cv2.imwrite(str(d / "swatch.jpg"), np.full((64, 64, 3), bgr, dtype=np.uint8))
            (d / "meta.json").write_text(json.dumps({"sku": sku, "design": "DARK BLACKOUT"}))

        report = run_all(tmp_path)
        des = [r["delta_e"] for r in report["results"]]
        assert des == sorted(des, reverse=True)

    def test_writes_report_json(self, tmp_path):
        self._scaffold(tmp_path, [("BLK-001", "DARK BLACKOUT")])
        report_path = tmp_path / "report.json"
        run_all(tmp_path, report_path=report_path)
        assert report_path.exists()
        data = json.loads(report_path.read_text())
        assert data["total"] == 1
```

- [ ] **Step 4b.2: Run tests — expect FAIL**

```bash
cd catalog/texture-generator
uv run pytest tests/test_pipeline.py::TestRunAll -v
```

Expected: `ImportError: cannot import name 'run_all'`

- [ ] **Step 4b.3: Implement `run_all`**

Append to `catalog/texture-generator/src/texture_generator/pipeline.py`:

```python
# Add at top of pipeline.py after existing imports:
from datetime import datetime, timezone
from texture_generator.lab_transfer import delta_e_dominant
```

Then append:

```python
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
```

- [ ] **Step 4b.4: Run all pipeline tests — expect PASS**

```bash
cd catalog/texture-generator
uv run pytest tests/test_pipeline.py -v
```

Expected: `22 passed` (or similar — all tests in the file)

- [ ] **Step 4b.5: Commit**

```bash
git add catalog/texture-generator/src/texture_generator/pipeline.py \
        catalog/texture-generator/tests/test_pipeline.py
git commit -m "feat(texture-generator): generate_one and run_all pipeline"
```

---

## Task 5: CLI Entry Point

**Files:**
- Create: `catalog/texture-generator/src/texture_generator/cli.py`

- [ ] **Step 5.1: Create the CLI module**

`catalog/texture-generator/src/texture_generator/cli.py`:

```python
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
```

- [ ] **Step 5.2: Reinstall to register the entry point**

```bash
cd catalog/texture-generator
uv pip install -e .
```

- [ ] **Step 5.3: Smoke test — dry run against real data**

```bash
cd /Users/semsettin/workspace/inanc-tekstil
uv run --directory catalog/texture-generator \
  texture-generator catalog/swatch-assets/ --dry-run
```

Expected output: grouped list of all SKUs by design, e.g.:
```
Found 211 SKUs:

  DARK BLACKOUT (28 variants)
    BLK-001
    BLK-002
    ...
  HAVUZ BLACKOUT (28 variants)
    BLK-081
    ...
```

If the count is lower than expected, check which SKUs are missing design swatches (WARNING lines in output).

- [ ] **Step 5.4: Commit**

```bash
git add catalog/texture-generator/src/texture_generator/cli.py
git commit -m "feat(texture-generator): CLI entry point with dry-run and report"
```

---

## Task 6: Real Data Smoke Test (2 SKUs)

Run the generator on two specific SKUs that represent different challenge levels:
- **BLK-001**: light cool grey variant of dark teal design — large ΔE, hardest transfer
- **BLK-013**: dark teal variant matching design color — small ΔE, easiest transfer

- [ ] **Step 6.1: Generate two test textures**

```bash
cd /Users/semsettin/workspace/inanc-tekstil
uv run --directory catalog/texture-generator \
  texture-generator catalog/swatch-assets/ \
  --sku BLK-001 BLK-013 \
  --report /tmp/texture-test-report.json
```

Expected output:
```
  [generated    ] BLK-001       ΔE= XX.X  (DARK BLACKOUT) *** HIGH ΔE — review recommended
  [generated    ] BLK-013       ΔE=  X.X  (DARK BLACKOUT)

Done: 2 generated, 0 skipped, 0 failed
```

- [ ] **Step 6.2: Visually verify the output images**

Open and inspect both generated textures:

```bash
open catalog/swatch-assets/BLK-001/texture-512.jpg
open catalog/swatch-assets/BLK-013/texture-512.jpg
```

**BLK-001 checklist** (light grey variant):
- [ ] Output is 512×512 JPEG
- [ ] Dominant color is cool light grey — close to `BLK-001/swatch.jpg`, NOT dark teal
- [ ] DARK BLACKOUT weave texture structure is visible
- [ ] No severe hue artifacts or unnatural saturation

**BLK-013 checklist** (dark teal variant, same color as design):
- [ ] Output is 512×512 JPEG
- [ ] Dominant color is dark teal — nearly identical to `designs/DARK_BLACKOUT/swatch.jpg`
- [ ] Weave texture structure visible and clean

- [ ] **Step 6.3: Check report JSON**

```bash
cat /tmp/texture-test-report.json
```

Verify structure:
```json
{
  "generated_at": "...",
  "total": 2,
  "generated": 2,
  "skipped": 0,
  "failed": 0,
  "results": [
    { "sku": "BLK-001", "delta_e": ..., "status": "generated", ... },
    { "sku": "BLK-013", "delta_e": ..., "status": "generated", ... }
  ]
}
```

Results should be sorted by `delta_e` descending (BLK-001 should appear first with higher ΔE).

- [ ] **Step 6.4: Commit test outputs if results look good**

```bash
git add catalog/swatch-assets/BLK-001/texture-512.jpg \
        catalog/swatch-assets/BLK-013/texture-512.jpg
git commit -m "feat(texture-generator): add BLK-001 and BLK-013 test textures"
```

---

## Task 7: Full Batch Run

Only proceed after Task 6 visual review passes.

- [ ] **Step 7.1: Run full batch**

```bash
cd /Users/semsettin/workspace/inanc-tekstil
uv run --directory catalog/texture-generator \
  texture-generator catalog/swatch-assets/ \
  --report catalog/swatch-assets/texture-generation-report.json
```

Monitor output. Textures with `*** HIGH ΔE` (ΔE > 40) should be flagged for visual review.

Expected: all ~211 BLK variants generated in under 60 seconds.

- [ ] **Step 7.2: Review high-ΔE outliers**

```bash
python3 -c "
import json
data = json.load(open('catalog/swatch-assets/texture-generation-report.json'))
high = [r for r in data['results'] if r['delta_e'] > 40]
print(f'{len(high)} SKUs with ΔE > 40:')
for r in high:
    print(f'  {r[\"sku\"]:12s}  ΔE={r[\"delta_e\"]}  {r[\"design\"]}')
"
```

Open the flagged textures and inspect visually. If any look wrong (wrong hue, unnatural saturation), note the SKUs — they are candidates for the optional fal.ai AI editing pass described in the original Approach B investigation.

- [ ] **Step 7.3: Commit all generated textures and report**

```bash
git add catalog/swatch-assets/*/texture-512.jpg \
        catalog/swatch-assets/texture-generation-report.json
git commit -m "feat(catalog): generate texture-512.jpg for all BLK variants via LAB transfer"
```

---

## Complete imports reference for pipeline.py

The final `pipeline.py` needs these imports at the top:

```python
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
```

---

## ΔE Interpretation Guide

| ΔE range | Meaning | Expected transfer quality |
|----------|---------|--------------------------|
| 0–10 | Variant nearly same color as design swatch | Excellent — minimal recoloring needed |
| 10–25 | Moderate color difference | Very good |
| 25–40 | Large difference (e.g., medium grey → dark navy) | Good — may need light review |
| 40+ | Very large (e.g., dark teal design → near-white variant) | Review required — LAB transfer at its limits |
