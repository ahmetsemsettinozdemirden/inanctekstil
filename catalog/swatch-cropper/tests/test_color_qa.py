"""
Tests for Lab ΔE color accuracy measurement and Lab post-correction.
"""
import sys
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from room_visualizer import rgb_to_lab, delta_e_lab, measure_color_accuracy
from room_visualizer_fal import apply_lab_correction, LAB_CORRECTION_THRESHOLD


# ── rgb_to_lab ─────────────────────────────────────────────────────────────────

class TestRgbToLab:

    def test_black(self):
        L, a, b = rgb_to_lab((0, 0, 0))
        assert L == pytest.approx(0.0, abs=0.5)

    def test_white(self):
        L, a, b = rgb_to_lab((255, 255, 255))
        assert L == pytest.approx(100.0, abs=0.5)
        assert a == pytest.approx(0.0, abs=1.0)
        assert b == pytest.approx(0.0, abs=1.0)

    def test_mid_grey(self):
        """Mid-grey: a* and b* should be ~0 (achromatic)."""
        L, a, b = rgb_to_lab((128, 128, 128))
        assert a == pytest.approx(0.0, abs=1.0)
        assert b == pytest.approx(0.0, abs=1.0)

    def test_red_has_positive_a(self):
        """Red: a* should be highly positive (red-green axis)."""
        L, a, b = rgb_to_lab((255, 0, 0))
        assert a > 50

    def test_green_has_negative_a(self):
        """Green: a* should be negative."""
        L, a, b = rgb_to_lab((0, 200, 0))
        assert a < 0

    def test_blue_has_negative_b(self):
        """Blue: b* should be negative (yellow-blue axis)."""
        L, a, b = rgb_to_lab((0, 0, 255))
        assert b < -20

    def test_yellow_has_positive_b(self):
        """Yellow: b* should be positive."""
        L, a, b = rgb_to_lab((255, 255, 0))
        assert b > 50

    def test_returns_tuple_of_three(self):
        result = rgb_to_lab((100, 150, 200))
        assert len(result) == 3

    def test_deterministic(self):
        """Same input always returns same output."""
        rgb = (123, 45, 200)
        assert rgb_to_lab(rgb) == rgb_to_lab(rgb)


# ── delta_e_lab ────────────────────────────────────────────────────────────────

class TestDeltaELab:

    def test_same_color_is_zero(self):
        lab = rgb_to_lab((100, 150, 200))
        assert delta_e_lab(lab, lab) == pytest.approx(0.0, abs=1e-6)

    def test_symmetric(self):
        lab1 = rgb_to_lab((100, 150, 200))
        lab2 = rgb_to_lab((200, 100, 50))
        assert delta_e_lab(lab1, lab2) == pytest.approx(delta_e_lab(lab2, lab1), abs=1e-6)

    def test_perceptual_vs_rgb(self):
        """Lab ΔE should correctly rank two pairs that RGB distance gets wrong.

        Dark navy (#001F5B, RGB 31 distance) and light blue (#A8C5E3) are
        perceptually very different (large ΔE).
        Two nearly-identical greys (#808080, #818181) have small ΔE even though
        their RGB euclidean distance is 1.
        """
        navy       = (0, 31, 91)
        light_blue = (168, 197, 227)
        grey1      = (128, 128, 128)
        grey2      = (129, 129, 129)

        de_navy_blue  = delta_e_lab(rgb_to_lab(navy), rgb_to_lab(light_blue))
        de_greys      = delta_e_lab(rgb_to_lab(grey1), rgb_to_lab(grey2))

        assert de_navy_blue > de_greys * 10, (
            f'Navy vs light blue (ΔE={de_navy_blue:.2f}) should be much larger '
            f'than adjacent greys (ΔE={de_greys:.2f})'
        )

    def test_threshold_semantics(self):
        """ΔE < 3 = imperceptible; ΔE > 10 = clearly different."""
        # Identical colors
        assert delta_e_lab(rgb_to_lab((100, 100, 100)), rgb_to_lab((100, 100, 100))) < 3
        # Very different colors
        assert delta_e_lab(rgb_to_lab((0, 0, 0)), rgb_to_lab((255, 255, 255))) > 10

    def test_dark_fabric_colors(self):
        """Two dark fabric colors that look similar should have small ΔE."""
        dark_teal_1 = (37,  69,  72)
        dark_teal_2 = (42,  74,  76)
        rgb_dark_red  = (80, 20, 20)

        de_similar  = delta_e_lab(rgb_to_lab(dark_teal_1), rgb_to_lab(dark_teal_2))
        de_different = delta_e_lab(rgb_to_lab(dark_teal_1), rgb_to_lab(rgb_dark_red))

        assert de_similar < 5, f'Similar dark teals should have ΔE < 5, got {de_similar:.2f}'
        assert de_different > de_similar * 3


# ── measure_color_accuracy ─────────────────────────────────────────────────────

