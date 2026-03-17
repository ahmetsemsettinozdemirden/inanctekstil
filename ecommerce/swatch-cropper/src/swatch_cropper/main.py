"""
Interactive manual cropping tool for fabric swatches.

Fast, simple tool to quickly crop fabric regions from raw photos.
"""

from __future__ import annotations

import cv2
import numpy as np
from pathlib import Path
from typing import Optional, List
from dataclasses import dataclass
import json
import argparse


@dataclass
class CropState:
    """Current state of crop selection."""
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
    
    def get_rect(self) -> tuple:
        """Return (x, y, width, height)."""
        x1 = min(self.start_x, self.end_x)
        y1 = min(self.start_y, self.end_y)
        x2 = max(self.start_x, self.end_x)
        y2 = max(self.start_y, self.end_y)
        return (x1, y1, x2 - x1, y2 - y1)


class SwatchCropper:
    """
    Interactive cropping tool with simple controls.
    
    Controls:
    - Click and drag: Select crop area
    - SPACE/ENTER: Confirm and save, go to next
    - R: Reset selection
    - S: Skip image
    - Q/ESC: Quit
    """
    
    WINDOW_NAME = "Swatch Cropper"
    MAX_DISPLAY_WIDTH = 1400
    MAX_DISPLAY_HEIGHT = 900
    
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
        
        self.processed: List[str] = []
        self.skipped: List[str] = []
        self.display_scaled: Optional[np.ndarray] = None
    
    def find_images(self) -> List[Path]:
        """Find all images in input directory."""
        images = []
        for ext in ["*.jpg", "*.jpeg", "*.png", "*.JPG", "*.JPEG", "*.PNG"]:
            images.extend(self.input_dir.rglob(ext))
        return sorted(images)
    
    def _mouse_handler(self, event, x, y, flags, param):
        """Handle mouse events."""
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
    
    def _refresh_display_fast(self):
        """Fast display update during drag - no dimming, just rectangle."""
        if self.current_image is None or self.display_scaled is None:
            return
        
        display = self.display_scaled.copy()
        
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
        """Update the display with current selection (full quality with dimming)."""
        if self.current_image is None:
            return
        
        display = self.current_image.copy()
        
        if self.state.has_selection():
            x, y, w, h = self.state.get_rect()
            
            mask = np.ones(display.shape[:2], dtype=np.uint8) * 80
            mask[y:y+h, x:x+w] = 255
            
            for c in range(3):
                display[:, :, c] = (display[:, :, c] * (mask / 255)).astype(np.uint8)
            
            cv2.rectangle(display, (x, y), (x + w, y + h), (0, 255, 0), 2)
            
            label = f"{w}x{h}"
            cv2.putText(display, label, (x, y - 10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        
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
        """Calculate display scale to fit screen."""
        h, w = image.shape[:2]
        scale_w = self.MAX_DISPLAY_WIDTH / w
        scale_h = self.MAX_DISPLAY_HEIGHT / h
        return min(scale_w, scale_h, 1.0)
    
    def _crop_and_save(self, image_path: Path) -> Path:
        """Crop selection and save to output."""
        x, y, w, h = self.state.get_rect()
        
        cropped = self.current_image[y:y+h, x:x+w]
        
        min_dim = min(h, w)
        cx = (w - min_dim) // 2
        cy = (h - min_dim) // 2
        square = cropped[cy:cy+min_dim, cx:cx+min_dim]
        
        resized = cv2.resize(square, (self.target_size, self.target_size), 
                            interpolation=cv2.INTER_LANCZOS4)
        
        rel_path = image_path.relative_to(self.input_dir)
        output_path = self.output_dir / rel_path.parent / (rel_path.stem.lower() + ".jpg")
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        cv2.imwrite(str(output_path), resized, [cv2.IMWRITE_JPEG_QUALITY, 95])
        return output_path
    
    def process_image(self, image_path: Path, index: int, total: int) -> str:
        """
        Process single image interactively.
        
        Returns: "next", "skip", or "quit"
        """
        self.current_image = cv2.imread(str(image_path))
        if self.current_image is None:
            print(f"  Failed to load: {image_path}")
            return "skip"
        
        self.scale = self._calculate_scale(self.current_image)
        self.state.reset()
        
        rel_path = image_path.relative_to(self.input_dir)
        title = f"[{index+1}/{total}] {rel_path} | SPACE=save, S=skip, Q=quit"
        cv2.setWindowTitle(self.WINDOW_NAME, title)
        
        self._refresh_display()
        
        while True:
            key = cv2.waitKey(30) & 0xFF
            
            if key == ord('q') or key == 27:
                return "quit"
            
            elif key == ord(' ') or key == 13:
                if self.state.has_selection():
                    output = self._crop_and_save(image_path)
                    print(f"  Saved: {output}")
                    self.processed.append(str(image_path))
                    return "next"
                else:
                    print("  No selection - draw a rectangle first")
            
            elif key == ord('r'):
                self.state.reset()
                self._refresh_display()
            
            elif key == ord('s'):
                self.skipped.append(str(image_path))
                return "skip"
    
    def run(self, start_index: int = 0):
        """Run the interactive cropping session."""
        images = self.find_images()
        
        if not images:
            print("No images found!")
            return
        
        print(f"\nFound {len(images)} images")
        print("Controls: Click+drag=select, SPACE=save, S=skip, Q=quit\n")
        
        cv2.namedWindow(self.WINDOW_NAME, cv2.WINDOW_AUTOSIZE)
        cv2.setMouseCallback(self.WINDOW_NAME, self._mouse_handler)
        
        try:
            for i, path in enumerate(images[start_index:], start=start_index):
                print(f"[{i+1}/{len(images)}] {path.relative_to(self.input_dir)}")
                
                result = self.process_image(path, i, len(images))
                
                if result == "quit":
                    break
                elif result == "skip":
                    print("  Skipped")
        
        finally:
            cv2.destroyAllWindows()
            self._save_session()
        
        print(f"\nDone! Processed: {len(self.processed)}, Skipped: {len(self.skipped)}")
    
    def _save_session(self):
        """Save session progress."""
        self.output_dir.mkdir(parents=True, exist_ok=True)
        session_file = self.output_dir / "session.json"
        
        with open(session_file, "w") as f:
            json.dump({
                "processed": self.processed,
                "skipped": self.skipped,
            }, f, indent=2)


def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Interactive fabric swatch cropping tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Controls:
  Click+drag  Select crop area
  SPACE       Save and next
  S           Skip image
  R           Reset selection
  Q/ESC       Quit
        """
    )
    parser.add_argument(
        "-i", "--input",
        default="/Users/semsettin/workspace/inanc-tekstil/products/katalog-raw-images",
        help="Input directory",
    )
    parser.add_argument(
        "-o", "--output", 
        default="/Users/semsettin/workspace/inanc-tekstil/products/katalog-swatches",
        help="Output directory",
    )
    parser.add_argument(
        "-s", "--size",
        type=int,
        default=1024,
        help="Output size (default: 1024)",
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
