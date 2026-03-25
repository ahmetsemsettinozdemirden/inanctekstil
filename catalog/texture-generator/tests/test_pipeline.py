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
