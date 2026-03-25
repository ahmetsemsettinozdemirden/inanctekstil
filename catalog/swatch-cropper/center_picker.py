"""
Swatch Center Picker (Studio Photos Edition)
=============================================
Shows studio-shot-categorized photos grouped by design. Click on the clean
center of each fabric swatch. The tool auto-suggests the best-matching SKU
by comparing the click area color to existing swatch-assets images.

Run:   python3 center_picker.py
Open:  http://localhost:8900

Output: swatch-assets/studio_centers.json
  { "BLK-001": { "photo": "BLACKOUT/DARK BLACKOUT/dark-blackout-1.heic",
                 "x_frac": 0.42, "y_frac": 0.31, "crop_half_frac": 0.18 }, ... }

After annotating, run heic_extractor.py — it uses studio_centers.json when available.
"""

import http.server, json, os, subprocess, urllib.parse, base64
from pathlib import Path
from collections import OrderedDict

BASE                = Path('/Users/semsettin/workspace/inanc-tekstil/catalog')
ASSETS              = BASE / 'swatch-assets'
STUDIO_DIR          = BASE / 'raw' / 'studio-shot-categorized'
CENTERS_OUT         = ASSETS / 'studio_centers.json'
DESIGN_CENTERS_OUT  = ASSETS / 'design_centers.json'
CACHE_DIR           = Path('/tmp/swatch_studio_cache')
CACHE_DIR.mkdir(exist_ok=True)

# Collect all heic files as relative paths, sorted
studio_photos = sorted(
    str(p.relative_to(STUDIO_DIR))
    for p in STUDIO_DIR.rglob('*.heic')
)

# Build grouped structure: {category: {design: [rel_path, ...]}}
photo_groups = OrderedDict()
for rel in studio_photos:
    parts = Path(rel).parts  # ('BLACKOUT', 'DARK BLACKOUT', 'dark-blackout-1.heic')
    if len(parts) != 3:
        continue
    cat, design, _ = parts
    photo_groups.setdefault(cat, OrderedDict()).setdefault(design, []).append(rel)

# All known SKUs from swatch-assets
import re
all_skus = sorted([
    d.name for d in ASSETS.iterdir()
    if d.is_dir() and re.match(r'^(BLK|FON)-\d+$', d.name)
])

# Build design→SKU mapping from mapping.json
MAPPING_PATH = ASSETS / 'mapping.json'
design_skus = {}  # {'DARK BLACKOUT': ['BLK-001', ...], ...}
if MAPPING_PATH.exists():
    mapping = json.loads(MAPPING_PATH.read_text())
    for design_name, d in mapping.get('designs', {}).items():
        skus = [sw['sku'] for p in d.get('photos', []) for sw in p.get('swatches', [])]
        if skus:
            design_skus[design_name] = skus

# Map folder design name → mapping.json design name (same, but need exact match)
# photo path: 'BLACKOUT/DARK BLACKOUT/dark-blackout-1.heic' → design = 'DARK BLACKOUT'
def skus_for_photo(rel: str) -> list:
    """Return SKUs belonging to the design this photo is from, or all_skus as fallback."""
    parts = Path(rel).parts
    if len(parts) == 3:
        design = parts[1]  # e.g. 'DARK BLACKOUT'
        if design in design_skus:
            return design_skus[design]
    return all_skus

def load_centers():
    if CENTERS_OUT.exists():
        return json.loads(CENTERS_OUT.read_text())
    return {}

def save_centers(centers):
    CENTERS_OUT.write_text(json.dumps(centers, indent=2, ensure_ascii=False))
    print(f'[save] studio_centers.json → {len(centers)} entries')

def load_design_centers():
    if DESIGN_CENTERS_OUT.exists():
        return json.loads(DESIGN_CENTERS_OUT.read_text())
    return {}

def save_design_centers(centers):
    DESIGN_CENTERS_OUT.write_text(json.dumps(centers, indent=2, ensure_ascii=False))
    print(f'[save] design_centers.json → {len(centers)} entries')

def rel_to_cache_stem(rel: str) -> str:
    """Convert relative path to a safe cache filename stem."""
    return rel.replace('/', '__').replace(' ', '_').replace('%', 'pct')

def heic_to_jpeg_cached(rel: str, max_size=2400) -> bytes:
    cache_path = CACHE_DIR / f"{rel_to_cache_stem(rel)}_{max_size}.jpg"
    if not cache_path.exists():
        heic_path = STUDIO_DIR / rel
        tmp = CACHE_DIR / '_tmp_heic_convert.jpg'
        subprocess.run(
            ['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '88',
             '-Z', str(max_size), str(heic_path), '--out', str(tmp)],
            capture_output=True, check=True
        )
        # Apply EXIF rotation into pixels so browser and PIL both see the same orientation
        from PIL import Image, ImageOps
        img = ImageOps.exif_transpose(Image.open(tmp).convert('RGB'))
        img.save(cache_path, 'JPEG', quality=88)
    return cache_path.read_bytes()

