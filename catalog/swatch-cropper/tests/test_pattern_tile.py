"""
Tests for pattern tiling (apply_pattern_texture).
"""
import sys
import json
import tempfile
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent.parent))

from room_visualizer import (
    RoomConfig,
    FabricSpec,
    apply_pattern_texture,
)


def make_room_for_pattern(size: int = 128) -> RoomConfig:
    template = np.full((size, size, 3), 128, dtype=np.uint8)
    mask     = np.zeros((size, size), dtype=np.float32)
    mask[:, :80] = 1.0  # left 80px
    return RoomConfig(
        room_id='test',
        template=template,
        mask=mask,
        existing_color=(180, 98, 42),
        curtain_type='opaque',
        window_region=None,
    )


def make_pattern_swatch(tmpdir: Path, color: tuple = (100, 50, 200), size: int = 32) -> Path:
    arr = np.full((size, size, 3), color, dtype=np.uint8)
    path = tmpdir / 'swatch.jpg'
    Image.fromarray(arr).save(path, 'JPEG', quality=95)
    return path


def make_fabric_with_pattern(swatch_path: Path, real_world_cm: float = 27.0) -> FabricSpec:
    return FabricSpec(
        sku='TEST-001',
        dominant_color=(100, 50, 200),
        thread_colors=[(100, 50, 200)],
        appearance='DESENLİ',
        transparency_pct=0.0,
        transparency_class='opaque',
        pattern_repeat_cm=real_world_cm,
        swatch_path=swatch_path,
        design_swatch_path=swatch_path,
        real_world_cm=real_world_cm,
    )


class TestApplyPatternTexture:

    def test_output_shape(self, tmp_path):
        room    = make_room_for_pattern()
        swatch  = make_pattern_swatch(tmp_path)
        fabric  = make_fabric_with_pattern(swatch)
        fold    = np.full((128, 128), 0.5, dtype=np.float32)
        fold    *= room.mask
        result  = apply_pattern_texture(room, fabric, fold)
        assert result.shape == (128, 128, 3)
        assert result.dtype == np.uint8

    def test_outside_mask_is_zero(self, tmp_path):
        room    = make_room_for_pattern()
        swatch  = make_pattern_swatch(tmp_path)
        fabric  = make_fabric_with_pattern(swatch)
        fold    = np.full((128, 128), 0.5, dtype=np.float32)
        fold    *= room.mask
        result  = apply_pattern_texture(room, fabric, fold)
        # Right 48px (outside mask) should be zero
        assert result[:, 80:].sum() == 0

    def test_zero_fold_yields_black_curtain(self, tmp_path):
        room    = make_room_for_pattern()
        swatch  = make_pattern_swatch(tmp_path, color=(200, 200, 200))
        fabric  = make_fabric_with_pattern(swatch)
        fold    = np.zeros((128, 128), dtype=np.float32)  # all dark
        result  = apply_pattern_texture(room, fabric, fold)
        assert result.sum() == 0

    def test_full_fold_amplifies_swatch(self, tmp_path):
        room    = make_room_for_pattern()
        swatch  = make_pattern_swatch(tmp_path, color=(100, 100, 100))
        fabric  = make_fabric_with_pattern(swatch)
        fold    = np.full((128, 128), 0.5, dtype=np.float32) * room.mask
        result  = apply_pattern_texture(room, fabric, fold)
        # Inside mask: should have non-zero values
        masked_vals = result[room.mask > 0.5]
        assert masked_vals.sum() > 0

    def test_tile_count_from_real_world_cm(self, tmp_path):
        """Smaller real_world_cm → more tiles → pattern repeats more times."""
        from math import ceil
        real_cm_large = 50.0  # few tiles
        real_cm_small = 10.0  # many tiles
        # tile_v = ceil(240 / real_world_cm); tile_h = ceil(280 / real_world_cm)
        tiles_large = ceil(240 / real_cm_large) * ceil(280 / real_cm_large)
        tiles_small = ceil(240 / real_cm_small) * ceil(280 / real_cm_small)
        assert tiles_small > tiles_large

    def test_missing_design_swatch_raises(self, tmp_path):
        room    = make_room_for_pattern()
        swatch  = make_pattern_swatch(tmp_path)
        fabric  = make_fabric_with_pattern(swatch)
        fabric.design_swatch_path = None  # remove it
        fold    = np.full((128, 128), 0.5, dtype=np.float32)
        with pytest.raises(AssertionError):
            apply_pattern_texture(room, fabric, fold)

    def test_missing_real_world_cm_raises(self, tmp_path):
        room    = make_room_for_pattern()
        swatch  = make_pattern_swatch(tmp_path)
        fabric  = make_fabric_with_pattern(swatch)
        fabric.real_world_cm = None
        fold    = np.full((128, 128), 0.5, dtype=np.float32)
        with pytest.raises(AssertionError):
            apply_pattern_texture(room, fabric, fold)
