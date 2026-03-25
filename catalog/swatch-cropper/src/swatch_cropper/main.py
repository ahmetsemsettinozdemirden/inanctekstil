"""
Interactive manual cropping tool for fabric swatches.

Supports extracting MULTIPLE color variants from a single swatch card image.
Reads HEIC, PNG, JPG files.

Since all swatch cards within a design folder are shot from the same distance,
crop coordinates from one image can be reused on the rest (T = apply template).

Controls:
  Click+drag  Select crop area
  SPACE       Save crop and stay on same image (for next color)
  N           Done with this image, go to next
  T           Apply template — reuse crop positions from previous image
  R           Reset current selection
  U           Undo last saved crop
  S           Skip image entirely
  Q/ESC       Quit
"""

from __future__ import annotations

import cv2
import numpy as np
from pathlib import Path
from typing import Optional, List, Tuple
from dataclasses import dataclass, field
import json
import argparse


def load_image(image_path: Path) -> Optional[np.ndarray]:
    """Load an image, with HEIC fallback via pillow-heif."""
    suffix = image_path.suffix.lower()

    if suffix in (".heic", ".heif"):
        try:
            from PIL import Image as PILImage
            import pillow_heif
            pillow_heif.register_heif_opener()
            pil_img = PILImage.open(str(image_path)).convert("RGB")
            return cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        except ImportError:
            print("  pillow-heif not installed — run: pip install pillow-heif")
            return None
        except Exception as e:
            print(f"  Failed to load HEIC: {e}")
            return None

    img = cv2.imread(str(image_path))
    return img


@dataclass
class CropState:
    start_x: int = 0
    start_y: int = 0
    end_x: int = 0
    end_y: int = 0
    drawing: bool = False

    def reset(self):
        self.start_x = 0
        self.start_y = 0
        self.end_x = 0
        self.end_y = 0
        self.drawing = False

    def has_selection(self) -> bool:
        return self.start_x != self.end_x and self.start_y != self.end_y

    def get_rect(self) -> Tuple[int, int, int, int]:
        x1 = min(self.start_x, self.end_x)
        y1 = min(self.start_y, self.end_y)
        x2 = max(self.start_x, self.end_x)
        y2 = max(self.start_y, self.end_y)
        return (x1, y1, x2 - x1, y2 - y1)


@dataclass
class ImageCrops:
    """Tracks all crops made from a single source image."""
    source: str
    rects: List[Tuple[int, int, int, int]] = field(default_factory=list)
    output_paths: List[str] = field(default_factory=list)


