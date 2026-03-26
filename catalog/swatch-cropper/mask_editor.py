"""
Mask editor for room template curtain polygons.
Draws curtain polygon overlays on room templates and saves:
  - PNG mask (white curtain region, black outside) to room-templates/room-XX-mask.png
  - Updated curtain_polygon back to rooms.json

Server: http://localhost:8901
"""
import json
import struct
import zlib
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

BASE         = Path('/Users/semsettin/workspace/inanc-tekstil/catalog')
TEMPLATES    = BASE / 'room-templates'
ROOMS_JSON   = TEMPLATES / 'rooms.json'

PORT = 8901

# ── PNG writer (no PIL dependency for masks) ─────────────────────────────────

def write_png_mask(polygon_points, width, height, out_path: Path):
    """Write a binary mask PNG: white inside polygon, black outside."""
    import struct, zlib

    # Rasterize polygon into row data
    pixels = bytearray(width * height)  # 0 = black

    # Scanline fill using ray casting
    for y in range(height):
        intersections = []
        n = len(polygon_points)
        for i in range(n):
            x1, y1 = polygon_points[i]
            x2, y2 = polygon_points[(i + 1) % n]
            if (y1 <= y < y2) or (y2 <= y < y1):
                xi = x1 + (y - y1) * (x2 - x1) / (y2 - y1)
                intersections.append(xi)
        intersections.sort()
        for i in range(0, len(intersections) - 1, 2):
            xstart = max(0, int(intersections[i]))
            xend   = min(width, int(intersections[i + 1]) + 1)
            for x in range(xstart, xend):
                pixels[y * width + x] = 255

    # Build PNG
    def make_chunk(ctype, data):
        c = ctype + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xFFFFFFFF)

    sig = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 0, 0, 0, 0)  # 8-bit grayscale
    ihdr = make_chunk(b'IHDR', ihdr_data)

    # Raw image data: each row prefixed with filter byte 0
    raw_rows = b''
    for y in range(height):
        raw_rows += b'\x00' + bytes(pixels[y * width:(y + 1) * width])
    idat = make_chunk(b'IDAT', zlib.compress(raw_rows))
    iend = make_chunk(b'IEND', b'')

    out_path.write_bytes(sig + ihdr + idat + iend)

    white_px = sum(1 for p in pixels if p == 255)
    total_px = width * height
    pct = 100 * white_px / total_px
    print(f'[mask_editor] Mask saved: {out_path.name}  '
          f'white={white_px:,} px ({pct:.1f}%)  points={len(polygon_points)}')
    return white_px, pct


# ── HTML ──────────────────────────────────────────────────────────────────────

