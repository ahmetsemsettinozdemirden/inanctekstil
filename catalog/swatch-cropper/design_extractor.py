"""
Design image extractor.
Reads design_centers.json and extracts a 1024x1024 crop for each design.
Output: swatch-assets/designs/{DESIGN_NAME}/swatch.jpg
"""
import json, subprocess
from pathlib import Path
from PIL import Image, ImageOps

BASE        = Path('/Users/semsettin/workspace/inanc-tekstil/catalog')
ASSETS      = BASE / 'swatch-assets'
STUDIO_DIR  = BASE / 'raw' / 'studio-shot-categorized'
CENTERS_IN  = ASSETS / 'design_centers.json'
OUT_DIR     = ASSETS / 'designs'
OUT_DIR.mkdir(exist_ok=True)


def load_heic(path: Path) -> 'np.ndarray':
    import numpy as np
    tmp = '/tmp/_design_heic.jpg'
    subprocess.run(
        ['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '95',
         str(path), '--out', tmp],
        capture_output=True, check=True
    )
    return np.array(ImageOps.exif_transpose(Image.open(tmp).convert('RGB')))


def center_square_1024(arr):
    import numpy as np
    h, w = arr.shape[:2]
    s = min(h, w)
    y = (h - s) // 2
    x = (w - s) // 2
    sq = arr[y:y+s, x:x+s]
    return Image.fromarray(sq).resize((1024, 1024), Image.LANCZOS)


def extract(design_name: str, entry: dict) -> None:
    import numpy as np
    heic_path = STUDIO_DIR / entry['photo']
    x_frac = entry['x_frac']
    y_frac = entry['y_frac']
    crop_half_frac = entry.get('crop_half_frac', 0.25)

    print(f'  [{design_name}] {entry["photo"]}')
    print(f'    pos=({x_frac:.3f},{y_frac:.3f}) size={crop_half_frac:.2f}')

    if not heic_path.exists():
        print(f'    ERROR: file not found: {heic_path}')
        return

    arr = load_heic(heic_path)
    h, w = arr.shape[:2]
    half = int(crop_half_frac * min(h, w))
    cx, cy = int(x_frac * w), int(y_frac * h)
    x1, y1 = max(0, cx - half), max(0, cy - half)
    x2, y2 = min(w, cx + half), min(h, cy + half)

    print(f'    image={w}x{h}  center=({cx},{cy})  half={half}px  box=({x1},{y1})→({x2},{y2})')

    crop_arr = arr[y1:y2, x1:x2]
    if crop_arr.size == 0:
        print(f'    ERROR: empty crop')
        return

    import numpy as np
    mean = crop_arr.reshape(-1, 3).mean(axis=0).astype(int)
    print(f'    mean RGB: ({mean[0]},{mean[1]},{mean[2]}) = #{mean[0]:02x}{mean[1]:02x}{mean[2]:02x}')

    # Save output
    safe_name = design_name.replace('/', '_').replace('%', 'pct').replace(' ', '_')
    out_dir = OUT_DIR / safe_name
    out_dir.mkdir(exist_ok=True)

    img_1024 = center_square_1024(crop_arr)
    out_path = out_dir / 'swatch.jpg'
    img_1024.save(out_path, 'JPEG', quality=92)
    print(f'    saved: {out_path}')

    # Write meta.json with real-world scale if available
    real_world_cm = entry.get('real_world_cm')
    pixels_per_cm = entry.get('pixels_per_cm')
    if real_world_cm:
        meta = {
            'design': design_name,
            'real_world_cm': real_world_cm,
            'pixels_per_cm': pixels_per_cm,
            'texture_size_px': 1024,
            'source_photo': entry['photo'],
        }
        meta_path = out_dir / 'meta.json'
        meta_path.write_text(json.dumps(meta, indent=2, ensure_ascii=False))
        print(f'    meta: {real_world_cm}cm × {real_world_cm}cm ({pixels_per_cm} px/cm)')


def main():
    if not CENTERS_IN.exists():
        print(f'ERROR: {CENTERS_IN} not found')
        return

    centers = json.loads(CENTERS_IN.read_text())
    print(f'design_centers.json: {len(centers)} entries')
    print(f'Output: {OUT_DIR}')
    print()

    ok = err = 0
    for design_name, entry in centers.items():
        try:
            extract(design_name, entry)
            ok += 1
        except Exception as e:
            import traceback
            print(f'    ERROR: {e}')
            traceback.print_exc()
            err += 1

    print(f'\nDone: {ok} OK, {err} errors')


if __name__ == '__main__':
    main()