def get_click_color(rel: str, x_frac: float, y_frac: float, half=120) -> list:
    import numpy as np
    from PIL import Image
    cache_path = CACHE_DIR / f"{rel_to_cache_stem(rel)}_2400.jpg"
    if not cache_path.exists():
        heic_to_jpeg_cached(rel)
    arr = np.array(Image.open(cache_path).convert('RGB'))
    h, w = arr.shape[:2]
    cx, cy = int(x_frac * w), int(y_frac * h)
    x1, y1 = max(0, cx - half), max(0, cy - half)
    x2, y2 = min(w, cx + half), min(h, cy + half)
    crop = arr[y1:y2, x1:x2].reshape(-1, 3).astype(float)
    mean = crop.mean(axis=0)
    return [int(mean[0]), int(mean[1]), int(mean[2])]

def best_sku_match(click_rgb: list, used_skus: set, candidate_skus: list = None) -> list:
    import numpy as np
    from PIL import Image
    click = np.array(click_rgb, dtype=float)
    scores = []
    for sku in (candidate_skus if candidate_skus is not None else all_skus):
        if sku in used_skus:
            continue
        swatch_path = ASSETS / sku / 'swatch-corrected.jpg'
        if not swatch_path.exists():
            continue
        try:
            arr = np.array(Image.open(swatch_path).convert('RGB'))
            h, w = arr.shape[:2]
            m = 0.2
            crop = arr[int(h*m):int(h*(1-m)), int(w*m):int(w*(1-m))].reshape(-1, 3).astype(float)
            mean = crop.mean(axis=0)
            dist = np.linalg.norm(click - mean)
            scores.append((dist, sku))
        except Exception:
            pass
    scores.sort()
    return [sku for _, sku in scores[:8]]


HTML = r"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Studio Swatch Picker</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #111; color: #eee; font-family: system-ui, sans-serif; display: flex; height: 100vh; overflow: hidden; }

#sidebar { width: 220px; min-width: 220px; background: #181818; border-right: 1px solid #2a2a2a; overflow-y: auto; }
#sidebar > h2 { padding: 10px 12px 6px; font-size: 11px; color: #555; text-transform: uppercase; letter-spacing: .08em; }

