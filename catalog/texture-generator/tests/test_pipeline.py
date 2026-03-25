import json
import pytest
import numpy as np
import cv2
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


from texture_generator.pipeline import generate_one


class TestGenerateOne:
    def _make_real_swatch(self, path: Path, bgr: tuple, size: int = 64) -> None:
        img = np.zeros((size, size, 3), dtype=np.uint8)
        img[:] = bgr
        path.parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(path), img)

    def _make_entry(self, tmp_path: Path, design_bgr=(50, 120, 50), variant_bgr=(200, 80, 80)):
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
