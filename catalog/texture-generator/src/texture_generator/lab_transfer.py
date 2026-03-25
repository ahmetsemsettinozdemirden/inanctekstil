import cv2
import numpy as np


def center_crop_square(img: np.ndarray) -> np.ndarray:
    """Crop image to largest centered square."""
    h, w = img.shape[:2]
    size = min(h, w)
    y = (h - size) // 2
    x = (w - size) // 2
    return img[y : y + size, x : x + size]


def lab_transfer(design: np.ndarray, variant: np.ndarray) -> np.ndarray:
    """
    Reinhard et al. LAB color transfer.
    Transfers color statistics of `variant` onto the structure of `design`.

    Args:
        design:  BGR uint8 ndarray — structure source (will be recolored)
        variant: BGR uint8 ndarray — color source

    Returns:
        BGR uint8 ndarray — design structure with variant color statistics applied
    """
    design_f = design.astype(np.float32) / 255.0
    variant_f = variant.astype(np.float32) / 255.0

    design_lab = cv2.cvtColor(design_f, cv2.COLOR_BGR2LAB)
    variant_lab = cv2.cvtColor(variant_f, cv2.COLOR_BGR2LAB)

    result = design_lab.copy()

    for ch in range(3):
        d_mean = float(design_lab[:, :, ch].mean())
        d_std = float(design_lab[:, :, ch].std())
        v_mean = float(variant_lab[:, :, ch].mean())
        v_std = float(variant_lab[:, :, ch].std())

        if d_std < 1e-6:
            # Design channel is flat: just set to variant mean
            result[:, :, ch] = v_mean
        elif v_std < 1e-6:
            # Variant channel is flat: preserve design structure, shift mean only
            result[:, :, ch] = (design_lab[:, :, ch] - d_mean) + v_mean
        else:
            result[:, :, ch] = (
                (design_lab[:, :, ch] - d_mean) * (v_std / d_std) + v_mean
            )

    # Clip to valid OpenCV float32 LAB ranges
    result[:, :, 0] = np.clip(result[:, :, 0], 0.0, 100.0)    # L: [0, 100]
    result[:, :, 1] = np.clip(result[:, :, 1], -127.0, 127.0)  # A: [-127, 127]
    result[:, :, 2] = np.clip(result[:, :, 2], -127.0, 127.0)  # B: [-127, 127]

    output_f = cv2.cvtColor(result, cv2.COLOR_LAB2BGR)
    return np.clip(output_f * 255.0, 0, 255).astype(np.uint8)


def delta_e_dominant(img1: np.ndarray, img2: np.ndarray) -> float:
    """
    CIE76 ΔE between the dominant (mean) LAB colors of two BGR images.
    Higher values mean the color transfer is more dramatic.
    ΔE > 30: very different (dark teal design → near-white variant).
    ΔE < 10: very similar colors, minimal transfer needed.
    """
    lab1 = cv2.cvtColor(img1.astype(np.float32) / 255.0, cv2.COLOR_BGR2LAB)
    lab2 = cv2.cvtColor(img2.astype(np.float32) / 255.0, cv2.COLOR_BGR2LAB)
    mean1 = lab1.reshape(-1, 3).mean(axis=0)
    mean2 = lab2.reshape(-1, 3).mean(axis=0)
    return float(np.sqrt(np.sum((mean1 - mean2) ** 2)))
