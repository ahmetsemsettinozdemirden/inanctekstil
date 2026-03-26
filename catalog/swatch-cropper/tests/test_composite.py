"""
Tests for composite_into_room function.
"""
import sys
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from room_visualizer import composite_into_room


def make_template(size: int = 64, color: tuple = (100, 150, 200)) -> np.ndarray:
    return np.full((size, size, 3), color, dtype=np.uint8)


def make_curtain(size: int = 64, color: tuple = (50, 80, 120)) -> np.ndarray:
    return np.full((size, size, 3), color, dtype=np.uint8)


class TestCompositeIntoRoom:

    def test_output_shape(self):
        template = make_template()
        curtain  = make_curtain()
        mask     = np.ones((64, 64), dtype=np.float32)
        result   = composite_into_room(template, curtain, mask)
        assert result.shape == (64, 64, 3)
        assert result.dtype == np.uint8

    def test_full_mask_replaces_template(self):
        """Full white mask → output ≈ curtain (feathering may soften edges slightly)."""
        template = make_template(color=(200, 200, 200))
        curtain  = make_curtain(color=(50, 50, 50))
        mask     = np.ones((64, 64), dtype=np.float32)
        result   = composite_into_room(template, curtain, mask)
        # Center of image (away from feathered edges) should be close to curtain color
        center = result[16:48, 16:48]
        np.testing.assert_allclose(center.mean(axis=(0, 1)), [50, 50, 50], atol=5)

    def test_empty_mask_preserves_template(self):
        """All-black mask → output equals template."""
        template = make_template(color=(200, 200, 200))
        curtain  = make_curtain(color=(50, 50, 50))
        mask     = np.zeros((64, 64), dtype=np.float32)
        result   = composite_into_room(template, curtain, mask)
        np.testing.assert_array_equal(result, template)

    def test_partial_mask_blends_correctly(self):
        """Left-half mask → left=curtain, right=template."""
        template = make_template(color=(200, 200, 200))
        curtain  = make_curtain(color=(50, 50, 50))
        mask     = np.zeros((64, 64), dtype=np.float32)
        mask[:, :32] = 1.0
        result   = composite_into_room(template, curtain, mask, feather_radius=0)
        # With no feathering: left side = curtain, right side = template
        np.testing.assert_allclose(result[:, :20].mean(axis=(0, 1)), [50, 50, 50],  atol=5)
        np.testing.assert_allclose(result[:, 44:].mean(axis=(0, 1)), [200, 200, 200], atol=5)

    def test_feathering_creates_smooth_edge(self):
        """With feathering, edge pixels should be between curtain and template values."""
        template = make_template(color=(200, 200, 200))
        curtain  = make_curtain(color=(50, 50, 50))
        mask     = np.zeros((64, 64), dtype=np.float32)
        mask[:, :32] = 1.0
        result   = composite_into_room(template, curtain, mask, feather_radius=5)
        # Edge column (x=32) should be between 50 and 200
        edge_col = result[:, 32, 0].astype(float)
        assert edge_col.mean() > 50
        assert edge_col.mean() < 200

    def test_output_clipped_0_255(self):
        """No pixel values outside [0, 255]."""
        template = np.random.randint(0, 256, (64, 64, 3), dtype=np.uint8)
        curtain  = np.random.randint(0, 256, (64, 64, 3), dtype=np.uint8)
        mask     = np.random.uniform(0, 1, (64, 64)).astype(np.float32)
        result   = composite_into_room(template, curtain, mask)
        assert result.min() >= 0
        assert result.max() <= 255
