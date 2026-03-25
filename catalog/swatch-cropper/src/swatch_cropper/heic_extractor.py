"""
Direct HEIC → per-SKU swatch extractor.
Uses mapping.json to know which photo → which SKUs.
Detects binding position from the image to determine strip direction.
"""
import os, json, subprocess, unicodedata
import numpy as np
from PIL import Image, ImageFilter

BASE = '/Users/semsettin/workspace/inanc-tekstil/ecommerce'
ASSETS = f'{BASE}/swatch-assets'
HEIC_BASE = f'{BASE}/raw-heic-categorized'
MAPPING_PATH = f'{ASSETS}/mapping.json'

# ── Image helpers ─────────────────────────────────────────────────────────────

def load_heic(path):
    tmp = '/tmp/_swatch_heic.jpg'
    subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '95',
                    path, '--out', tmp], capture_output=True, check=True)
    return np.array(Image.open(tmp).convert('RGB'))

def retinex(arr, sigma_frac=0.25):
    img = Image.fromarray(arr)
    a = arr.astype(float)
    lum = 0.299*a[:,:,0] + 0.587*a[:,:,1] + 0.114*a[:,:,2] + 1.0
    radius = max(1, int(min(arr.shape[:2]) * sigma_frac))
    blurred = np.array(
        Image.fromarray(np.clip(lum-1, 0, 255).astype(np.uint8)
        ).filter(ImageFilter.GaussianBlur(radius=radius))
    ).astype(float) + 1.0
    corr = a * (lum.mean() / blurred[:,:,np.newaxis])
    return np.clip(corr, 0, 255).astype(np.uint8)

def extract_thread_colors(arr, k):
    h, w = arr.shape[:2]
    m = 0.1
    crop = arr[int(h*m):int(h*(1-m)), int(w*m):int(w*(1-m))].reshape(-1, 3).astype(float)
    if k == 1:
        c = crop.mean(axis=0).astype(int)
        return [f'#{c[0]:02x}{c[1]:02x}{c[2]:02x}']
    from sklearn.cluster import KMeans
    km = KMeans(n_clusters=k, random_state=42, n_init=10)
    km.fit(crop)
    centers = km.cluster_centers_.astype(int)
    counts = np.bincount(km.labels_)
    return [f'#{c[0]:02x}{c[1]:02x}{c[2]:02x}' for c in centers[np.argsort(-counts)]]

def csv_thread_count(sku, csv_rows):
    row = csv_rows.get(sku, {})
    app = unicodedata.normalize('NFC', row.get('Appearance (Görünüm)', '').strip().upper())
    if app == 'DESENLİ': return 2
    if app in ('KOYU', 'AÇIK'): return 2
    return 1

def center_square_1024(arr):
    h, w = arr.shape[:2]
    s = min(h, w)
    y = (h - s) // 2
    x = (w - s) // 2
    sq = arr[y:y+s, x:x+s]
    return np.array(Image.fromarray(sq).resize((1024, 1024), Image.LANCZOS))

# ── Binding detection ─────────────────────────────────────────────────────────

def find_binding(arr):
    """Returns ('bottom', crop_h, bottom_h) or ('right', crop_w, bottom_h).
    bottom_h is the safe height limit (excludes dark catalog cover at bottom)."""
    h, w = arr.shape[:2]
    mid = arr[int(h*0.2):int(h*0.8), :, :]
    col_r = mid[:,:,0].mean(axis=0).astype(float)
    col_g = mid[:,:,1].mean(axis=0).astype(float)
    col_b = mid[:,:,2].mean(axis=0).astype(float)

    # Warm brown/terracotta: R>>B and R>G
    warm = (col_r - col_b > 50) & (col_r - col_g > 20)
    warm_x = np.where(warm)[0]

    # Also check rows
    mid_rows = arr[:, int(w*0.2):int(w*0.8), :]
    row_r = mid_rows[:,:,0].mean(axis=1).astype(float)
    row_g = mid_rows[:,:,1].mean(axis=1).astype(float)
    row_b = mid_rows[:,:,2].mean(axis=1).astype(float)
    warm_y_mask = (row_r - row_b > 50) & (row_r - row_g > 20)
    warm_y = np.where(warm_y_mask)[0]

    # First warm column in right 40%
    right_warm = warm_x[warm_x > w * 0.60] if len(warm_x) else np.array([])
    # First warm row in bottom 40%
    bottom_warm = warm_y[warm_y > h * 0.60] if len(warm_y) else np.array([])

    # Detect dark catalog cover at bottom (YAĞMUR-style: dark navy cover)
    # Use threshold < 40 so dark fabric swatches (blackout ~50-80) don't false-trigger
    mid_cols = arr[:, int(w*0.05):int(w*0.60), :]
    row_brightness = mid_cols.mean(axis=(1, 2))
    bottom_h = h
    for y in range(int(h*0.5), h):
        if row_brightness[y] < 40:
            bottom_h = y - 50
            break

    if len(bottom_warm) > 0 and len(right_warm) > 0:
        # Both found — use whichever is closer to edge
        if bottom_warm[0]/h > right_warm[0]/w:
            return ('bottom', int(bottom_warm[0]) - 300, bottom_h)
        else:
            return ('right', int(right_warm[0]) - 300, bottom_h)
    elif len(bottom_warm) > 0:
        return ('bottom', int(bottom_warm[0]) - 300, bottom_h)
    elif len(right_warm) > 0:
        return ('right', int(right_warm[0]) - 300, bottom_h)
    else:
        # Fallback: assume bottom (most common)
        return ('bottom', int(h * 0.72), h)