def build_html():
    return """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Mask Editor — Room Templates</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: monospace; background: #1a1a1a; color: #e0e0e0; display: flex; height: 100vh; }
#sidebar {
  width: 280px; min-width: 280px; background: #252525; padding: 16px;
  display: flex; flex-direction: column; gap: 12px; overflow-y: auto;
}
#main { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 16px; gap: 12px; overflow: hidden; }
h2 { font-size: 13px; color: #aaa; text-transform: uppercase; letter-spacing: 1px; }
select, button { width: 100%; padding: 8px 10px; border-radius: 4px; border: 1px solid #444; background: #333; color: #e0e0e0; font-family: monospace; font-size: 13px; cursor: pointer; }
button.primary { background: #3a7d44; border-color: #4a9d54; color: #fff; font-weight: bold; }
button.primary:hover { background: #4a9d54; }
button.danger { background: #7d3a3a; border-color: #9d4a4a; color: #fff; }
button.danger:hover { background: #9d4a4a; }
button:disabled { opacity: 0.4; cursor: not-allowed; }
#canvas-wrap { position: relative; }
canvas { display: block; cursor: crosshair; border: 2px solid #444; background: #000; }
#info-panel {
  width: 100%; background: #1e2a1e; border: 1px solid #2a4a2a; border-radius: 4px;
  padding: 10px 12px; font-size: 12px; line-height: 1.6; color: #90d090;
  min-height: 60px;
}
#point-list { font-size: 11px; color: #888; max-height: 180px; overflow-y: auto; }
.point-item { padding: 2px 0; }
.divider { border-top: 1px solid #333; }
#status { font-size: 11px; color: #aaa; text-align: center; }
#layer-toggle { display: flex; gap: 6px; }
#layer-toggle button { width: auto; flex: 1; padding: 6px; font-size: 12px; }
button.active-layer { background: #2a4a6a; border-color: #3a6a9a; color: #7ac0f0; }
</style>
</head>
<body>
<div id="sidebar">
  <h2>Room</h2>
  <select id="room-select">
    <option value="room-01">room-01 — Terracotta (TÜL)</option>
    <option value="room-02">room-02 — Wine (TÜL)</option>
    <option value="room-03">room-03 — Blue (FON+TÜL)</option>
    <option value="room-04" selected>room-04 — Dark Green (BLACKOUT/FON)</option>
  </select>

  <div class="divider"></div>
  <h2>Layer</h2>
  <div id="layer-toggle">
    <button id="btn-main-layer" class="active-layer" onclick="setLayer('curtain_polygon')">Main curtain</button>
    <button id="btn-sheer-layer" onclick="setLayer('sheer_polygon')">Sheer layer</button>
  </div>
  <div id="layer-hint" style="font-size:11px;color:#777;">room-03 only: draw opaque FON first, then sheer TÜL</div>

  <div class="divider"></div>
  <h2>Actions</h2>
  <button onclick="undoLast()">Undo last point</button>
  <button class="danger" onclick="clearPolygon()">Clear polygon</button>
  <button class="primary" id="save-btn" onclick="saveMask()" disabled>Save mask + JSON</button>

  <div class="divider"></div>
  <div id="info-panel">Click on the canvas to add polygon points.<br>Right-click to close polygon.</div>

  <div class="divider"></div>
  <h2>Points (<span id="pt-count">0</span>)</h2>
  <div id="point-list"></div>

  <div class="divider"></div>
  <h2>Saved masks</h2>
  <div id="saved-list" style="font-size:11px;color:#888;"></div>
</div>

<div id="main">
  <div id="status">Loading...</div>
  <div id="canvas-wrap">
    <canvas id="canvas"></canvas>
  </div>
</div>

<script>
const ROOMS = {
  'room-01': { file: 'room-01-terracotta-wall-v2.jpg', type: 'sheer', double: false },
  'room-02': { file: 'room-02-wine-wall-v2.jpg',       type: 'sheer', double: false },
  'room-03': { file: 'room-03-blue-wall-v2.jpg',       type: 'double', double: true },
  'room-04': { file: 'room-04-dark-green-v2.jpg',      type: 'opaque', double: false },
};

let currentRoom   = 'room-04';
let activeLayer   = 'curtain_polygon';
let polygons      = {};   // { 'room-01': { curtain_polygon: [...], sheer_polygon: [...] } }
let imgEl         = null;
let imgNW = 0, imgNH = 0;
let scale = 1;
let savedMasks    = {};

const canvas = document.getElementById('canvas');
const ctx    = canvas.getContext('2d');

function initRoom(roomId) {
  if (!polygons[roomId]) polygons[roomId] = { curtain_polygon: [], sheer_polygon: [] };
  currentRoom = roomId;
  activeLayer = 'curtain_polygon';
  updateLayerButtons();

  document.getElementById('status').textContent = 'Loading ' + roomId + '...';
  imgEl = new Image();
  imgEl.onload = () => {
    imgNW = imgEl.naturalWidth;
    imgNH = imgEl.naturalHeight;
    // Scale to fit viewport
    const maxW = window.innerWidth - 320;
    const maxH = window.innerHeight - 80;
    scale = Math.min(maxW / imgNW, maxH / imgNH, 1);
    canvas.width  = Math.round(imgNW * scale);
    canvas.height = Math.round(imgNH * scale);
    document.getElementById('status').textContent =
      roomId + '  ' + imgNW + 'x' + imgNH + '  (display: ' + canvas.width + 'x' + canvas.height + ')';
    redraw();
  };
  imgEl.src = '/room-image/' + ROOMS[roomId].file;
}

function currentPolygon() {
  return polygons[currentRoom][activeLayer] || [];
}

function setCurrentPolygon(pts) {
  polygons[currentRoom][activeLayer] = pts;
}

function setLayer(layer) {
  activeLayer = layer;
  updateLayerButtons();
  redraw();
  updateUI();
}

function updateLayerButtons() {
  document.getElementById('btn-main-layer').className =
    activeLayer === 'curtain_polygon' ? 'active-layer' : '';
  document.getElementById('btn-sheer-layer').className =
    activeLayer === 'sheer_polygon' ? 'active-layer' : '';
}

function redraw() {
  if (!imgEl) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);

  // Draw all layers
  drawPolygonLayer(polygons[currentRoom].curtain_polygon || [], '#00ff88', 'Main curtain');
  if (ROOMS[currentRoom].double) {
    drawPolygonLayer(polygons[currentRoom].sheer_polygon || [], '#44aaff', 'Sheer layer');
  }
}

function drawPolygonLayer(pts, color, label) {
  if (!pts || pts.length === 0) return;

  // Fill polygon
  ctx.save();
  ctx.beginPath();
  pts.forEach((p, i) => {
    const sx = p[0] * scale, sy = p[1] * scale;
    if (i === 0) ctx.moveTo(sx, sy);
    else         ctx.lineTo(sx, sy);
  });
  ctx.closePath();
  ctx.fillStyle = color + '33';  // 20% opacity fill
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // Draw points
  pts.forEach((p, i) => {
    const sx = p[0] * scale, sy = p[1] * scale;
    ctx.save();
    ctx.beginPath();
    ctx.arc(sx, sy, i === 0 ? 7 : 5, 0, Math.PI * 2);
    ctx.fillStyle = i === 0 ? '#fff' : color;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Point index
    ctx.fillStyle = '#000';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(i, sx, sy);
    ctx.restore();
  });

  // Label
  if (pts.length > 0) {
    const cx = pts.reduce((s,p) => s + p[0], 0) / pts.length * scale;
    const cy = pts.reduce((s,p) => s + p[1], 0) / pts.length * scale;
    ctx.save();
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(label + ' (' + pts.length + 'pts)', cx, cy);
    ctx.restore();
  }
}

canvas.addEventListener('click', e => {
  if (!imgEl) return;
  const rect = canvas.getBoundingClientRect();
  const cx = (e.clientX - rect.left) / scale;
  const cy = (e.clientY - rect.top)  / scale;
  // Clamp to image bounds
  const x = Math.round(Math.max(0, Math.min(imgNW, cx)));
  const y = Math.round(Math.max(0, Math.min(imgNH, cy)));
  const pts = currentPolygon().slice();
  pts.push([x, y]);
  setCurrentPolygon(pts);
  redraw();
  updateUI();
});

canvas.addEventListener('contextmenu', e => {
  e.preventDefault();
  // Close polygon (do nothing — polygon is always rendered as closed)
  // Just a visual confirmation
  const pts = currentPolygon();
  if (pts.length >= 3) {
    updateInfo('Polygon closed (' + pts.length + ' pts). Ready to save.');
  }
});

function undoLast() {
  const pts = currentPolygon().slice();
  if (pts.length > 0) {
    pts.pop();
    setCurrentPolygon(pts);
    redraw();
    updateUI();
  }
}

function clearPolygon() {
  setCurrentPolygon([]);
  redraw();
  updateUI();
}

async function saveMask() {
  const main   = polygons[currentRoom].curtain_polygon || [];
  const sheer  = polygons[currentRoom].sheer_polygon   || [];
  const active = activeLayer === 'curtain_polygon' ? main : sheer;
  if (active.length < 3) {
    updateInfo('Need at least 3 points to save a mask.');
    return;
  }

  document.getElementById('save-btn').disabled = true;
  updateInfo('Saving...');

  try {
    const resp = await fetch('/save-mask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_id:          currentRoom,
        layer:            activeLayer,
        curtain_polygon:  main,
        sheer_polygon:    sheer,
      }),
    });
    const result = await resp.json();
    if (result.ok) {
      savedMasks[currentRoom + ':' + activeLayer] = result;
      updateInfo(
        'Saved: ' + result.mask_file + '\\n' +
        'White area: ' + result.white_px.toLocaleString() + ' px (' + result.pct.toFixed(1) + '%)'
      );
      updateSavedList();
    } else {
      updateInfo('Error: ' + result.error);
    }
  } catch (err) {
    updateInfo('Request failed: ' + err);
  }

  document.getElementById('save-btn').disabled = false;
}

function updateUI() {
  const pts = currentPolygon();
  document.getElementById('pt-count').textContent = pts.length;

  // Point list
  const list = document.getElementById('point-list');
  list.innerHTML = pts.map((p, i) =>
    '<div class="point-item">' + i + ': (' + p[0] + ', ' + p[1] + ')</div>'
  ).join('');

  // Save button enabled if >= 3 points
  document.getElementById('save-btn').disabled = pts.length < 3;

  if (pts.length === 0) {
    updateInfo('Click on the canvas to add polygon points.\\nRight-click to confirm polygon.');
  } else if (pts.length < 3) {
    updateInfo('Add at least ' + (3 - pts.length) + ' more point(s).');
  } else {
    updateInfo(pts.length + ' points.  Ready to save (or add more points).');
  }
}

function updateInfo(msg) {
  document.getElementById('info-panel').textContent = msg;
}

function updateSavedList() {
  const el = document.getElementById('saved-list');
  el.innerHTML = Object.entries(savedMasks).map(([k, v]) =>
    '<div>' + k + ': ' + v.pct.toFixed(1) + '%</div>'
  ).join('');
}

document.getElementById('room-select').addEventListener('change', e => {
  initRoom(e.target.value);
});

// Init
initRoom('room-04');
</script>
</body>
</html>
"""


