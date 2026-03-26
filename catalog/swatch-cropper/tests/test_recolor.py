"""
Tests for solid color and sheer blend recoloring functions.
"""
import sys
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from room_visualizer import apply_solid_color, apply_sheer_blend


def make_full_mask(size: int = 64) -> np.ndarray:
    return np.ones((size, size), dtype=np.float32)


def make_fold_map(mean: float = 0.5, size: int = 64) -> np.ndarray:
    """Flat fold map at given mean value."""
    return np.full((size, size), mean, dtype=np.float32)


class TestApplySolidColor:

    def test_output_shape(self):
        fold_map = make_fold_map()
        mask     = make_full_mask()
        result   = apply_solid_color(fold_map, (180, 50, 50), mask)
        assert result.shape == (64, 64, 3)
        assert result.dtype == np.uint8

    def test_mid_fold_yields_target_color(self):
        """fold_map=0.5 with *2 scaling should yield approximately the target color."""
        fold_map = make_fold_map(mean=0.5)
        mask     = make_full_mask()
        target   = (100, 150, 200)
        result   = apply_solid_color(fold_map, target, mask)
        mean_out = result.reshape(-1, 3).mean(axis=0).astype(int)
        # Should be close to target (within 10 units per channel)
        for i in range(3):
            assert abs(int(mean_out[i]) - target[i]) < 15, \
                f'Channel {i}: expected ~{target[i]}, got {mean_out[i]}'

    def test_zero_fold_yields_black(self):
        """fold_map=0 → all black output in mask region."""
        fold_map = np.zeros((64, 64), dtype=np.float32)
        mask     = make_full_mask()
        result   = apply_solid_color(fold_map, (200, 200, 200), mask)
        assert result.sum() == 0

    def test_mask_zeroes_outside(self):
        """Outside mask region, output should be zero."""
        fold_map = make_fold_map()
        mask     = np.zeros((64, 64), dtype=np.float32)
        mask[:, :32] = 1.0  # left half only
        result   = apply_solid_color(fold_map, (255, 0, 0), mask)
        assert result[:, 32:].sum() == 0

    def test_output_clamped_0_255(self):
        """No pixel values outside [0, 255]."""
        fold_map = np.full((64, 64), 0.9, dtype=np.float32)  # high fold → amplified color
        mask     = make_full_mask()
        result   = apply_solid_color(fold_map, (250, 250, 250), mask)
        assert result.min() >= 0
        assert result.max() <= 255

    def test_color_ratio_preserved(self):
        """Hue of output should match target color."""
        fold_map = make_fold_map(mean=0.4)
        mask     = make_full_mask()
        target   = (255, 0, 0)  # pure red
        result   = apply_solid_color(fold_map, target, mask)
        # Green and blue channels should be near zero
        mean_g = result[:, :, 1].mean()
        mean_b = result[:, :, 2].mean()
        assert mean_g < 5
        assert mean_b < 5


class TestApplySheerBlend:

    def test_output_shape(self):
        fold_map = make_fold_map()
        mask     = make_full_mask()
        template = np.full((64, 64, 3), 200, dtype=np.uint8)
        result   = apply_sheer_blend(fold_map, (100, 100, 100), mask, template, 0.65)
        assert result.shape == (64, 64, 3)
        assert result.dtype == np.uint8

    def test_transparency_0_equals_solid(self):
        """transparency_pct=0 → fully opaque, same as apply_solid_color within mask."""
        fold_map = make_fold_map(mean=0.5)
        mask     = make_full_mask()
        template = np.full((64, 64, 3), 200, dtype=np.uint8)
        target   = (100, 100, 100)
        sheer    = apply_sheer_blend(fold_map, target, mask, template, 0.0)
        solid    = apply_solid_color(fold_map, target, mask)
        # Should be identical in mask region
        np.testing.assert_array_equal(sheer, solid)

    def test_transparency_1_equals_template(self):
        """transparency_pct=1 → fully see-through, output = template."""
        fold_map = make_fold_map(mean=0.5)
        mask     = make_full_mask()
        template = np.full((64, 64, 3), 200, dtype=np.uint8)
        result   = apply_sheer_blend(fold_map, (50, 50, 50), mask, template, 1.0)
        np.testing.assert_allclose(result, template, atol=2)

    def test_intermediate_transparency_blends(self):
        """transparency_pct=0.5 → output brightness between solid and template."""
        fold_map = make_fold_map(mean=0.5)
        mask     = make_full_mask()
        template = np.full((64, 64, 3), 200, dtype=np.uint8)
        target   = (50, 50, 50)
        result   = apply_sheer_blend(fold_map, target, mask, template, 0.5)
        mean_out = result.mean()
        # Should be between the solid (dark) and template (bright)
        solid_mean = apply_solid_color(fold_map, target, mask).mean()
        assert solid_mean < mean_out < 200

    def test_outside_mask_matches_template(self):
        """Outside mask, output should equal template."""
        fold_map = make_fold_map(mean=0.5)
        mask     = np.zeros((64, 64), dtype=np.float32)
        mask[:, :32] = 1.0  # left half
        template = np.random.randint(100, 200, (64, 64, 3), dtype=np.uint8)
        result   = apply_sheer_blend(fold_map, (10, 10, 10), mask, template, 0.65)
        np.testing.assert_array_equal(result[:, 32:], template[:, 32:])
