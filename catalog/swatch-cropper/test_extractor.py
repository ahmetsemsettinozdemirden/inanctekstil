"""
Debug tests for heic_extractor studio-center crop pipeline.
Saves annotated debug images to /tmp/swatch_test/ for visual inspection.
"""
import os, json, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont

BASE        = '/Users/semsettin/workspace/inanc-tekstil/catalog'
ASSETS      = f'{BASE}/swatch-assets'
STUDIO_DIR  = f'{BASE}/raw/studio-shot-categorized'
CENTERS_OUT = f'{ASSETS}/studio_centers.json'
OUT_DIR     = '/tmp/swatch_test'
os.makedirs(OUT_DIR, exist_ok=True)

def load_heic(path):
    tmp = '/tmp/_test_heic.jpg'
    result = subprocess.run(
        ['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '95', path, '--out', tmp],
        capture_output=True
    )
    if result.returncode != 0:
        raise RuntimeError(f"sips failed: {result.stderr.decode()}")
    img = Image.open(tmp).convert('RGB')
    print(f"  loaded: {path}")
    print(f"  dimensions: {img.width}x{img.height}")
    return np.array(img)

def center_square_1024(arr):
    h, w = arr.shape[:2]
    s = min(h, w)
    y = (h - s) // 2
    x = (w - s) // 2
    sq = arr[y:y+s, x:x+s]
    return np.array(Image.fromarray(sq).resize((1024, 1024), Image.LANCZOS))

def extract_with_center(arr, x_frac, y_frac, crop_half_frac):
    h, w = arr.shape[:2]
    half = int(min(h, w) * crop_half_frac)
    cx = int(x_frac * w)
    cy = int(y_frac * h)
    x1 = max(0, cx - half)
    y1 = max(0, cy - half)
    x2 = min(w, cx + half)
    y2 = min(h, cy + half)
    print(f"  x_frac={x_frac:.4f} y_frac={y_frac:.4f} size={crop_half_frac:.3f}")
    print(f"  center px: ({cx}, {cy})  half={half}px")
    print(f"  crop box: ({x1},{y1}) → ({x2},{y2})  = {x2-x1}x{y2-y1}px")
    return arr[y1:y2, x1:x2], (cx, cy, x1, y1, x2, y2)

def annotate_image(arr, cx, cy, x1, y1, x2, y2, label, out_path):
    """Save a scaled-down annotated version of the full image with crop box drawn."""
    img = Image.fromarray(arr)
    # Scale to max 800px wide for display
    scale = min(800 / img.width, 800 / img.height)
    w2, h2 = int(img.width * scale), int(img.height * scale)
    img_small = img.resize((w2, h2), Image.LANCZOS)
    draw = ImageDraw.Draw(img_small)
    # Draw crop box
    draw.rectangle(
        [x1*scale, y1*scale, x2*scale, y2*scale],
        outline=(255, 100, 0), width=3
    )
    # Draw center crosshair
    draw.line([(cx*scale - 20, cy*scale), (cx*scale + 20, cy*scale)], fill=(255,0,0), width=2)
    draw.line([(cx*scale, cy*scale - 20), (cx*scale, cy*scale + 20)], fill=(255,0,0), width=2)
    # Label
    draw.text((10, 10), label, fill=(255, 255, 0))
    img_small.save(out_path, 'JPEG', quality=88)
    print(f"  annotated: {out_path}")

def test_sku(sku, sc):
    print(f"\n{'='*60}")
    print(f"SKU: {sku}")
    photo_rel = sc['photo']
    x_frac = sc['x_frac']
    y_frac = sc['y_frac']
    crop_half_frac = sc.get('crop_half_frac', 0.18)
    studio_heic = os.path.join(STUDIO_DIR, photo_rel)

    print(f"  photo: {photo_rel}")
    print(f"  full path: {studio_heic}")
    print(f"  exists: {os.path.exists(studio_heic)}")

    if not os.path.exists(studio_heic):
        print("  ERROR: file not found!")
        return False

    arr = load_heic(studio_heic)
    crop_arr, (cx, cy, x1, y1, x2, y2) = extract_with_center(arr, x_frac, y_frac, crop_half_frac)

    if crop_arr.size == 0:
        print("  ERROR: empty crop!")
        return False

    print(f"  crop shape: {crop_arr.shape}")
    mean_rgb = crop_arr.reshape(-1, 3).mean(axis=0).astype(int)
    print(f"  mean RGB: {tuple(mean_rgb)} = #{mean_rgb[0]:02x}{mean_rgb[1]:02x}{mean_rgb[2]:02x}")

    # Save annotated full image
    annotate_image(arr, cx, cy, x1, y1, x2, y2,
                   f"{sku} | size={crop_half_frac:.2f}",
                   f"{OUT_DIR}/{sku}_annotated.jpg")

    # Save actual crop (1024x1024)
    result_1024 = center_square_1024(crop_arr)
    Image.fromarray(result_1024).save(f"{OUT_DIR}/{sku}_crop.jpg", 'JPEG', quality=92)
    print(f"  crop saved: {OUT_DIR}/{sku}_crop.jpg")

    # Compare with existing swatch (if any)
    existing = f"{ASSETS}/{sku}/swatch.jpg"
    if os.path.exists(existing):
        existing_arr = np.array(Image.open(existing).convert('RGB'))
        existing_mean = existing_arr.reshape(-1, 3).mean(axis=0).astype(int)
        diff = np.linalg.norm(mean_rgb.astype(float) - existing_mean.astype(float))
        print(f"  existing swatch mean: {tuple(existing_mean)} = #{existing_mean[0]:02x}{existing_mean[1]:02x}{existing_mean[2]:02x}")
        print(f"  color distance from existing: {diff:.1f}")

    return True

def main():
    if not os.path.exists(CENTERS_OUT):
        print("No studio_centers.json found.")
        return

    centers = json.load(open(CENTERS_OUT))
    print(f"studio_centers.json: {len(centers)} entries")
    print(f"Output dir: {OUT_DIR}")

    passed = failed = 0
    for sku, sc in centers.items():
        ok = test_sku(sku, sc)
        if ok: passed += 1
        else: failed += 1

    print(f"\n{'='*60}")
    print(f"Results: {passed} passed, {failed} failed")
    print(f"Annotated images saved to: {OUT_DIR}/")
    print("Open them to visually verify crop boxes are correct.")

if __name__ == '__main__':
    main()
