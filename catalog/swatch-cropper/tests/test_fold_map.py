"""
Tests for fold map extraction and neutralization.
"""
import sys
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

# Add parent dir to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from room_visualizer import (
    RoomConfig,
    extract_fold_map,
    neutralize_fold_map,
)


def make_room(template: np.ndarray, mask: np.ndarray) -> RoomConfig:
    return RoomConfig(
        room_id='test',
        template=template,
        mask=mask,
        existing_color=(180, 98, 42),   # terracotta
        curtain_type='opaque',
        window_region=None,
    )


def make_uniform_template(color: tuple, size: int = 64) -> np.ndarray:
    arr = np.full((size, size, 3), color, dtype=np.uint8)
    return arr


def make_gradient_template(size: int = 64) -> np.ndarray:
    """Gradient from dark to light (simulates fold shading)."""
    row = np.linspace(20, 230, size, dtype=np.uint8)
    arr = np.stack([np.tile(row, (size, 1))] * 3, axis=2)
    return arr


def make_full_mask(size: int = 64) -> np.ndarray:
    return np.ones((size, size), dtype=np.float32)


def make_partial_mask(size: int = 64, left_frac: float = 0.6) -> np.ndarray:
    mask = np.zeros((size, size), dtype=np.float32)
    mask[:, :int(size * left_frac)] = 1.0
    return mask


class TestExtractFoldMap:

    def test_uniform_grey_template(self):
        """Uniform grey template yields flat fold map."""
        template = make_uniform_template((128, 128, 128))
        mask     = make_full_mask()
        room     = make_room(template, mask)
        fold_map = extract_fold_map(room)
        assert fold_map.shape == (64, 64)
        assert fold_map.dtype == np.float32
        # All values should be approximately 0.502 (128/255)
        curtain_vals = fold_map[mask > 0.5]
        assert curtain_vals.mean() == pytest.approx(128 / 255, abs=0.01)
        assert curtain_vals.std() < 0.01

    def test_gradient_template_preserves_range(self):
        """Gradient template yields fold map with range matching luminosity range."""
        template = make_gradient_template()
        mask     = make_full_mask()
        room     = make_room(template, mask)
        fold_map = extract_fold_map(room)
        curtain  = fold_map[mask > 0.5]
        # Min should be near 20/255, max near 230/255
        assert curtain.min() == pytest.approx(20 / 255, abs=0.02)
        assert curtain.max() == pytest.approx(230 / 255, abs=0.02)

    def test_mask_zeroes_outside(self):
        """Pixels outside mask are zero."""
        template = make_uniform_template((200, 200, 200))
        mask     = make_partial_mask(left_frac=0.5)
        room     = make_room(template, mask)
        fold_map = extract_fold_map(room)
        # Right half should be zero
        assert fold_map[:, 32:].sum() == 0.0

    def test_shape_matches_template(self):
        template = np.random.randint(0, 255, (128, 96, 3), dtype=np.uint8)
        mask     = np.ones((128, 96), dtype=np.float32)
        room     = make_room(template, mask)
        fold_map = extract_fold_map(room)
        assert fold_map.shape == (128, 96)

    def test_luminosity_formula(self):
        """ITU-R BT.601 luminosity: 0.299R + 0.587G + 0.114B."""
        r, g, b = 255, 0, 0
        template = make_uniform_template((r, g, b))
        mask     = make_full_mask()
        room     = make_room(template, mask)
        fold_map = extract_fold_map(room)
        expected = 0.299 * r / 255
        assert fold_map.mean() == pytest.approx(expected, abs=0.005)


class TestNeutralizeFoldMap:

    def test_neutral_existing_color_no_change(self):
        """If existing color is already mid-grey, fold map is scaled to 0.5 mean."""
        fold_map = np.full((64, 64), 0.5, dtype=np.float32)
        mask     = make_full_mask()
        # existing_color = (128, 128, 128) → lum = 0.5
        corrected = neutralize_fold_map(fold_map, (128, 128, 128), mask)
        # 0.5 / 0.5 * 0.5 = 0.5 — unchanged
        np.testing.assert_allclose(corrected, fold_map, atol=0.01)

    def test_bright_existing_color_darkens_fold(self):
        """Bright existing color (high lum) should reduce fold values."""
        fold_map = np.full((64, 64), 0.8, dtype=np.float32)
        mask     = make_full_mask()
        # White existing color → lum = 1.0; corrected = 0.8 / 1.0 * 0.5 = 0.4
        corrected = neutralize_fold_map(fold_map, (255, 255, 255), mask)
        assert corrected.mean() == pytest.approx(0.4, abs=0.01)

    def test_dark_existing_color_brightens_fold(self):
        """Dark existing color (low lum) should increase fold values."""
        fold_map = np.full((64, 64), 0.2, dtype=np.float32)
        mask     = make_full_mask()
        # 20% grey existing → lum ≈ 0.2; corrected = 0.2 / 0.2 * 0.5 = 0.5
        corrected = neutralize_fold_map(fold_map, (51, 51, 51), mask)
        assert corrected.mean() == pytest.approx(0.5, abs=0.05)

    def test_output_clipped_to_0_1(self):
        """Output must always be in [0, 1]."""
        fold_map  = np.random.uniform(0, 1, (64, 64)).astype(np.float32)
        mask      = make_full_mask()
        corrected = neutralize_fold_map(fold_map, (20, 20, 20), mask)  # very dark → amplify
        assert corrected.min() >= 0.0
        assert corrected.max() <= 1.0

    def test_mask_preserved(self):
        """Values outside mask remain zero."""
        fold_map = np.full((64, 64), 0.5, dtype=np.float32)
        mask     = make_partial_mask(left_frac=0.5)
        fold_map[:, 32:] = 0.0  # already zero outside mask
        corrected = neutralize_fold_map(fold_map, (128, 128, 128), mask)
        assert corrected[:, 32:].sum() == 0.0