class TestMeasureColorAccuracy:

    def test_returns_two_floats(self):
        output = np.full((64, 64, 3), (100, 150, 200), dtype=np.uint8)
        mask   = np.ones((64, 64), dtype=np.float32)
        dr, de = measure_color_accuracy(output, mask, (100, 150, 200))
        assert isinstance(dr, float)
        assert isinstance(de, float)

    def test_perfect_match_is_near_zero(self):
        """Exact match: both metrics should be ~0."""
        target = (100, 150, 200)
        output = np.full((64, 64, 3), target, dtype=np.uint8)
        mask   = np.ones((64, 64), dtype=np.float32)
        dr, de = measure_color_accuracy(output, mask, target)
        assert dr < 1.0
        assert de < 1.0

    def test_very_different_colors(self):
        """Black output vs white target: high delta."""
        output = np.zeros((64, 64, 3), dtype=np.uint8)
        mask   = np.ones((64, 64), dtype=np.float32)
        dr, de = measure_color_accuracy(output, mask, (255, 255, 255))
        assert dr > 400
        assert de > 50

    def test_only_measures_inside_mask(self):
        """Pixels outside mask should not affect measurement."""
        output = np.full((64, 64, 3), (0, 0, 0), dtype=np.uint8)
        output[:, :32] = (200, 100, 50)   # only left half is "curtain"
        mask   = np.zeros((64, 64), dtype=np.float32)
        mask[:, :32] = 1.0
        target = (200, 100, 50)
        dr, de = measure_color_accuracy(output, mask, target)
        assert dr < 5.0
        assert de < 5.0

    def test_empty_mask_returns_zeros(self):
        output = np.full((64, 64, 3), (100, 100, 100), dtype=np.uint8)
        mask   = np.zeros((64, 64), dtype=np.float32)
        dr, de = measure_color_accuracy(output, mask, (200, 200, 200))
        assert dr == 0.0
        assert de == 0.0


# ── apply_lab_correction ───────────────────────────────────────────────────────

class TestApplyLabCorrection:

    def test_no_correction_when_within_threshold(self):
        """If ΔE is already within threshold, output is unchanged."""
        target = (128, 128, 128)
        # Make output very close to target
        output = np.full((64, 64, 3), (129, 129, 129), dtype=np.uint8)
        mask   = np.ones((64, 64), dtype=np.float32)
        result = apply_lab_correction(output, mask, target)
        np.testing.assert_array_equal(result, output)

    def test_corrects_when_above_threshold(self):
        """When ΔE > threshold, output mean should move toward target."""
        target = (200, 50, 50)   # red
        # Start with greenish output — high ΔE from target
        output = np.full((64, 64, 3), (50, 200, 50), dtype=np.uint8)
        mask   = np.ones((64, 64), dtype=np.float32)
        result = apply_lab_correction(output, mask, target)

        # Red channel should increase, green channel should decrease
        orig_r = output[:, :, 0].mean()
        new_r  = result[:, :, 0].astype(float).mean()
        orig_g = output[:, :, 1].mean()
        new_g  = result[:, :, 1].astype(float).mean()

        assert new_r > orig_r, 'Red channel should increase toward target'
        assert new_g < orig_g, 'Green channel should decrease toward target'

    def test_output_shape_unchanged(self):
        output = np.random.randint(0, 256, (128, 96, 3), dtype=np.uint8)
        mask   = np.ones((128, 96), dtype=np.float32)
        result = apply_lab_correction(output, mask, (100, 100, 100))
        assert result.shape == output.shape
        assert result.dtype == np.uint8

    def test_outside_mask_unchanged(self):
        """Pixels outside mask must not be modified."""
        target = (200, 50, 50)
        output = np.full((64, 64, 3), (50, 200, 50), dtype=np.uint8)
        mask   = np.zeros((64, 64), dtype=np.float32)
        mask[:, :32] = 1.0  # only left half

        result = apply_lab_correction(output, mask, target)
        # Right half (outside mask) must be identical to input
        np.testing.assert_array_equal(result[:, 32:], output[:, 32:])

    def test_output_clipped_0_255(self):
        output = np.full((64, 64, 3), 10, dtype=np.uint8)  # very dark
        mask   = np.ones((64, 64), dtype=np.float32)
        result = apply_lab_correction(output, mask, (255, 255, 255))  # target = white
        assert result.min() >= 0
        assert result.max() <= 255

    def test_empty_mask_returns_unchanged(self):
        output = np.full((64, 64, 3), (100, 100, 100), dtype=np.uint8)
        mask   = np.zeros((64, 64), dtype=np.float32)
        result = apply_lab_correction(output, mask, (200, 50, 50))
        np.testing.assert_array_equal(result, output)


# ── Stage 2 model routing ──────────────────────────────────────────────────────

class TestStage2ModelRouting:
    """Verify that DESENLİ fabrics route to controlnet-sdxl + IP-Adapter."""

    def test_pattern_model_is_controlnet(self):
        from room_visualizer_fal import FAL_PATTERN_MODEL, FAL_SOLID_MODEL
        assert FAL_PATTERN_MODEL != FAL_SOLID_MODEL
        assert 'controlnet' in FAL_PATTERN_MODEL.lower()

    def test_solid_model_is_flux(self):
        from room_visualizer_fal import FAL_SOLID_MODEL
        assert 'flux' in FAL_SOLID_MODEL

    def test_ip_adapter_scale_in_range(self):
        from room_visualizer_fal import IP_ADAPTER_SCALE
        assert 0.4 <= IP_ADAPTER_SCALE <= 0.8, (
            f'IP_ADAPTER_SCALE={IP_ADAPTER_SCALE} outside 0.4–0.8 safe range'
        )

    def test_pattern_strength_higher_than_solid(self):
        from room_visualizer_fal import STRENGTH_BY_TYPE
        assert STRENGTH_BY_TYPE['pattern'] > STRENGTH_BY_TYPE['opaque']

    def test_lab_correction_threshold_set(self):
        assert 3.0 <= LAB_CORRECTION_THRESHOLD <= 15.0, (
            f'LAB_CORRECTION_THRESHOLD={LAB_CORRECTION_THRESHOLD} outside sensible range'
        )
