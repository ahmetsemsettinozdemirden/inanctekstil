"""
Integration tests for the full Stage 1 pipeline.
Uses synthetic fixtures (no real room templates or SKU data required).
"""
import json
import sys
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent.parent))

from room_visualizer import (
    load_fabric_spec,
    load_room_config,
    run_stage1,
    measure_color_accuracy,
    FabricLoadError,
    MaskNotFoundError,
    hex_to_rgb,
    rgb_to_hex,
)


# ── Fixtures ──────────────────────────────────────────────────────────────────

def make_sku_dir(base: Path, sku: str, thread_colors=('#5a8a6e',), appearance=None) -> Path:
    sku_dir = base / sku
    sku_dir.mkdir(parents=True)
    meta = {
        'thread_colors': list(thread_colors),
        'thread_count':  len(thread_colors),
        'appearance':    appearance,
    }
    (sku_dir / 'meta.json').write_text(json.dumps(meta))
    # Create a dummy swatch
    swatch = np.full((64, 64, 3), hex_to_rgb(thread_colors[0]), dtype=np.uint8)
    Image.fromarray(swatch).save(sku_dir / 'swatch-corrected.jpg')
    return sku_dir


def make_room_template(templates_dir: Path, room_id: str, existing_color='#b8622a', curtain_type='opaque'):
    """Create a minimal room template + mask + rooms.json entry."""
    # Room image (dark green background, rust curtain on left)
    img = np.full((128, 128, 3), hex_to_rgb('#2d4a2d'), dtype=np.uint8)
    curtain_color = hex_to_rgb(existing_color)
    img[:, :80] = curtain_color  # left 80px = curtain
    fname = f'{room_id}-test.jpg'
    Image.fromarray(img).save(templates_dir / fname)

    # Mask (left 80px = white)
    mask = np.zeros((128, 128), dtype=np.uint8)
    mask[:, :80] = 255
    # Write as proper grayscale PNG
    Image.fromarray(mask, mode='L').save(templates_dir / f'{room_id}-mask.png')

    # rooms.json
    rooms_json_path = templates_dir / 'rooms.json'
    if rooms_json_path.exists():
        data = json.loads(rooms_json_path.read_text())
    else:
        data = {'rooms': {}}
    data['rooms'][room_id] = {
        'file': fname,
        'wall_color': '#2d4a2d',
        'curtain_type': curtain_type,
        'curtain_color_existing': existing_color,
        'suited_for': ['BLACKOUT'],
        'curtain_polygon': [[0, 0], [80, 0], [80, 128], [0, 128]],
        'window_region': None,
    }
    rooms_json_path.write_text(json.dumps(data, indent=2))


# ── Tests ─────────────────────────────────────────────────────────────────────

class TestLoadFabricSpec:

    def test_loads_valid_meta(self, tmp_path):
        make_sku_dir(tmp_path, 'BLK-001', thread_colors=('#1a1a2e',))
        spec = load_fabric_spec('BLK-001', tmp_path)
        assert spec.sku == 'BLK-001'
        assert spec.dominant_color == hex_to_rgb('#1a1a2e')
        assert spec.transparency_class == 'blackout'

    def test_missing_meta_raises(self, tmp_path):
        (tmp_path / 'BLK-999').mkdir()
        with pytest.raises(FabricLoadError):
            load_fabric_spec('BLK-999', tmp_path)

    def test_empty_thread_colors_raises(self, tmp_path):
        sku_dir = tmp_path / 'BLK-998'
        sku_dir.mkdir()
        (sku_dir / 'meta.json').write_text(json.dumps({'thread_colors': []}))
        with pytest.raises(FabricLoadError):
            load_fabric_spec('BLK-998', tmp_path)

    def test_tul_sku_is_sheer(self, tmp_path):
        make_sku_dir(tmp_path, 'TUL-001', thread_colors=('#ffffff',))
        spec = load_fabric_spec('TUL-001', tmp_path)
        assert spec.transparency_class == 'sheer'
        assert spec.transparency_pct == pytest.approx(0.65)

    def test_blk_sku_is_blackout(self, tmp_path):
        make_sku_dir(tmp_path, 'BLK-050', thread_colors=('#2d4a2d',))
        spec = load_fabric_spec('BLK-050', tmp_path)
        assert spec.transparency_class == 'blackout'
        assert spec.transparency_pct == 0.0


