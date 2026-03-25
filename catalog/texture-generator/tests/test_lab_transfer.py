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
        """Extreme colors (pure red design, pure blue variant) trigger LAB clipping."""
        design = make_solid((0, 0, 255))  # pure red in BGR
        variant = make_solid((255, 0, 0))  # pure blue in BGR
        result = lab_transfer(design, variant)
        assert int(result.min()) >= 0, f"Min value {int(result.min())} is below 0"
        assert int(result.max()) <= 255, f"Max value {int(result.max())} exceeds 255"

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

    def test_textured_design_with_flat_variant_preserves_structure(self):
        """Textured design + flat variant: mean-shift-only should preserve design structure.

        This tests the v_std < 1e-6 branch (line 43-45 in lab_transfer.py) where the
        variant has near-zero standard deviation (solid color). The algorithm performs
        mean-shift-only: result = (design - d_mean) + v_mean, preserving design contrast.
        """
        # Design: alternating high/low contrast pattern
        design = np.zeros((32, 32, 3), dtype=np.uint8)
        design[::2] = 180  # even rows bright
        design[1::2] = 50   # odd rows dark

        # Variant: completely flat/solid color (triggers v_std < 1e-6)
        variant = make_solid((100, 100, 100), 32)  # uniform gray

        result = lab_transfer(design, variant)

        # Verify structure is preserved: brightness difference between rows should persist
        even_mean = result[::2].mean()
        odd_mean = result[1::2].mean()
        brightness_diff = abs(float(even_mean) - float(odd_mean))
        assert brightness_diff > 10, (
            f"Design structure not preserved: brightness diff {brightness_diff} too small"
        )

        # Verify output color is close to variant mean (neutral gray)
        for ch in range(3):
            result_ch_mean = result[:, :, ch].mean()
            variant_ch_mean = variant[:, :, ch].mean()
            diff = abs(result_ch_mean - variant_ch_mean)
            assert diff < 15, (
                f"Channel {ch}: result mean {result_ch_mean:.1f} "
                f"vs variant {variant_ch_mean:.1f}, diff {diff:.1f}"
            )


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