# ── Swatch extraction from a fan photo ────────────────────────────────────────

def extract_swatches_from_photo(arr, n_swatches, design_name=None):
    """
    Returns list of n_swatches arrays (1024x1024 each).
    Detects binding, determines strip direction, divides equally.
    """
    h, w = arr.shape[:2]
    binding_side, binding_edge, bottom_h = find_binding(arr)

    # Special case: SÜET has a "Home Collection" white card at the bottom
    # It's not dark enough for brightness detection, so hard-limit to 88% height
    if design_name == 'SÜET':
        bottom_h = min(bottom_h, int(h * 0.88))

    # Special case: MONICA has a black catalog spine on the LEFT
    if design_name == 'MONICA':
        # Black spine on left: detect where it ends (where dark columns end)
        left_cols = arr[:, :int(w*0.35), 0].mean(axis=0)
        spine_end = 0
        for i, v in enumerate(left_cols):
            if v > 80:  # past the dark spine
                spine_end = i
                break
        spine_end = max(spine_end, int(w*0.18))
        fabric = arr[:int(binding_edge), spine_end:] if binding_side == 'bottom' else arr[:bottom_h, spine_end:binding_edge]
        return [center_square_1024(fabric)]

    if binding_side == 'bottom':
        # Vertical strips: divide WIDTH
        fabric = arr[:binding_edge, int(w*0.01):]
        fw = fabric.shape[1]
        strip_w = fw // n_swatches
        strips = []
        for i in range(n_swatches):
            x1 = i * strip_w
            x2 = (i+1) * strip_w if i < n_swatches-1 else fw
            strips.append(center_square_1024(fabric[:, x1:x2]))
    else:
        # Horizontal strips: divide HEIGHT (limited by bottom_h to exclude catalog cover)
        fabric = arr[:bottom_h, :binding_edge]
        fh = fabric.shape[0]
        strip_h = fh // n_swatches
        strips = []
        for i in range(n_swatches):
            y1 = i * strip_h
            y2 = (i+1) * strip_h if i < n_swatches-1 else fh
            strips.append(center_square_1024(fabric[y1:y2, :]))

    return strips

# ── Main pipeline ──────────────────────────────────────────────────────────────

import csv as csv_mod

def main():
    mapping = json.load(open(MAPPING_PATH))
    with open(f'{BASE}/Products - v2.csv', encoding='utf-8-sig') as f:
        csv_rows = {r['SKU']: r for r in csv_mod.DictReader(f)}

    processed = 0
    errors = []

    for design_name, d in mapping['designs'].items():
        if design_name == 'SATEN':
            continue
        folder = d['folder']
        photos = d.get('photos', [])

        for photo in photos:
            heic_file = photo['file']
            heic_path = os.path.join(HEIC_BASE, folder, heic_file)
            swatches = photo.get('swatches', [])
            n = len(swatches)

            if not os.path.exists(heic_path):
                errors.append(f'MISSING: {heic_path}')
                continue

            print(f'  {design_name}/{heic_file} ({n} swatches)...', end=' ', flush=True)
            try:
                arr = load_heic(heic_path)
                strips = extract_swatches_from_photo(arr, n, design_name)

                if len(strips) != n:
                    errors.append(f'{design_name}/{heic_file}: got {len(strips)} strips, expected {n}')
                    print(f'ERROR: {len(strips)} strips')
                    continue

                for strip_arr, sw in zip(strips, swatches):
                    sku = sw['sku']
                    out_dir = f'{ASSETS}/{sku}'
                    os.makedirs(out_dir, exist_ok=True)

                    # Save raw swatch
                    Image.fromarray(strip_arr).save(f'{out_dir}/swatch.jpg', 'JPEG', quality=92)

                    # Apply retinex correction
                    corrected = retinex(strip_arr)
                    Image.fromarray(corrected).save(f'{out_dir}/swatch-corrected.jpg', 'JPEG', quality=92)

                    # Extract thread colors
                    k = csv_thread_count(sku, csv_rows)
                    thread_colors = extract_thread_colors(corrected, k)

                    # Update meta.json
                    mf = f'{out_dir}/meta.json'
                    if os.path.exists(mf):
                        m = json.load(open(mf))
                    else:
                        m = {'sku': sku}
                    m['thread_colors'] = thread_colors
                    m['thread_count'] = k
                    m['source_heic'] = f'{folder}/{heic_file}'
                    m['source_crop'] = None  # no longer using cropped-categorized
                    with open(mf, 'w') as f:
                        json.dump(m, f, indent=2, ensure_ascii=False)

                    processed += 1

                print(f'OK')
            except Exception as e:
                import traceback
                errors.append(f'{design_name}/{heic_file}: {e}')
                print(f'ERROR: {e}')
                traceback.print_exc()

    print(f'\nProcessed: {processed} swatches')
    if errors:
        print(f'Errors ({len(errors)}):')
        for e in errors:
            print(f'  {e}')
    else:
        print('No errors.')

if __name__ == '__main__':
    main()