class TestLoadRoomConfig:

    def test_loads_valid_room(self, tmp_path):
        make_room_template(tmp_path, 'room-04')
        config = load_room_config('room-04', tmp_path)
        assert config.room_id == 'room-04'
        assert config.template.shape == (128, 128, 3)
        assert config.mask.shape == (128, 128)
        assert config.mask.dtype == np.float32
        assert config.curtain_type == 'opaque'

    def test_missing_mask_raises(self, tmp_path):
        make_room_template(tmp_path, 'room-04')
        (tmp_path / 'room-04-mask.png').unlink()
        with pytest.raises(MaskNotFoundError):
            load_room_config('room-04', tmp_path)

    def test_unknown_room_raises(self, tmp_path):
        rooms_data = {'rooms': {}}
        (tmp_path / 'rooms.json').write_text(json.dumps(rooms_data))
        with pytest.raises(KeyError):
            load_room_config('room-99', tmp_path)

    def test_mask_values_normalized(self, tmp_path):
        make_room_template(tmp_path, 'room-04')
        config = load_room_config('room-04', tmp_path)
        assert config.mask.min() >= 0.0
        assert config.mask.max() <= 1.0


class TestRunStage1:

    def test_produces_output_file(self, tmp_path):
        assets_dir    = tmp_path / 'assets'
        templates_dir = tmp_path / 'templates'
        assets_dir.mkdir()
        templates_dir.mkdir()

        make_sku_dir(assets_dir, 'BLK-001', thread_colors=('#2d4a2d',))
        make_room_template(templates_dir, 'room-04')

        out = run_stage1('BLK-001', 'room-04', assets_dir, templates_dir, assets_dir)
        assert out.exists()
        assert out.suffix == '.jpg'

    def test_output_is_valid_jpeg(self, tmp_path):
        assets_dir    = tmp_path / 'assets'
        templates_dir = tmp_path / 'templates'
        assets_dir.mkdir()
        templates_dir.mkdir()
        make_sku_dir(assets_dir, 'BLK-002', thread_colors=('#8b4513',))
        make_room_template(templates_dir, 'room-04')

        out = run_stage1('BLK-002', 'room-04', assets_dir, templates_dir, assets_dir)
        img = Image.open(out)
        assert img.format == 'JPEG'
        assert img.size == (128, 128)

    def test_color_accuracy_solid_fabric(self, tmp_path):
        """Output mean color in mask region: RGB delta < 40 AND Lab ΔE < 20."""
        assets_dir    = tmp_path / 'assets'
        templates_dir = tmp_path / 'templates'
        assets_dir.mkdir()
        templates_dir.mkdir()

        target_hex = '#4a7c9e'
        make_sku_dir(assets_dir, 'FON-001', thread_colors=(target_hex,))
        make_room_template(templates_dir, 'room-04')

        out = run_stage1('FON-001', 'room-04', assets_dir, templates_dir, assets_dir)
        result  = np.array(Image.open(out).convert('RGB'))
        mask_f  = np.array(Image.open(templates_dir / 'room-04-mask.png').convert('L')).astype(float) / 255.0

        target_rgb = hex_to_rgb(target_hex)
        delta_rgb, delta_e = measure_color_accuracy(result, mask_f, target_rgb)

        assert delta_rgb < 40, f'RGB delta {delta_rgb:.1f} exceeds 40'
        assert delta_e   < 20, f'Lab ΔE {delta_e:.2f} exceeds 20'

    def test_non_curtain_region_unchanged(self, tmp_path):
        """Outside mask region, output should be identical to template."""
        assets_dir    = tmp_path / 'assets'
        templates_dir = tmp_path / 'templates'
        assets_dir.mkdir()
        templates_dir.mkdir()

        make_sku_dir(assets_dir, 'BLK-003', thread_colors=('#ff0000',))
        make_room_template(templates_dir, 'room-04')

        # Record original template pixel at non-curtain location
        template_img  = np.array(Image.open(templates_dir / 'room-04-test.jpg').convert('RGB'))
        out           = run_stage1('BLK-003', 'room-04', assets_dir, templates_dir, assets_dir)
        result        = np.array(Image.open(out).convert('RGB'))

        # Right side (x > 80) should match original template
        np.testing.assert_allclose(
            result[:, 90:].astype(float),
            template_img[:, 90:].astype(float),
            atol=5,  # small tolerance for JPEG compression
        )