class SwatchCropper:
    """
    Interactive multi-crop tool for swatch card images.

    Each swatch card contains multiple color strips. This tool lets you
    crop each color variant separately before moving to the next image.
    """

    WINDOW_NAME = "Swatch Cropper"
    MAX_DISPLAY_WIDTH = 1400
    MAX_DISPLAY_HEIGHT = 900

    IMAGE_EXTENSIONS = [
        "*.jpg", "*.jpeg", "*.png", "*.JPG", "*.JPEG", "*.PNG",
        "*.heic", "*.HEIC", "*.heif", "*.HEIF",
    ]

    def __init__(
        self,
        input_dir: Path,
        output_dir: Path,
        target_size: int = 1024,
    ):
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.target_size = target_size

        self.state = CropState()
        self.current_image: Optional[np.ndarray] = None
        self.scale: float = 1.0
        self.display_scaled: Optional[np.ndarray] = None

        self.current_crops: ImageCrops = ImageCrops(source="")
        self.all_crops: List[ImageCrops] = []
        self.skipped: List[str] = []

        # Per-folder crop templates: folder_path -> list of rects
        # When you manually crop the first image in a folder, those coordinates
        # become the template for remaining images in that folder (same framing).
        self.folder_templates: dict[str, List[Tuple[int, int, int, int]]] = {}

    SKIP_NAMES = {"design"}

    def find_images(self) -> List[Path]:
        images = []
        for ext in self.IMAGE_EXTENSIONS:
            images.extend(self.input_dir.rglob(ext))
        images = [p for p in images if p.stem.lower() not in self.SKIP_NAMES]
        return sorted(images)

    def _mouse_handler(self, event, x, y, flags, param):
        img_x = int(x / self.scale)
        img_y = int(y / self.scale)

        if event == cv2.EVENT_LBUTTONDOWN:
            self.state.drawing = True
            self.state.start_x = img_x
            self.state.start_y = img_y
            self.state.end_x = img_x
            self.state.end_y = img_y

        elif event == cv2.EVENT_MOUSEMOVE and self.state.drawing:
            self.state.end_x = img_x
            self.state.end_y = img_y
            self._refresh_display_fast()

        elif event == cv2.EVENT_LBUTTONUP:
            self.state.drawing = False
            self.state.end_x = img_x
            self.state.end_y = img_y
            self._refresh_display()

    def _draw_previous_crops(self, display: np.ndarray, use_scale: bool = True):
        """Draw outlines of previously saved crops on the display."""
        for i, rect in enumerate(self.current_crops.rects):
            x, y, w, h = rect
            if use_scale:
                x, y, w, h = (
                    int(x * self.scale), int(y * self.scale),
                    int(w * self.scale), int(h * self.scale),
                )
            cv2.rectangle(display, (x, y), (x + w, y + h), (255, 165, 0), 2)
            label = f"#{i + 1}"
            cv2.putText(display, label, (x + 5, y + 25),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 165, 0), 2)

    def _refresh_display_fast(self):
        if self.current_image is None or self.display_scaled is None:
            return

        display = self.display_scaled.copy()
        self._draw_previous_crops(display, use_scale=True)

        if self.state.has_selection():
            x, y, w, h = self.state.get_rect()
            sx, sy = int(x * self.scale), int(y * self.scale)
            sw, sh = int(w * self.scale), int(h * self.scale)

            cv2.rectangle(display, (sx, sy), (sx + sw, sy + sh), (0, 255, 0), 2)
            label = f"{w}x{h}"
            cv2.putText(display, label, (sx, sy - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

        cv2.imshow(self.WINDOW_NAME, display)

    def _refresh_display(self):
        if self.current_image is None:
            return

        display = self.current_image.copy()
        self._draw_previous_crops(display, use_scale=False)

        if self.state.has_selection():
            x, y, w, h = self.state.get_rect()

            mask = np.ones(display.shape[:2], dtype=np.uint8) * 80
            mask[y:y+h, x:x+w] = 255
            for prev_rect in self.current_crops.rects:
                px, py, pw, ph = prev_rect
                mask[py:py+ph, px:px+pw] = 180

            for c in range(3):
                display[:, :, c] = (display[:, :, c] * (mask / 255)).astype(np.uint8)

            cv2.rectangle(display, (x, y), (x + w, y + h), (0, 255, 0), 2)
            label = f"{w}x{h}"
            cv2.putText(display, label, (x, y - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

            self._draw_previous_crops(display, use_scale=False)

        if self.scale != 1.0:
            new_w = int(display.shape[1] * self.scale)
            new_h = int(display.shape[0] * self.scale)
            display = cv2.resize(display, (new_w, new_h))

        self.display_scaled = cv2.resize(
            self.current_image,
            (int(self.current_image.shape[1] * self.scale),
             int(self.current_image.shape[0] * self.scale))
        ) if self.scale != 1.0 else self.current_image.copy()

        cv2.imshow(self.WINDOW_NAME, display)

    def _calculate_scale(self, image: np.ndarray) -> float:
        h, w = image.shape[:2]
        scale_w = self.MAX_DISPLAY_WIDTH / w
        scale_h = self.MAX_DISPLAY_HEIGHT / h
        return min(scale_w, scale_h, 1.0)

    def _crop_and_save(self, image_path: Path, rect: Optional[Tuple[int, int, int, int]] = None) -> Path:
        """Crop from current selection or a given rect, save to output."""
        x, y, w, h = rect if rect else self.state.get_rect()
        cropped = self.current_image[y:y+h, x:x+w]

        min_dim = min(h, w)
        cx = (w - min_dim) // 2
        cy = (h - min_dim) // 2
        square = cropped[cy:cy+min_dim, cx:cx+min_dim]

        resized = cv2.resize(square, (self.target_size, self.target_size),
                             interpolation=cv2.INTER_LANCZOS4)

        crop_num = len(self.current_crops.rects) + 1
        rel_path = image_path.relative_to(self.input_dir)
        output_path = (
            self.output_dir
            / rel_path.parent
            / f"{rel_path.stem.lower()}_{crop_num:02d}.jpg"
        )
        output_path.parent.mkdir(parents=True, exist_ok=True)

        cv2.imwrite(str(output_path), resized, [cv2.IMWRITE_JPEG_QUALITY, 95])

        self.current_crops.rects.append((x, y, w, h))
        self.current_crops.output_paths.append(str(output_path))
        return output_path

    def _save_template(self, image_path: Path):
        """Store the current image's crop rects as template for its folder."""
        if not self.current_crops.rects:
            return
        rel_path = image_path.relative_to(self.input_dir)
        folder_key = str(rel_path.parent)
        self.folder_templates[folder_key] = list(self.current_crops.rects)

    def _get_template(self, image_path: Path) -> Optional[List[Tuple[int, int, int, int]]]:
        """Get the saved crop template for this image's folder, if any."""
        rel_path = image_path.relative_to(self.input_dir)
        folder_key = str(rel_path.parent)
        return self.folder_templates.get(folder_key)

    def _apply_template(self, image_path: Path) -> bool:
        """Apply saved crop positions from same folder to current image."""
        template = self._get_template(image_path)
        if not template:
            print("  No template — crop the first image in this folder manually")
            return False

        h, w = self.current_image.shape[:2]
        for rect in template:
            rx, ry, rw, rh = rect
            if rx + rw > w or ry + rh > h:
                print(f"  Template rect ({rx},{ry},{rw}x{rh}) out of bounds for {w}x{h} image — skipping")
                continue
            output = self._crop_and_save(image_path, rect=rect)
            n = len(self.current_crops.rects)
            print(f"  Template crop #{n}: {output}")

        self._update_title(image_path, self._current_index, self._current_total)
        self._refresh_display()
        return True

    def _undo_last_crop(self):
        if not self.current_crops.rects:
            print("  Nothing to undo")
            return
        self.current_crops.rects.pop()
        removed = self.current_crops.output_paths.pop()
        try:
            Path(removed).unlink()
        except OSError:
            pass
        print(f"  Undone crop #{len(self.current_crops.rects) + 1}")

    def _update_title(self, image_path: Path, index: int, total: int):
        rel_path = image_path.relative_to(self.input_dir)
        n = len(self.current_crops.rects)
        has_template = self._get_template(image_path) is not None
        tmpl_hint = " | T=apply template" if has_template else ""
        title = (
            f"[{index+1}/{total}] {rel_path} "
            f"| crops: {n}"
            f"{tmpl_hint}"
            f" | SPACE=crop, N=next, U=undo, S=skip, Q=quit"
        )
        cv2.setWindowTitle(self.WINDOW_NAME, title)

    def process_image(self, image_path: Path, index: int, total: int) -> str:
        """
        Process a single swatch card image — extract multiple crops.

        Returns: "next", "skip", or "quit"
        """
        self.current_image = load_image(image_path)
        if self.current_image is None:
            print(f"  Failed to load: {image_path}")
            return "skip"

        self.scale = self._calculate_scale(self.current_image)
        self.state.reset()
        self.current_crops = ImageCrops(source=str(image_path))
        self._current_index = index
        self._current_total = total

        has_template = self._get_template(image_path) is not None
        if has_template:
            tmpl = self._get_template(image_path)
            print(f"  Template available ({len(tmpl)} crops) — press T to apply")

        self._update_title(image_path, index, total)
        self._refresh_display()

        while True:
            key = cv2.waitKey(30) & 0xFF

            if key == ord('q') or key == 27:
                if self.current_crops.rects:
                    self._save_template(image_path)
                    self.all_crops.append(self.current_crops)
                return "quit"

            elif key == ord(' ') or key == 13:
                if self.state.has_selection():
                    output = self._crop_and_save(image_path)
                    n = len(self.current_crops.rects)
                    print(f"  Crop #{n}: {output}")
                    self.state.reset()
                    self._update_title(image_path, index, total)
                    self._refresh_display()
                else:
                    print("  No selection — draw a rectangle first")

            elif key == ord('t'):
                if self.current_crops.rects:
                    print("  Already have crops on this image — template can only be applied to a fresh image")
                else:
                    self._apply_template(image_path)

            elif key == ord('n'):
                if self.current_crops.rects:
                    self._save_template(image_path)
                    self.all_crops.append(self.current_crops)
                    print(f"  Done — {len(self.current_crops.rects)} crops saved")
                else:
                    print("  No crops — moving to next")
                return "next"

            elif key == ord('u'):
                self._undo_last_crop()
                self._update_title(image_path, index, total)
                self._refresh_display()

            elif key == ord('r'):
                self.state.reset()
                self._refresh_display()

            elif key == ord('s'):
                self.skipped.append(str(image_path))
                return "skip"

    def run(self, start_index: int = 0):
        images = self.find_images()

        if not images:
            print("No images found!")
            return

        self._load_session()

        print(f"\nFound {len(images)} images")
        print("Controls:")
        print("  Click+drag  Select crop area")
        print("  SPACE       Save crop (stay on image for more)")
        print("  N           Done with image, go to next")
        print("  T           Apply template (reuse crops from previous image in same folder)")
        print("  U           Undo last crop")
        print("  R           Reset selection")
        print("  S           Skip image")
        print("  Q/ESC       Quit\n")

        cv2.namedWindow(self.WINDOW_NAME, cv2.WINDOW_AUTOSIZE)
        cv2.setMouseCallback(self.WINDOW_NAME, self._mouse_handler)

        try:
            for i, img_path in enumerate(images[start_index:], start=start_index):
                print(f"[{i+1}/{len(images)}] {img_path.relative_to(self.input_dir)}")

                result = self.process_image(img_path, i, len(images))

                if result == "quit":
                    break
                elif result == "skip":
                    print("  Skipped")

        finally:
            cv2.destroyAllWindows()
            self._save_session()

        total_crops = sum(len(c.rects) for c in self.all_crops)
        print(f"\nDone! Images processed: {len(self.all_crops)}, "
              f"Total crops: {total_crops}, Skipped: {len(self.skipped)}")

    def _save_session(self):
        self.output_dir.mkdir(parents=True, exist_ok=True)
        session_file = self.output_dir / "session.json"

        with open(session_file, "w") as f:
            json.dump({
                "crops": [
                    {
                        "source": c.source,
                        "rects": c.rects,
                        "outputs": c.output_paths,
                    }
                    for c in self.all_crops
                ],
                "skipped": self.skipped,
                "folder_templates": {
                    k: [list(r) for r in v]
                    for k, v in self.folder_templates.items()
                },
            }, f, indent=2)

    def _load_session(self):
        """Load templates from a previous session if the session file exists."""
        session_file = self.output_dir / "session.json"
        if not session_file.exists():
            return
        try:
            with open(session_file) as f:
                data = json.load(f)
            templates = data.get("folder_templates", {})
            for k, rects in templates.items():
                self.folder_templates[k] = [tuple(r) for r in rects]
            if self.folder_templates:
                print(f"Loaded templates for {len(self.folder_templates)} folders from previous session")
        except (json.JSONDecodeError, KeyError):
            pass


def main():
    parser = argparse.ArgumentParser(
        description="Interactive multi-crop tool for fabric swatch cards",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Controls:
  Click+drag  Select crop area
  SPACE       Save crop (stay on image for more)
  N           Done with image, go to next
  T           Apply template (reuse crops from previous image in folder)
  U           Undo last crop
  R           Reset selection
  S           Skip image
  Q/ESC       Quit
        """
    )
    parser.add_argument(
        "-i", "--input",
        default="/Users/semsettin/workspace/inanc-tekstil/ecommerce/raw-png-categorized",
        help="Input directory (default: raw-png-categorized)",
    )
    parser.add_argument(
        "-o", "--output",
        default="/Users/semsettin/workspace/inanc-tekstil/ecommerce/cropped-categorized",
        help="Output directory (default: cropped-categorized)",
    )
    parser.add_argument(
        "-s", "--size",
        type=int,
        default=1024,
        help="Output size in pixels (default: 1024)",
    )
    parser.add_argument(
        "--start",
        type=int,
        default=0,
        help="Start from image index",
    )

    args = parser.parse_args()

    cropper = SwatchCropper(
        input_dir=Path(args.input),
        output_dir=Path(args.output),
        target_size=args.size,
    )
    cropper.run(start_index=args.start)


if __name__ == "__main__":
    main()