.group-cat { padding: 6px 12px 2px; font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: .1em; background: #141414; border-top: 1px solid #222; margin-top: 4px; }
.group-design { padding: 4px 12px 2px 14px; font-size: 11px; color: #888; font-weight: 600; }
.photo-item { padding: 4px 12px 4px 20px; cursor: pointer; font-size: 12px; border-left: 3px solid transparent; display: flex; justify-content: space-between; align-items: center; }
.photo-item:hover { background: #222; }
.photo-item.active { background: #1a2535; border-left-color: #4a9eff; color: #fff; }
.photo-item.done { border-left-color: #2a8a2a; }
.photo-name { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.photo-count { font-size: 10px; color: #555; background: #222; padding: 1px 5px; border-radius: 10px; flex-shrink: 0; margin-left: 4px; }
.photo-item.done .photo-count { background: #1a4a1a; color: #4a9; }
.photo-item.design-shot { opacity: 0.55; }

#main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

#toolbar { background: #181818; border-bottom: 1px solid #2a2a2a; padding: 8px 14px; display: flex; align-items: center; gap: 10px; }
#toolbar h1 { font-size: 12px; font-weight: 600; max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.btn { background: #2a5090; color: #fff; border: none; padding: 5px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; white-space: nowrap; }
.btn:hover { background: #3560a0; }
.btn.warn { background: #603020; }
.btn:disabled { opacity: 0.35; cursor: default; }

#canvas-area { flex: 1; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center; background: #0d0d0d; }
#canvas { cursor: crosshair; display: block; max-width: 100%; max-height: 100%; }

#click-panel { width: 260px; min-width: 260px; background: #181818; border-left: 1px solid #2a2a2a; display: flex; flex-direction: column; overflow: hidden; }
#click-panel h3 { padding: 10px 12px 6px; font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: .08em; border-bottom: 1px solid #222; }
#clicks-list { flex: 1; overflow-y: auto; padding: 6px; }

.click-card { background: #1e1e1e; border-radius: 6px; padding: 8px 10px; margin-bottom: 6px; border: 1px solid #2a2a2a; }
.click-card.active-card { border-color: #4a9eff; }
.click-header { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.click-num { width: 20px; height: 20px; border-radius: 50%; background: #4a9eff; color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.click-preview { width: 48px; height: 48px; border-radius: 4px; object-fit: cover; border: 1px solid #333; flex-shrink: 0; }
.click-info { flex: 1; min-width: 0; }
.sku-select { width: 100%; background: #111; color: #eee; border: 1px solid #444; border-radius: 3px; padding: 3px 5px; font-size: 12px; margin-bottom: 3px; }
.sku-label { font-size: 13px; font-weight: 600; margin-bottom: 3px; }
.size-row { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
.size-row label { font-size: 10px; color: #666; white-space: nowrap; }
.size-slider { flex: 1; accent-color: #4a9eff; }
.size-val { font-size: 10px; color: #aaa; width: 30px; text-align: right; }
.remove-btn { background: none; border: none; color: #666; cursor: pointer; font-size: 16px; padding: 0 2px; }
.remove-btn:hover { color: #f66; }

#panel-footer { padding: 8px; border-top: 1px solid #222; display: flex; flex-direction: column; gap: 6px; }
#panel-footer .btn { width: 100%; text-align: center; padding: 7px; font-size: 13px; }
.btn.success { background: #1a6a1a; }
.btn.success:hover { background: #2a8a2a; }
.scale-hint { padding: 8px 10px; margin-top: 4px; background: #1a2a1a; border-radius: 6px; border: 1px solid #2a4a2a; font-size: 12px; color: #555; }
.scale-result { padding: 8px 10px; margin-top: 4px; background: #1a2a1a; border-radius: 6px; border: 1px solid #2a6a2a; font-size: 12px; color: #4c4; }
</style>
</head>
<body>

<div id="sidebar">
  <h2>Photos (PHOTO_COUNT)</h2>
  <div id="photo-list"></div>
</div>

<div id="main">
  <div id="toolbar">
    <h1 id="title">Loading...</h1>
    <span id="design-badge" style="font-size:11px;background:#2a3a20;color:#8a9;padding:3px 8px;border-radius:4px;white-space:nowrap"></span>
    <span id="mode-badge" style="display:none;font-size:11px;background:#3a2a10;color:#fa0;padding:3px 8px;border-radius:4px;white-space:nowrap">DESIGN</span>
    <label style="font-size:11px;color:#888;white-space:nowrap">default size</label>
    <input type="range" id="default-size" min="0.01" max="0.20" step="0.01" value="0.18"
      style="width:90px;accent-color:#4a9eff" oninput="document.getElementById('default-size-val').textContent=Math.round(+this.value*100)+'%'">
    <span id="default-size-val" style="font-size:11px;color:#aaa;min-width:28px">18%</span>
    <button class="btn warn" onclick="undoLast()">↩ Undo</button>
    <button class="btn warn" onclick="clearAll()">Clear</button>
  </div>
  <div id="canvas-area">
    <canvas id="canvas"></canvas>
  </div>
</div>

<div id="click-panel">
  <h3>Clicks for this photo</h3>
  <div id="clicks-list"></div>
  <div id="panel-footer">
    <button class="btn success" id="save-btn" onclick="savePhoto()">Save photo →</button>
    <div style="font-size:11px;color:#555;text-align:center" id="saved-note"></div>
  </div>
</div>

<script>
const photos = PHOTOS_JSON;
const photoGroups = GROUPS_JSON;
const allSkus = SKUS_JSON;
const designSkus = DESIGN_SKUS_JSON;
let centers = CENTERS_JSON;
let designCenters = DESIGN_CENTERS_JSON;

function skusForPhoto(ph) {
  const parts = ph.split('/');
  if (parts.length === 3) {
    const design = parts[1];
    if (designSkus[design]) return designSkus[design];
  }
  return allSkus;
}

function isDesignPhoto(ph) {
  return ph.split('/').pop().toLowerCase().includes('-design-');
}

function designNameForPhoto(ph) {
  return ph.split('/')[1] || '';
}

let currentPhotoIdx = 0;
let clicks = [];
let scaleClicks = []; // design mode: [{x_frac, y_frac}] × 2 (ColorChecker reference points)
let realWorldCm = null;
let pixelsPerCm = null;
let refCm = 4.0; // real-world distance between A and B scale clicks (cm)
let img = null;
let imgNW = 0, imgNH = 0, scale = 1;
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Build sidebar grouped by category/design
const plist = document.getElementById('photo-list');
Object.entries(photoGroups).forEach(([cat, designs]) => {
  const catDiv = document.createElement('div');
  catDiv.className = 'group-cat';
  catDiv.textContent = cat;
  plist.appendChild(catDiv);

  Object.entries(designs).forEach(([design, photoPaths]) => {
    const dDiv = document.createElement('div');
    dDiv.className = 'group-design';
    dDiv.textContent = design;
    plist.appendChild(dDiv);

    photoPaths.forEach(ph => {
      const idx = photos.indexOf(ph);
      const fname = ph.split('/').pop().replace(/\.heic$/i, '');
      const isDesignShot = isDesignPhoto(ph);
      const dname = designNameForPhoto(ph);
      const saved = isDesignShot
        ? (designCenters[dname] && designCenters[dname].photo === ph ? 1 : 0)
        : Object.values(centers).filter(c => c.photo === ph).length;

      const div = document.createElement('div');
      div.className = 'photo-item' + (saved > 0 ? ' done' : '') + (isDesignShot ? ' design-shot' : '');
      div.id = 'pitem-' + idx;
      div.innerHTML = `<span class="photo-name">${fname}</span><span class="photo-count">${saved > 0 ? saved + ' ✓' : '—'}</span>`;
      div.onclick = () => loadPhoto(idx);
      plist.appendChild(div);
    });
  });
});

loadPhoto(0);

async function loadPhoto(idx) {
  // Auto-save current clicks before switching
  if (clicks.length > 0) {
    const curPh = photos[currentPhotoIdx];
    if (isDesignPhoto(curPh)) {
      const dname = designNameForPhoto(curPh);
      const c = clicks[0];
      if (c) {
        const entry = { photo: curPh, x_frac: c.x_frac, y_frac: c.y_frac, crop_half_frac: c.crop_half_frac || 0.30 };
        if (scaleClicks.length >= 2 && realWorldCm) {
          entry.scale_pt1 = scaleClicks[0]; entry.scale_pt2 = scaleClicks[1];
          entry.real_world_cm = realWorldCm;
          entry.pixels_per_cm = pixelsPerCm ? Math.round(pixelsPerCm * 10) / 10 : null;
        }
        designCenters[dname] = entry;
      }
      await fetch('/save-design', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(designCenters) });
    } else {
      Object.keys(centers).forEach(sku => { if (centers[sku].photo === curPh) delete centers[sku]; });
      clicks.forEach(c => {
        if (c.sku) centers[c.sku] = { photo: curPh, x_frac: c.x_frac, y_frac: c.y_frac, crop_half_frac: c.crop_half_frac || 0.18 };
      });
      await fetch('/save', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(centers) });
    }
    const pitem = document.getElementById('pitem-' + currentPhotoIdx);
    if (pitem) { pitem.classList.add('done'); pitem.querySelector('.photo-count').textContent = clicks.length + ' ✓'; }
  }

  currentPhotoIdx = idx;
  const ph = photos[idx];
  const designMode = isDesignPhoto(ph);

  document.querySelectorAll('.photo-item').forEach((el, i) => {
    el.classList.toggle('active', el.id === 'pitem-' + idx);
  });
  document.getElementById('title').textContent = ph.split('/').pop();
  const design = ph.split('/')[1] || '';
  const dsSkus = skusForPhoto(ph);
  document.getElementById('design-badge').textContent = design && !designMode ? `${design} · ${dsSkus.length} SKUs` : '';
  document.getElementById('mode-badge').style.display = designMode ? 'inline-block' : 'none';

  // Adjust default-size slider range for design vs variant mode
  const slider = document.getElementById('default-size');
  const sliderVal = document.getElementById('default-size-val');
  if (designMode) {
    slider.min = '0.10'; slider.max = '0.50'; slider.step = '0.01';
    if (+slider.value < 0.10 || +slider.value > 0.50) slider.value = '0.30';
  } else {
    slider.min = '0.01'; slider.max = '0.20'; slider.step = '0.01';
    if (+slider.value > 0.20) slider.value = '0.18';
  }
  sliderVal.textContent = Math.round(+slider.value * 100) + '%';

  clicks = [];
  scaleClicks = []; realWorldCm = null; pixelsPerCm = null;
  if (designMode) {
    const dname = designNameForPhoto(ph);
    const dc = designCenters[dname];
    if (dc && dc.photo === ph) {
      clicks.push({ x_frac: dc.x_frac, y_frac: dc.y_frac, sku: dname, preview_data_url: null, crop_half_frac: dc.crop_half_frac || 0.30 });
      if (dc.scale_pt1) scaleClicks.push(dc.scale_pt1);
      if (dc.scale_pt2) scaleClicks.push(dc.scale_pt2);
      if (dc.ref_cm) refCm = dc.ref_cm;
      if (dc.real_world_cm) { realWorldCm = dc.real_world_cm; pixelsPerCm = dc.pixels_per_cm; }
    }
  } else {
    Object.entries(centers).forEach(([sku, c]) => {
      if (c.photo === ph) {
        clicks.push({ x_frac: c.x_frac, y_frac: c.y_frac, sku, preview_data_url: null, crop_half_frac: c.crop_half_frac || 0.18 });
      }
    });
  }

  img = new Image();
  img.onload = () => {
    imgNW = img.naturalWidth; imgNH = img.naturalHeight;
    fitCanvas();
    if (scaleClicks.length >= 2 && realWorldCm === null) computeRealWorldSize();
    redraw();
    renderClickList();
  };
  img.src = `/image?photo=${encodeURIComponent(ph)}`;
}

function fitCanvas() {
  const area = document.getElementById('canvas-area');
  const maxW = area.clientWidth - 16;
  const maxH = area.clientHeight - 16;
  scale = Math.min(maxW / imgNW, maxH / imgNH, 1);
  canvas.width  = Math.round(imgNW * scale);
  canvas.height = Math.round(imgNH * scale);
}
window.addEventListener('resize', () => { if (img) { fitCanvas(); redraw(); } });

function redraw() {
  if (!img) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  clicks.forEach((c, i) => {
    const cx = c.x_frac * canvas.width;
    const cy = c.y_frac * canvas.height;
    const isLast = i === clicks.length - 1;

    const halfPx = (c.crop_half_frac || 0.18) * Math.min(imgNW, imgNH) * scale;
    ctx.strokeStyle = isLast ? 'rgba(255,170,0,0.6)' : 'rgba(74,158,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(cx - halfPx, cy - halfPx, halfPx*2, halfPx*2);
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI*2);
    ctx.fillStyle = isLast ? 'rgba(255,170,0,0.3)' : 'rgba(74,158,255,0.25)';
    ctx.fill();
    ctx.strokeStyle = isLast ? '#ffaa00' : '#4a9eff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(i + 1, cx, cy);

    if (c.sku) {
      ctx.fillStyle = isLast ? '#ffaa00' : '#4a9eff';
      ctx.font = '11px system-ui';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(c.sku, cx + 18, cy - 6);
    }
  });

  // Draw ColorChecker scale reference points (design mode only)
  if (isDesignPhoto(photos[currentPhotoIdx])) {
    scaleClicks.forEach((sc, i) => {
      const cx = sc.x_frac * canvas.width;
      const cy = sc.y_frac * canvas.height;
      ctx.strokeStyle = '#00cc66';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,204,102,0.25)'; ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 14, cy); ctx.lineTo(cx + 14, cy);
      ctx.moveTo(cx, cy - 14); ctx.lineTo(cx, cy + 14);
      ctx.stroke();
      ctx.fillStyle = '#00cc66';
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(i === 0 ? 'A' : 'B', cx, cy + 11);
    });
    if (scaleClicks.length === 2) {
      const x1 = scaleClicks[0].x_frac * canvas.width, y1 = scaleClicks[0].y_frac * canvas.height;
      const x2 = scaleClicks[1].x_frac * canvas.width, y2 = scaleClicks[1].y_frac * canvas.height;
      ctx.strokeStyle = '#00cc66'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.setLineDash([]);
      // Label A→B line with the reference real-world distance
      ctx.fillStyle = '#00cc66'; ctx.font = '11px system-ui';
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(`${refCm}cm`, (x1 + x2) / 2, Math.min(y1, y2) - 4);
      // Label the crop box with texture real-world size
      if (realWorldCm && clicks[0]) {
        const cropCx = clicks[0].x_frac * canvas.width;
        const cropCy = clicks[0].y_frac * canvas.height;
        const halfPx = (clicks[0].crop_half_frac || 0.30) * Math.min(imgNW, imgNH) * scale;
        ctx.fillStyle = '#ffcc44'; ctx.font = 'bold 12px system-ui';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText(`${realWorldCm}cm \u00d7 ${realWorldCm}cm`, cropCx, cropCy - halfPx - 4);
      }
    }
  }
}

function computeRealWorldSize() {
  if (scaleClicks.length < 2 || !clicks[0] || !imgNW) return;
  const dx = (scaleClicks[1].x_frac - scaleClicks[0].x_frac) * imgNW;
  const dy = (scaleClicks[1].y_frac - scaleClicks[0].y_frac) * imgNH;
  const pixelDist = Math.sqrt(dx * dx + dy * dy);
  pixelsPerCm = pixelDist / (refCm || 4.0);
  const chf = clicks[0].crop_half_frac || 0.30;
  const cropSizePx = 2 * chf * Math.min(imgNW, imgNH);
  realWorldCm = Math.round(cropSizePx / pixelsPerCm * 10) / 10;
}

canvas.addEventListener('click', async e => {
  if (!img) return;
  const rect = canvas.getBoundingClientRect();
  const xf = (e.clientX - rect.left) / canvas.width;
  const yf = (e.clientY - rect.top) / canvas.height;
  const ph = photos[currentPhotoIdx];
  const defaultSize = +document.getElementById('default-size').value;

  if (isDesignPhoto(ph)) {
    const dname = designNameForPhoto(ph);
    if (clicks.length === 0) {
      // First click: crop center
      const res = await fetch(`/design-suggest?photo=${encodeURIComponent(ph)}&x=${xf.toFixed(4)}&y=${yf.toFixed(4)}&size=${defaultSize.toFixed(3)}`);
      const data = await res.json();
      clicks = [{ x_frac: xf, y_frac: yf, sku: dname, preview_data_url: data.preview, crop_half_frac: defaultSize }];
      scaleClicks = []; realWorldCm = null; pixelsPerCm = null;
    } else if (scaleClicks.length < 2) {
      // 2nd or 3rd click: ColorChecker scale reference point
      scaleClicks.push({ x_frac: xf, y_frac: yf });
      if (scaleClicks.length === 2) computeRealWorldSize();
    } else {
      // Replace second scale point to re-calibrate
      scaleClicks[1] = { x_frac: xf, y_frac: yf };
      computeRealWorldSize();
    }
  } else {
    const res = await fetch(`/suggest?photo=${encodeURIComponent(ph)}&x=${xf.toFixed(4)}&y=${yf.toFixed(4)}&size=${defaultSize.toFixed(3)}&used=${encodeURIComponent(JSON.stringify(clicks.map(c=>c.sku).filter(Boolean)))}`);
    const data = await res.json();
    clicks.push({ x_frac: xf, y_frac: yf, sku: data.sku || '', preview_data_url: data.preview, crop_half_frac: defaultSize });
  }

  redraw();
  renderClickList();
});

function renderClickList() {
  const list = document.getElementById('clicks-list');
  list.innerHTML = '';

  clicks.forEach((c, i) => {
    const div = document.createElement('div');
    div.className = 'click-card' + (i === clicks.length - 1 ? ' active-card' : '');
    div.id = `click-card-${i}`;

    const ph = photos[currentPhotoIdx];
    const designMode = isDesignPhoto(ph);
    const defaultChf = designMode ? 0.30 : 0.18;
    const chf = c.crop_half_frac || defaultChf;
    const sizeMin = designMode ? '0.10' : '0.01';
    const sizeMax = designMode ? '0.50' : '0.20';
    const previewSrc = `/preview?photo=${encodeURIComponent(ph)}&x=${c.x_frac.toFixed(4)}&y=${c.y_frac.toFixed(4)}&size=${chf.toFixed(3)}`;

    let inputHtml;
    if (designMode) {
      inputHtml = `<div class="sku-label" style="color:#fa0">${c.sku}</div>`;
    } else {
      const designSkuList = skusForPhoto(ph);
      const optHtml = designSkuList.map(s => `<option value="${s}" ${s === c.sku ? 'selected' : ''}>${s}</option>`).join('');
      inputHtml = `<select class="sku-select" onchange="assignSku(${i}, this.value)">${optHtml}</select>`;
    }

    div.innerHTML = `
      <div class="click-header">
        <div class="click-num">${i+1}</div>
        <img class="click-preview" src="${previewSrc}">
        <div class="click-info">
          ${inputHtml}
          <div class="size-row">
            <label>size</label>
            <input type="range" class="size-slider" min="${sizeMin}" max="${sizeMax}" step="0.01"
              value="${chf}" oninput="assignCropSize(${i}, +this.value, this.nextElementSibling)">
            <span class="size-val">${Math.round(chf*100)}%</span>
          </div>
        </div>
        <button class="remove-btn" onclick="removeClick(${i})">×</button>
      </div>`;
    list.appendChild(div);
  });

  // Scale measurement section (design mode only)
  const ph3 = photos[currentPhotoIdx];
  if (isDesignPhoto(ph3)) {
    const scaleDiv = document.createElement('div');
    if (clicks.length === 0) {
      scaleDiv.className = 'scale-hint';
      scaleDiv.textContent = '\u2460 Click the fabric center first';
    } else if (scaleClicks.length === 0) {
      scaleDiv.className = 'scale-hint';
      scaleDiv.textContent = '\u{1F4CF} Click center of a ColorChecker box (A)';
    } else if (scaleClicks.length === 1) {
      scaleDiv.className = 'scale-hint';
      scaleDiv.style.color = '#8a8';
      scaleDiv.innerHTML = `\u{1F4CF} Click box center (B) \u2014 then enter real distance below<br>
        <div style="margin-top:5px;display:flex;align-items:center;gap:6px">
          <label style="font-size:10px;color:#666">A\u2194B distance (cm):</label>
          <input id="ref-cm-input" type="number" value="${refCm}" min="0.1" step="0.1"
            style="width:55px;background:#111;color:#eee;border:1px solid #444;border-radius:3px;padding:2px 5px;font-size:12px"
            oninput="refCm=+this.value">
        </div>`;
    } else if (realWorldCm) {
      scaleDiv.className = 'scale-result';
      scaleDiv.innerHTML = `\u{1F4D0} Texture = <b>${realWorldCm}cm \u00d7 ${realWorldCm}cm</b><br>
        <div style="margin-top:4px;display:flex;align-items:center;gap:6px">
          <span style="font-size:10px;color:#4a6">${pixelsPerCm?.toFixed(1)} px/cm</span>
          <label style="font-size:10px;color:#666">ref:</label>
          <input id="ref-cm-input" type="number" value="${refCm}" min="0.1" step="0.1"
            style="width:50px;background:#111;color:#aaa;border:1px solid #333;border-radius:3px;padding:2px 4px;font-size:11px"
            oninput="refCm=+this.value;computeRealWorldSize();renderClickList();redraw()">
          <span style="font-size:10px;color:#666">cm</span>
        </div>`;
    }
    list.appendChild(scaleDiv);
  }

  const pitem = document.getElementById('pitem-' + currentPhotoIdx);
  if (pitem) {
    pitem.querySelector('.photo-count').textContent = clicks.length > 0 ? clicks.length + ' clicks' : '—';
  }
}


function assignSku(idx, sku) {
  clicks[idx].sku = sku;
  redraw();
}

function assignCropSize(idx, val, label) {
  clicks[idx].crop_half_frac = val;
  label.textContent = Math.round(val * 100) + '%';
  const ph = photos[currentPhotoIdx];
  if (isDesignPhoto(ph) && scaleClicks.length >= 2) computeRealWorldSize();
  redraw();
  renderClickList();
  // Refresh preview thumbnail with new size
  const c = clicks[idx];
  const thumbEl = document.querySelector(`#click-card-${idx} .click-preview`);
  if (thumbEl) thumbEl.src = `/preview?photo=${encodeURIComponent(ph)}&x=${c.x_frac.toFixed(4)}&y=${c.y_frac.toFixed(4)}&size=${val.toFixed(3)}`;
}

function removeClick(idx) {
  clicks.splice(idx, 1);
  redraw();
  renderClickList();
}

function undoLast() {
  if (scaleClicks.length > 0) {
    scaleClicks.pop();
    if (scaleClicks.length < 2) { realWorldCm = null; pixelsPerCm = null; }
  } else if (clicks.length > 0) {
    clicks.pop();
    scaleClicks = []; realWorldCm = null; pixelsPerCm = null;
  }
  redraw(); renderClickList();
}
function clearAll() {
  clicks = []; scaleClicks = []; realWorldCm = null; pixelsPerCm = null;
  redraw(); renderClickList();
}

async function savePhoto() {
  const ph = photos[currentPhotoIdx];

  if (isDesignPhoto(ph)) {
    const dname = designNameForPhoto(ph);
    const c = clicks[0];
    if (c) {
      const entry = { photo: ph, x_frac: c.x_frac, y_frac: c.y_frac, crop_half_frac: c.crop_half_frac || 0.30 };
      if (scaleClicks.length >= 2 && realWorldCm) {
        entry.scale_pt1 = scaleClicks[0];
        entry.scale_pt2 = scaleClicks[1];
        entry.ref_cm = refCm;
        entry.real_world_cm = realWorldCm;
        entry.pixels_per_cm = pixelsPerCm ? Math.round(pixelsPerCm * 10) / 10 : null;
      }
      designCenters[dname] = entry;
    }
    await fetch('/save-design', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(designCenters)
    });
  } else {
    Object.keys(centers).forEach(sku => {
      if (centers[sku].photo === ph) delete centers[sku];
    });
    clicks.forEach(c => {
      if (c.sku) centers[c.sku] = { photo: ph, x_frac: c.x_frac, y_frac: c.y_frac, crop_half_frac: c.crop_half_frac || 0.18 };
    });
    await fetch('/save', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(centers)
    });
  }

  const pitem = document.getElementById('pitem-' + currentPhotoIdx);
  if (pitem) {
    pitem.classList.add('done');
    pitem.querySelector('.photo-count').textContent = clicks.length + ' ✓';
  }

  document.getElementById('saved-note').textContent = `Saved ${clicks.length} swatches`;

  if (currentPhotoIdx + 1 < photos.length) {
    setTimeout(() => {
      loadPhoto(currentPhotoIdx + 1);
      document.getElementById('pitem-' + (currentPhotoIdx)).scrollIntoView({block:'nearest'});
    }, 400);
  }
}
</script>
</body>
</html>
"""


class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, fmt, *args): pass

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(parsed.query)

        if parsed.path == '/':
            centers = load_centers()
            design_centers = load_design_centers()
            photos_json = json.dumps(studio_photos)
            groups_json = json.dumps(photo_groups)
            skus_json = json.dumps(all_skus)
            design_skus_json = json.dumps(design_skus, ensure_ascii=False)
            centers_json = json.dumps(centers, ensure_ascii=False)
            design_centers_json = json.dumps(design_centers, ensure_ascii=False)
            html = (HTML
                .replace('PHOTOS_JSON', photos_json)
                .replace('GROUPS_JSON', groups_json)
                .replace('DESIGN_SKUS_JSON', design_skus_json)
                .replace('SKUS_JSON', skus_json)
                .replace('DESIGN_CENTERS_JSON', design_centers_json)
                .replace('CENTERS_JSON', centers_json)
                .replace('PHOTO_COUNT', str(len(studio_photos))))
            self._respond(200, 'text/html; charset=utf-8', html.encode())

        elif parsed.path == '/image':
            rel = qs.get('photo', [''])[0]
            try:
                data = heic_to_jpeg_cached(rel)
                self._respond(200, 'image/jpeg', data)
            except Exception as e:
                self._respond(500, 'text/plain', str(e).encode())

        elif parsed.path == '/preview':
            rel = qs.get('photo', [''])[0]
            x_frac = float(qs.get('x', [0.5])[0])
            y_frac = float(qs.get('y', [0.5])[0])
            crop_half_frac = float(qs.get('size', [0.18])[0])
            try:
                heic_to_jpeg_cached(rel)
                cache_path = CACHE_DIR / f"{rel_to_cache_stem(rel)}_2400.jpg"
                from PIL import Image as PILImage
                import numpy as np
                arr = np.array(PILImage.open(cache_path).convert('RGB'))
                h, w = arr.shape[:2]
                cx, cy = int(x_frac * w), int(y_frac * h)
                half = int(crop_half_frac * min(h, w))
                x1, y1 = max(0, cx-half), max(0, cy-half)
                x2, y2 = min(w, cx+half), min(h, cy+half)
                crop = PILImage.fromarray(arr[y1:y2, x1:x2]).resize((100, 100), PILImage.LANCZOS)
                buf = __import__('io').BytesIO()
                crop.save(buf, 'JPEG', quality=80)
                self._respond(200, 'image/jpeg', buf.getvalue())
            except Exception as e:
                self._respond(500, 'text/plain', str(e).encode())

        elif parsed.path == '/suggest':
            rel = qs.get('photo', [''])[0]
            x_frac = float(qs.get('x', [0.5])[0])
            y_frac = float(qs.get('y', [0.5])[0])
            crop_half_frac = float(qs.get('size', [0.18])[0])
            used_json = qs.get('used', ['[]'])[0]
            used_skus = set(json.loads(urllib.parse.unquote(used_json)))

            try:
                # Exclude both current-photo clicks and globally saved SKUs to avoid overwriting
                saved_skus = set(load_centers().keys())
                excluded = used_skus | saved_skus

                # Pick first sequential unused SKU from this design's ordered list
                candidates = skus_for_photo(rel)
                available = [s for s in candidates if s not in excluded]
                next_sku = available[0] if available else (candidates[0] if candidates else '')

                cache_path = CACHE_DIR / f"{rel_to_cache_stem(rel)}_2400.jpg"
                from PIL import Image as PILImage
                import numpy as np
                arr = np.array(PILImage.open(cache_path).convert('RGB'))
                h, w = arr.shape[:2]
                cx, cy = int(x_frac * w), int(y_frac * h)
                half = int(crop_half_frac * min(h, w))
                x1, y1 = max(0, cx-half), max(0, cy-half)
                x2, y2 = min(w, cx+half), min(h, cy+half)
                crop = PILImage.fromarray(arr[y1:y2, x1:x2]).resize((100, 100), PILImage.LANCZOS)
                buf = __import__('io').BytesIO()
                crop.save(buf, 'JPEG', quality=80)
                preview_b64 = 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()

                result = {'sku': next_sku, 'preview': preview_b64}
                self._respond(200, 'application/json', json.dumps(result).encode())
            except Exception as e:
                import traceback; traceback.print_exc()
                self._respond(500, 'application/json', json.dumps({'suggestions': [], 'error': str(e)}).encode())

        elif parsed.path == '/design-suggest':
            rel = qs.get('photo', [''])[0]
            x_frac = float(qs.get('x', [0.5])[0])
            y_frac = float(qs.get('y', [0.5])[0])
            crop_half_frac = float(qs.get('size', [0.30])[0])
            try:
                heic_to_jpeg_cached(rel)
                cache_path = CACHE_DIR / f"{rel_to_cache_stem(rel)}_2400.jpg"
                from PIL import Image as PILImage
                import numpy as np
                arr = np.array(PILImage.open(cache_path).convert('RGB'))
                h, w = arr.shape[:2]
                cx, cy = int(x_frac * w), int(y_frac * h)
                half = int(crop_half_frac * min(h, w))
                x1, y1 = max(0, cx-half), max(0, cy-half)
                x2, y2 = min(w, cx+half), min(h, cy+half)
                crop = PILImage.fromarray(arr[y1:y2, x1:x2]).resize((100, 100), PILImage.LANCZOS)
                buf = __import__('io').BytesIO()
                crop.save(buf, 'JPEG', quality=80)
                preview_b64 = 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()
                parts = Path(rel).parts
                design_name = parts[1] if len(parts) == 3 else rel
                print(f'[design-suggest] {design_name} @ ({x_frac:.3f},{y_frac:.3f}) size={crop_half_frac:.2f}')
                self._respond(200, 'application/json', json.dumps({'design': design_name, 'preview': preview_b64}).encode())
            except Exception as e:
                import traceback; traceback.print_exc()
                self._respond(500, 'application/json', json.dumps({'error': str(e)}).encode())

        else:
            self._respond(404, 'text/plain', b'not found')

    def do_POST(self):
        if self.path == '/save':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            save_centers(json.loads(body))
            self._respond(200, 'application/json', b'{"ok":true}')
        elif self.path == '/save-design':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            save_design_centers(json.loads(body))
            self._respond(200, 'application/json', b'{"ok":true}')
        else:
            self._respond(404, 'text/plain', b'not found')

    def _respond(self, code, ctype, body):
        self.send_response(code)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', len(body))
        self.end_headers()
        self.wfile.write(body)


if __name__ == '__main__':
    port = 8900
    server = http.server.HTTPServer(('localhost', port), Handler)
    print(f'Studio Swatch Picker → http://localhost:{port}')
    print(f'  {len(studio_photos)} photos in {sum(len(d) for d in photo_groups.values())} designs')
    print(f'  {len(all_skus)} SKUs · Output: {CENTERS_OUT}')
    server.serve_forever()
