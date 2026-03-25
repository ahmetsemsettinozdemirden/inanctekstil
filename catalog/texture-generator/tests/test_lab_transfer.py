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