# ── HTTP handler ──────────────────────────────────────────────────────────────

class Handler(BaseHTTPRequestHandler):

    def log_message(self, fmt, *args):
        pass  # suppress default Apache-style logging

    def do_GET(self):
        if self.path == '/':
            self._send_html(build_html())

        elif self.path.startswith('/room-image/'):
            fname = self.path[len('/room-image/'):]
            fpath = TEMPLATES / fname
            if fpath.exists() and fpath.suffix.lower() in ('.jpg', '.jpeg', '.png'):
                data = fpath.read_bytes()
                self.send_response(200)
                self.send_header('Content-Type', 'image/jpeg')
                self.send_header('Content-Length', str(len(data)))
                self.end_headers()
                self.wfile.write(data)
            else:
                self._send_404()

        else:
            self._send_404()

    def do_POST(self):
        if self.path == '/save-mask':
            length = int(self.headers.get('Content-Length', 0))
            body   = self.rfile.read(length)
            try:
                data        = json.loads(body)
                room_id     = data['room_id']
                layer       = data['layer']
                curtain_pts = data.get('curtain_polygon', [])
                sheer_pts   = data.get('sheer_polygon', [])

                # Choose which polygon to rasterize
                pts = curtain_pts if layer == 'curtain_polygon' else sheer_pts
                if len(pts) < 3:
                    self._send_json({'ok': False, 'error': 'Need at least 3 points'})
                    return

                suffix = '' if layer == 'curtain_polygon' else '-sheer'
                mask_name = f'{room_id}{suffix}-mask.png'
                mask_path = TEMPLATES / mask_name

                white_px, pct = write_png_mask(pts, 1024, 1024, mask_path)

                # Update rooms.json
                rooms_data = json.loads(ROOMS_JSON.read_text())
                room_cfg   = rooms_data['rooms'][room_id]
                room_cfg[layer] = pts
                if sheer_pts and layer == 'curtain_polygon':
                    # preserve existing sheer if we only saved main
                    pass
                elif layer == 'sheer_polygon':
                    room_cfg['sheer_polygon'] = sheer_pts
                ROOMS_JSON.write_text(json.dumps(rooms_data, indent=2, ensure_ascii=False))

                print(f'[mask_editor] {room_id} {layer}: {len(pts)} pts → {mask_name}  '
                      f'white={white_px:,}px ({pct:.1f}%)')

                self._send_json({
                    'ok': True,
                    'mask_file': mask_name,
                    'white_px':  white_px,
                    'pct':       pct,
                    'points':    len(pts),
                })
            except Exception as e:
                import traceback
                traceback.print_exc()
                self._send_json({'ok': False, 'error': str(e)})
        else:
            self._send_404()

    def _send_html(self, html: str):
        data = html.encode()
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _send_json(self, obj: dict):
        data = json.dumps(obj).encode()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _send_404(self):
        self.send_response(404)
        self.end_headers()


# ── Entry point ────────────────────────────────────────────────────────────────

def main():
    server = HTTPServer(('', PORT), Handler)
    print(f'[mask_editor] Server: http://localhost:{PORT}')
    print(f'[mask_editor] Templates: {TEMPLATES}')
    print(f'[mask_editor] rooms.json: {ROOMS_JSON}')
    print(f'[mask_editor] Click polygon points on each room to define curtain regions.')
    print(f'[mask_editor] Ctrl+C to stop.')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n[mask_editor] Stopped.')


if __name__ == '__main__':
    main()
