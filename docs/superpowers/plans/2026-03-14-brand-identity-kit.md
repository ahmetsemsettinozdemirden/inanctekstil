# Brand Identity Kit Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce the complete İnanç Tekstil brand kit (6 SVG logos, favicon set, social assets, updated docs) per the white + navy redesign spec.

**Architecture:** All assets are hand-crafted SVGs using the brand's Deep Navy `#1B2A4A`. PNG/ICO derivatives are generated from SVGs using a Node.js build script (sharp + png-to-ico). The gorsel-kimlik.md doc is rewritten to replace the old earth-tone palette.

**Tech Stack:** SVG (hand-crafted), Node.js + sharp (PNG generation), png-to-ico (favicon.ico)

**Spec:** `docs/superpowers/specs/2026-03-14-brand-identity-redesign-design.md`

---

## File Structure

### New Files

```
brand-assets/
  logo/
    inanc-tekstil-logo.svg              # Horizontal, navy on white
    inanc-tekstil-logo-white.svg        # Horizontal, white for dark BG
    inanc-tekstil-icon.svg              # Icon only, navy
    inanc-tekstil-icon-white.svg        # Icon only, white
    inanc-tekstil-logo-stacked.svg      # Stacked, navy on white
    inanc-tekstil-logo-stacked-white.svg # Stacked, white for dark BG
  favicon/
    favicon.svg                         # Copy of icon SVG
    favicon.ico                         # Multi-res ICO (16+32)
    favicon-32x32.png                   # 32x32 PNG
    apple-touch-icon.png                # 180x180 PNG
    android-chrome-192x192.png          # 192x192 PNG
    android-chrome-512x512.png          # 512x512 PNG
    site.webmanifest                    # Web app manifest
  logo-png/
    inanc-tekstil-logo.png              # Horizontal navy, 800px wide
    inanc-tekstil-logo-white.png        # Horizontal white, 800px wide
    inanc-tekstil-logo-stacked.png      # Stacked navy, 400x400
    inanc-tekstil-logo-stacked-white.png # Stacked white, 400x400
  social/
    og-image.png                        # 1200x630 social share
    instagram-profile.png               # 400x400 profile pic
  build-assets.mjs                      # Node script to generate PNGs from SVGs
```

> **Note on SVG text rendering:** Logo SVGs use `<text>` elements with Playfair Display. When rendered by sharp (which uses librsvg), the font may fall back to Georgia if Playfair Display is not installed on the build system. For production-quality PNG exports, either install Playfair Display on the system or convert the wordmark `<text>` to `<path>` elements using a vector editor. The SVGs themselves render correctly in browsers that load Google Fonts.

### Modified Files

```
docs/brand/gorsel-kimlik.md            # Full rewrite with new palette
```

---

## Chunk 1: SVG Logo Assets

### Task 1: Create directory structure and fabric fold icon

**Files:**
- Create: `brand-assets/logo/inanc-tekstil-icon.svg`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p brand-assets/logo brand-assets/favicon brand-assets/social
```

- [ ] **Step 2: Create the fabric fold icon SVG**

Create `brand-assets/logo/inanc-tekstil-icon.svg` — the draped fabric fold mark:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="#1B2A4A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <!-- Three flowing curves suggesting draped fabric falling -->
  <path d="M16 8 C16 8, 12 28, 20 44 C24 52, 28 56, 32 58"/>
  <path d="M32 6 C32 6, 26 24, 32 40 C35 48, 38 54, 40 58"/>
  <path d="M48 10 C48 10, 44 26, 40 42 C38 50, 36 55, 34 58"/>
</svg>
```

Design notes:
- 3 curved lines flow from top to bottom, converging at the base
- Suggests fabric draping from a curtain rod
- Stroke-based, not filled, per spec
- 64x64 viewBox for clean scaling
- Single color: `#1B2A4A`

- [ ] **Step 3: Verify icon renders correctly**

Open in browser:
```bash
open brand-assets/logo/inanc-tekstil-icon.svg
```

Verify: 3 flowing curves visible, navy color, no fill, clean at all zoom levels.

- [ ] **Step 4: Commit**

```bash
git add brand-assets/logo/inanc-tekstil-icon.svg
git commit -m "feat(brand): add fabric fold icon SVG"
```

---

### Task 2: Create the icon-white variant

**Files:**
- Create: `brand-assets/logo/inanc-tekstil-icon-white.svg`

- [ ] **Step 1: Create white icon variant**

Same SVG as icon.svg but with `stroke="#FFFFFF"`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M16 8 C16 8, 12 28, 20 44 C24 52, 28 56, 32 58"/>
  <path d="M32 6 C32 6, 26 24, 32 40 C35 48, 38 54, 40 58"/>
  <path d="M48 10 C48 10, 44 26, 40 42 C38 50, 36 55, 34 58"/>
</svg>
```

- [ ] **Step 2: Commit**

```bash
git add brand-assets/logo/inanc-tekstil-icon-white.svg
git commit -m "feat(brand): add white icon variant SVG"
```

---

### Task 3: Create horizontal logo (navy)

**Files:**
- Create: `brand-assets/logo/inanc-tekstil-logo.svg`

- [ ] **Step 1: Create horizontal logo SVG**

Layout: icon (left) + wordmark (right). Total viewBox width ~400, height ~64. The icon occupies the left 64px, then a gap, then the wordmark text.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 64" fill="none">
  <!-- Fabric fold icon -->
  <g stroke="#1B2A4A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M16 8 C16 8, 12 28, 20 44 C24 52, 28 56, 32 58"/>
    <path d="M32 6 C32 6, 26 24, 32 40 C35 48, 38 54, 40 58"/>
    <path d="M48 10 C48 10, 44 26, 40 42 C38 50, 36 55, 34 58"/>
  </g>
  <!-- Wordmark: İnanç Tekstil -->
  <text x="80" y="44" font-family="'Playfair Display', Georgia, serif" font-weight="700" font-size="36" fill="#1B2A4A">İnanç Tekstil</text>
</svg>
```

Notes:
- `font-family` includes fallback serif for systems without Playfair Display
- Text vertically centered (y=44 for baseline in 64px height)
- Turkish characters İ and ç used directly in the SVG text element

- [ ] **Step 2: Verify in browser**

```bash
open brand-assets/logo/inanc-tekstil-logo.svg
```

Verify: icon left, "İnanç Tekstil" right, navy color, İ dot and ç cedilla render.

- [ ] **Step 3: Commit**

```bash
git add brand-assets/logo/inanc-tekstil-logo.svg
git commit -m "feat(brand): add horizontal logo SVG (navy)"
```

---

### Task 4: Create horizontal logo (white)

**Files:**
- Create: `brand-assets/logo/inanc-tekstil-logo-white.svg`

- [ ] **Step 1: Create white horizontal logo**

Same as logo.svg but all colors changed to `#FFFFFF`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 64" fill="none">
  <g stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M16 8 C16 8, 12 28, 20 44 C24 52, 28 56, 32 58"/>
    <path d="M32 6 C32 6, 26 24, 32 40 C35 48, 38 54, 40 58"/>
    <path d="M48 10 C48 10, 44 26, 40 42 C38 50, 36 55, 34 58"/>
  </g>
  <text x="80" y="44" font-family="'Playfair Display', Georgia, serif" font-weight="700" font-size="36" fill="#FFFFFF">İnanç Tekstil</text>
</svg>
```

- [ ] **Step 2: Commit**

```bash
git add brand-assets/logo/inanc-tekstil-logo-white.svg
git commit -m "feat(brand): add horizontal logo SVG (white)"
```

---

### Task 5: Create stacked logo (navy)

**Files:**
- Create: `brand-assets/logo/inanc-tekstil-logo-stacked.svg`

- [ ] **Step 1: Create stacked logo SVG**

Icon on top, wordmark below. ViewBox ~240x120.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 120" fill="none">
  <!-- Fabric fold icon, centered horizontally -->
  <g stroke="#1B2A4A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" transform="translate(88, 0)">
    <path d="M16 8 C16 8, 12 28, 20 44 C24 52, 28 56, 32 58"/>
    <path d="M32 6 C32 6, 26 24, 32 40 C35 48, 38 54, 40 58"/>
    <path d="M48 10 C48 10, 44 26, 40 42 C38 50, 36 55, 34 58"/>
  </g>
  <!-- Wordmark centered below icon -->
  <text x="120" y="100" text-anchor="middle" font-family="'Playfair Display', Georgia, serif" font-weight="700" font-size="28" fill="#1B2A4A">İnanç Tekstil</text>
</svg>
```

- [ ] **Step 2: Verify in browser**

```bash
open brand-assets/logo/inanc-tekstil-logo-stacked.svg
```

Verify: icon centered on top, text centered below, balanced layout.

- [ ] **Step 3: Commit**

```bash
git add brand-assets/logo/inanc-tekstil-logo-stacked.svg
git commit -m "feat(brand): add stacked logo SVG (navy)"
```

---

### Task 6: Create stacked logo (white)

**Files:**
- Create: `brand-assets/logo/inanc-tekstil-logo-stacked-white.svg`

- [ ] **Step 1: Create white stacked logo**

Same as stacked.svg but all colors `#FFFFFF`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 120" fill="none">
  <g stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" transform="translate(88, 0)">
    <path d="M16 8 C16 8, 12 28, 20 44 C24 52, 28 56, 32 58"/>
    <path d="M32 6 C32 6, 26 24, 32 40 C35 48, 38 54, 40 58"/>
    <path d="M48 10 C48 10, 44 26, 40 42 C38 50, 36 55, 34 58"/>
  </g>
  <text x="120" y="100" text-anchor="middle" font-family="'Playfair Display', Georgia, serif" font-weight="700" font-size="28" fill="#FFFFFF">İnanç Tekstil</text>
</svg>
```

- [ ] **Step 2: Commit**

```bash
git add brand-assets/logo/inanc-tekstil-logo-stacked-white.svg
git commit -m "feat(brand): add stacked logo SVG (white)"
```

---

## Chunk 2: Favicon Set, Social Assets, and Build Script

### Task 7: Create the PNG build script

**Files:**
- Create: `brand-assets/build-assets.mjs`

- [ ] **Step 1: Initialize npm and install dependencies**

```bash
cd /Users/semsettin/workspace/inanc-tekstil/brand-assets
npm init -y
npm install sharp png-to-ico
```

- [ ] **Step 2: Create the build script**

Create `brand-assets/build-assets.mjs`:

```javascript
import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const NAVY = '#1B2A4A';
const WHITE = '#FFFFFF';

// Read source SVGs
const iconSvg = readFileSync(join(__dirname, 'logo/inanc-tekstil-icon.svg'));
const stackedSvg = readFileSync(join(__dirname, 'logo/inanc-tekstil-logo-stacked.svg'));

// Ensure output dirs exist
mkdirSync(join(__dirname, 'favicon'), { recursive: true });
mkdirSync(join(__dirname, 'social'), { recursive: true });

async function buildFavicons() {
  console.log('Building favicons...');

  // favicon-32x32.png
  await sharp(iconSvg)
    .resize(32, 32)
    .png()
    .toFile(join(__dirname, 'favicon/favicon-32x32.png'));
  console.log('  favicon-32x32.png');

  // 16x16 for ICO
  await sharp(iconSvg)
    .resize(16, 16)
    .png()
    .toFile(join(__dirname, 'favicon/favicon-16x16.png'));

  // favicon.ico (16 + 32)
  const icoBuffer = await pngToIco([
    join(__dirname, 'favicon/favicon-16x16.png'),
    join(__dirname, 'favicon/favicon-32x32.png'),
  ]);
  writeFileSync(join(__dirname, 'favicon/favicon.ico'), icoBuffer);
  console.log('  favicon.ico');

  // apple-touch-icon.png (180x180, icon centered with padding)
  const iconPadded180 = await sharp(iconSvg)
    .resize(120, 120)
    .png()
    .toBuffer();
  await sharp({
    create: { width: 180, height: 180, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
  })
    .composite([{ input: iconPadded180, gravity: 'centre' }])
    .png()
    .toFile(join(__dirname, 'favicon/apple-touch-icon.png'));
  console.log('  apple-touch-icon.png');

  // android-chrome-192x192.png
  const iconPadded192 = await sharp(iconSvg)
    .resize(128, 128)
    .png()
    .toBuffer();
  await sharp({
    create: { width: 192, height: 192, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
  })
    .composite([{ input: iconPadded192, gravity: 'centre' }])
    .png()
    .toFile(join(__dirname, 'favicon/android-chrome-192x192.png'));
  console.log('  android-chrome-192x192.png');

  // android-chrome-512x512.png
  const iconPadded512 = await sharp(iconSvg)
    .resize(340, 340)
    .png()
    .toBuffer();
  await sharp({
    create: { width: 512, height: 512, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
  })
    .composite([{ input: iconPadded512, gravity: 'centre' }])
    .png()
    .toFile(join(__dirname, 'favicon/android-chrome-512x512.png'));
  console.log('  android-chrome-512x512.png');

  // favicon.svg (copy of icon SVG)
  writeFileSync(
    join(__dirname, 'favicon/favicon.svg'),
    readFileSync(join(__dirname, 'logo/inanc-tekstil-icon.svg'))
  );
  console.log('  favicon.svg');
}

async function buildLogoPngs() {
  console.log('Building logo PNGs...');
  mkdirSync(join(__dirname, 'logo-png'), { recursive: true });

  const logoSvg = readFileSync(join(__dirname, 'logo/inanc-tekstil-logo.svg'));
  const logoWhiteSvg = readFileSync(join(__dirname, 'logo/inanc-tekstil-logo-white.svg'));
  const stackedWhiteSvg = readFileSync(join(__dirname, 'logo/inanc-tekstil-logo-stacked-white.svg'));

  // Horizontal navy — 800px wide
  await sharp(logoSvg).resize(800, null).png().toFile(join(__dirname, 'logo-png/inanc-tekstil-logo.png'));
  console.log('  inanc-tekstil-logo.png');

  // Horizontal white — 800px wide (transparent BG)
  await sharp(logoWhiteSvg).resize(800, null).png().toFile(join(__dirname, 'logo-png/inanc-tekstil-logo-white.png'));
  console.log('  inanc-tekstil-logo-white.png');

  // Stacked navy — 400x400
  const stackedNavyResized = await sharp(stackedSvg).resize(360, 180).png().toBuffer();
  await sharp({ create: { width: 400, height: 400, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
    .composite([{ input: stackedNavyResized, gravity: 'centre' }])
    .png()
    .toFile(join(__dirname, 'logo-png/inanc-tekstil-logo-stacked.png'));
  console.log('  inanc-tekstil-logo-stacked.png');

  // Stacked white — 400x400 (transparent BG)
  const stackedWhiteResized = await sharp(stackedWhiteSvg).resize(360, 180).png().toBuffer();
  await sharp({ create: { width: 400, height: 400, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: stackedWhiteResized, gravity: 'centre' }])
    .png()
    .toFile(join(__dirname, 'logo-png/inanc-tekstil-logo-stacked-white.png'));
  console.log('  inanc-tekstil-logo-stacked-white.png');
}

async function buildSocialAssets() {
  console.log('Building social assets...');

  // instagram-profile.png (400x400, icon centered on white)
  const iconForInsta = await sharp(iconSvg)
    .resize(260, 260)
    .png()
    .toBuffer();
  await sharp({
    create: { width: 400, height: 400, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
  })
    .composite([{ input: iconForInsta, gravity: 'centre' }])
    .png()
    .toFile(join(__dirname, 'social/instagram-profile.png'));
  console.log('  instagram-profile.png');

  // og-image.png (1200x630)
  // White background with stacked logo centered + tagline
  // We compose the stacked logo SVG onto a white canvas
  const stackedForOg = await sharp(stackedSvg)
    .resize(360, 180)
    .png()
    .toBuffer();

  // Create tagline as SVG text
  const taglineSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="40">
    <text x="400" y="30" text-anchor="middle" font-family="Inter, 'Helvetica Neue', Arial, sans-serif" font-weight="500" font-size="18" fill="#1B2A4A">Ölçünüze Özel Dikim Perde — İskenderun</text>
  </svg>`);
  const taglinePng = await sharp(taglineSvg).png().toBuffer();

  await sharp({
    create: { width: 1200, height: 630, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
  })
    .composite([
      { input: stackedForOg, top: 160, left: 420 },
      { input: taglinePng, top: 380, left: 200 },
    ])
    .png()
    .toFile(join(__dirname, 'social/og-image.png'));
  console.log('  og-image.png');
}

async function main() {
  await buildFavicons();
  await buildLogoPngs();
  await buildSocialAssets();

  console.log('\nAll assets built successfully!');
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
```

- [ ] **Step 3: Commit build script**

```bash
git add brand-assets/build-assets.mjs brand-assets/package.json
git commit -m "feat(brand): add PNG/ICO build script using sharp"
```

---

### Task 8: Create site.webmanifest

**Files:**
- Create: `brand-assets/favicon/site.webmanifest`

- [ ] **Step 1: Create webmanifest file**

```json
{
  "name": "İnanç Tekstil",
  "short_name": "İnanç Tekstil",
  "icons": [
    {
      "src": "android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#1B2A4A",
  "background_color": "#FFFFFF",
  "display": "standalone"
}
```

- [ ] **Step 2: Commit**

```bash
git add brand-assets/favicon/site.webmanifest
git commit -m "feat(brand): add site.webmanifest"
```

---

### Task 9: Run build script and generate all PNG/ICO assets

**Files:**
- Generate: all files in `brand-assets/favicon/` and `brand-assets/social/`

- [ ] **Step 1: Run the build**

```bash
cd /Users/semsettin/workspace/inanc-tekstil/brand-assets
node build-assets.mjs
```

Expected output:
```
Building favicons...
  favicon-32x32.png
  favicon.ico
  apple-touch-icon.png
  android-chrome-192x192.png
  android-chrome-512x512.png
  favicon.svg
Building social assets...
  instagram-profile.png
  og-image.png

All assets built successfully!
```

- [ ] **Step 2: Verify generated files exist and have correct dimensions**

```bash
cd /Users/semsettin/workspace/inanc-tekstil
ls -la brand-assets/favicon/
ls -la brand-assets/social/
# Check dimensions with sips
sips -g pixelWidth -g pixelHeight brand-assets/favicon/favicon-32x32.png
sips -g pixelWidth -g pixelHeight brand-assets/favicon/apple-touch-icon.png
sips -g pixelWidth -g pixelHeight brand-assets/favicon/android-chrome-192x192.png
sips -g pixelWidth -g pixelHeight brand-assets/favicon/android-chrome-512x512.png
sips -g pixelWidth -g pixelHeight brand-assets/social/og-image.png
sips -g pixelWidth -g pixelHeight brand-assets/social/instagram-profile.png
```

Expected: 32x32, 180x180, 192x192, 512x512, 1200x630, 400x400 respectively.

- [ ] **Step 3: Visually verify key assets**

```bash
open brand-assets/favicon/apple-touch-icon.png
open brand-assets/social/og-image.png
open brand-assets/social/instagram-profile.png
```

Verify: navy icon on white background, clean rendering, proper padding.

- [ ] **Step 4: Clean up temp file and add node_modules to gitignore**

```bash
rm brand-assets/favicon/favicon-16x16.png
echo "node_modules/" >> brand-assets/.gitignore
```

- [ ] **Step 5: Commit all generated assets**

```bash
git add brand-assets/
git commit -m "feat(brand): generate favicon set and social media assets"
```

---

## Chunk 3: Documentation Update

### Task 10: Rewrite gorsel-kimlik.md

**Files:**
- Modify: `docs/brand/gorsel-kimlik.md`

- [ ] **Step 1: Read current file**

Read `docs/brand/gorsel-kimlik.md` to confirm current content before overwriting.

- [ ] **Step 2: Rewrite with new brand identity**

Replace the entire file content with the new palette, typography, logo rules, and interactive states from the spec. Key changes:

- Section 1 (Logo): Update with actual logo file paths, keep usage rules
- Section 2 (Colors): Replace all 5 earth-tone colors with the new white + navy system
- Section 3 (Typography): Update font sizes and add interactive states
- Section 4 (Photography): Keep existing photography guidelines, add note about intentional warm/cold contrast

The rewritten file should be in Turkish, matching the existing document's language and style. Reference exact file paths in `brand-assets/` for all logo variants.

Full content to write:

```markdown
# Inanc Tekstil — Gorsel Kimlik Kilavuzu

Bu dokuman, Inanc Tekstil'in gorsel kimligine dair tum kurallari icerir. Web sitesi, sosyal medya, basili materyaller ve diger tum gorsel iletisim kanallari bu kilavuza uygun olmalidir.

---

## 1. Logo

### Logo Dosyalari

| Varyant | Dosya | Kullanim |
|---------|-------|----------|
| Yatay (lacivert) | `brand-assets/logo/inanc-tekstil-logo.svg` | Site header, dokumanlar |
| Yatay (beyaz) | `brand-assets/logo/inanc-tekstil-logo-white.svg` | Footer, koyu arka planlar |
| Ikon (lacivert) | `brand-assets/logo/inanc-tekstil-icon.svg` | Favicon, uygulama ikonu |
| Ikon (beyaz) | `brand-assets/logo/inanc-tekstil-icon-white.svg` | Koyu arka plan avatar |
| Dikey (lacivert) | `brand-assets/logo/inanc-tekstil-logo-stacked.svg` | Sosyal medya profil |
| Dikey (beyaz) | `brand-assets/logo/inanc-tekstil-logo-stacked-white.svg` | Koyu arka plan sosyal medya |

### Logo Yapisi

Logo, sol tarafta soyut kumas kivrim ikonu ve sag tarafta "Inanc Tekstil" yazisindan olusmaktadir. Ikon, 2-3 adet akan egri cizgiyle dokulen kumas hissini verir.

- **Yazi tipi:** Playfair Display Bold (700)
- **Renk:** Derin Lacivert `#1B2A4A` (acik arka plan) veya Beyaz `#FFFFFF` (koyu arka plan)
- **Turk karakterleri:** I (U+0130) ve c (U+00E7) dogru gosterilmelidir

### Minimum Boyut

- Dijital kullanim icin logo genisligi en az **120 piksel** olmalidir.
- Basili materyallerde logo genisligi en az **30 mm** olmalidir.
- Ikon tek basina kullanildiginda en az **32 piksel** olmalidir.

### Bosluk Alani (Clear Space)

- Logonun her dort tarafinda, ikon yuksekligi kadar bos alan birakilmalidir.
- Bu alana baska gorsel, yazi veya dekoratif eleman yerlestirilemez.

### Arka Plan Kurallari

- Logo tercihen beyaz arka plan uzerinde kullanilir.
- Koyu arka planlarda beyaz (`-white`) varyantlari kullanilir.
- Yogun desenli veya fotografik arka planlarin uzerine logo yerlestirmekten kacinilmalidir.

### Yanlis Kullanim

- Logonun renklerini degistirmek (marka renklerinin disinda)
- Logoya golge, parlama veya 3D efekt eklemek
- Logoyu egmek, germek veya oranlarini bozmak
- Logonun uzerine yazi yazmak
- Logoyu dusuk cozunurluklu (piksellestirilmis) olarak kullanmak

---

## 2. Renk Paleti

Inanc Tekstil temiz, minimal ve profesyonel bir gorsel dil kullanir. Beyaz arka plan baskindir; urunler ve fotograflar tum renk zenginligini saglar. Tasarimin ilham kaynagi: TAC (tac.com.tr) — temiz beyaz yuzey, keskin kontrast, minimum renk.

### Ana Renkler

#### Saf Beyaz (Birincil Arka Plan)
- **HEX:** #FFFFFF
- **RGB:** 255, 255, 255
- **Kullanim:** Site arka plani, kartlar, urun sayfalari
- Ekranin yaklasik %80'ini kaplar.

#### Derin Lacivert (Marka Rengi)
- **HEX:** #1B2A4A
- **RGB:** 27, 42, 74
- **Kullanim:** Logo, basliklar, navigasyon, butonlar, footer arka plani
- Ekranin yaklasik %10'unu kaplar.

### Yardimci Notr Renkler

#### Komur Grisi (Govde Metni)
- **HEX:** #333333
- **RGB:** 51, 51, 51
- **Kullanim:** Paragraflar, aciklamalar, ikincil metinler

#### Acik Gri (Kenarliklar)
- **HEX:** #E5E5E5
- **RGB:** 229, 229, 229
- **Kullanim:** Kart kenarliklari, bolum ayricilari, input kenarliklari

#### Krik Beyaz (Ikincil Arka Plan)
- **HEX:** #F8F8F8
- **RGB:** 248, 248, 248
- **Kullanim:** Alternatif bolumlerin arka plani, hover durumlari

#### Orta Gri (Soluk Metin)
- **HEX:** #999999
- **RGB:** 153, 153, 153
- **Kullanim:** Placeholder metin, devre disi durumlar, meta bilgi

### Fonksiyonel Renkler

| Rol | HEX | Kullanim |
|-----|-----|----------|
| Basari | `#2D7D46` | Stok rozetleri, basari mesajlari |
| Hata | `#D32F2F` | Form hatalari, stokta yok |
| Link Hover | `#2A3F6B` | Lacivert buton/link hover durumu |

### Renk Kullanim Kurallari

- Arayuzde sicak tonlar (kahverengi, bej, tarcin, zeytin) **kullanilmaz**.
- Urunler ve fotograflar tum renk zenginligini saglar.
- Lacivert yalnizca vurgu icin kullanilir — beyaz baskindir.
- WCAG AAA uyumluluk: Lacivert `#1B2A4A` beyaz uzerinde 14.5:1 kontrast orani.
- Komur grisi `#333333` beyaz uzerinde 12.6:1 kontrast orani.
- Link hover `#2A3F6B` beyaz uzerinde 8.5:1 kontrast orani.

### Renk Kullanim Oranlari

- **Saf Beyaz:** ~%80 (baskin arka plan)
- **Derin Lacivert:** ~%10 (basliklar, navigasyon, butonlar, footer)
- **Komur Grisi:** ~%5 (govde metni)
- **Acik Gri / Kirik Beyaz:** ~%4 (kenarliklar, bolumlendirme)
- **Fonksiyonel renkler:** ~%1 (duruma bagli)

---

## 3. Tipografi

### Baslik Fontu: Playfair Display

- **Kaynak:** Google Fonts
- **Agirliklar:** Regular (400), Bold (700)
- **Kullanim:** Sayfa basliklari (H1, H2), urun adlari, logo
- **Renk:** Derin Lacivert `#1B2A4A`
- **Turkce Karakter Destegi:** Var

#### Alternatif: Lora

### Govde Metni Fontu: Inter

- **Kaynak:** Google Fonts
- **Agirliklar:** Regular (400), Medium (500), Semi-Bold (600)
- **Kullanim:** Paragraflar, butonlar, navigasyon, alt basliklar (H3)
- **Renk:** Komur Grisi `#333333` (govde), Lacivert `#1B2A4A` (navigasyon, H3, fiyat)
- **Turkce Karakter Destegi:** Var

#### Alternatif: Source Sans 3

### Font Boyutlari

| Eleman | Boyut (Desktop) | Boyut (Mobil) | Satir Yuksekligi | Agirlik |
|--------|-----------------|---------------|------------------|---------|
| H1 — Sayfa Basligi | 32px | 26px | 1.3 | Playfair Display Bold (700) |
| H2 — Bolum Basligi | 24px | 20px | 1.3 | Playfair Display Bold (700) |
| H3 — Alt Baslik | 18px | 16px | 1.3 | Inter Semi-Bold (600) |
| Govde Metni | 16px | 15px | 1.6 | Inter Regular (400) |
| Kucuk Metin | 13px | 13px | 1.5 | Inter Regular (400) |
| Buton Yazisi | 15px | 15px | 1.0 | Inter Medium (500) |

### Etkilesim Durumlari

| Eleman | Durum | Gosterim |
|--------|-------|----------|
| Lacivert buton | Hover | Arka plan `#2A3F6B` |
| Lacivert buton | Aktif/Basili | Arka plan `#111D33` |
| Lacivert buton | Devre Disi | Arka plan `#999999`, yazi `#FFFFFF` |
| Lacivert buton | Fokus | 2px solid `#2A3F6B` cerceve, 2px offset |
| Metin linki | Varsayilan | Lacivert `#1B2A4A`, alt cizgi yok |
| Metin linki | Hover | `#2A3F6B`, alt cizgi var |
| Input alani | Fokus | Kenarlik `#1B2A4A` (`#E5E5E5`'ten) |

### Tipografi Kurallari

- Bir sayfada 2'den fazla font ailesi kullanilmamalidir.
- Satir yuksekligi govde metni icin 1.6, basliklar icin 1.3 olmalidir.
- Paragraf araligi en az 1em olmalidir.
- TAMAMI BUYUK HARF yalnizca navigasyon linklerinde kullanilabilir (letter-spacing: 0.5px).

---

## 4. Fotograf Stili

Inanc Tekstil'in fotograflari, musteriye "bu perde benim evimde de boyle guzel durabilir" hissini vermeli. Profesyonel ama yapay olmayan, dogal ve sicak bir fotograf dili hedeflenmektedir.

> **Not:** Arayuz temiz beyaz ve lacivert iken, urun fotograflari sicak ve dogal tonlarda kalir. Bu kasitlidir — TAC ile ayni yaklasim: notr arayuz, zengin urun gorselleri. Kontrast, urunlerin one cikmasini saglar.

### Genel Ilkeler

- **Dogal isik:** Mumkun oldukca gun isiginda cekim yapilir. Sabah 9-11 arasi ve ogleden sonra 14-16 arasi en iyi isik kosullarini saglar.
- **Sicak tonlar:** Fotograflarda soguk mavi tonlardan kacinilir. Sicak, dogal renk dengesi tercih edilir.
- **Gercekcilik:** Asiri filtre ve duzenleme yapilmaz. Musteri urunun gercek rengini ve dokusunu gorebilmelidir.
- **Duzen:** Cekim alani temiz ve duzenli olmalidir.

### Cekim Turleri

#### 1. Urun Detay Cekimi (Kumas Yakin Plan)
- Kumasin dokusunu, desenini ve rengini net gosteren yakin cekim.
- Duz bir zemin uzerinde, dogal isikta cekilir.
- Arka plan olarak beyaz veya acik bej zemin kullanilir.

#### 2. Ortam Cekimi (Odada Perde)
- Perdenin bir pencereye asilmis halinin fotografi.
- Odanin genel atmosferini yansitir.
- Gunisigi ve perdenin isik gecirgenligini gosterir.

#### 3. Uretim Sureci Cekimi
- Dikis makinesi, olcu alma, kumas kesimi gibi uretim asamalari.
- Ellerin gorunmesi iscilige olan ozeni vurgular.

#### 4. Once/Sonra Cekimi
- Ayni pencerenin perdesiz ve perdeli halini gostermek.
- Ayni aci, ayni isik kosullarinda cekilmeli.

### Fotograf Dosya Formatlari

- Web sitesi icin: **WebP** (oncelikli) veya **JPEG** (kalite: %80-85)
- Sosyal medya icin: **JPEG** veya **PNG**
- Arsiv icin: Orijinal cozunurluklu dosyalar saklanmalidir
- Dosya isimlendirme ornegi: `inanc-tekstil-tul-perde-beyaz-salon-01.jpg`

---

*Son guncelleme: Mart 2026*
```

- [ ] **Step 3: Verify the rewritten file**

Read back the file and check:
- No references to old colors (F5F0EB, 5C4033, C17F59, D6CFC7, 6B7C5E)
- All new colors present (FFFFFF, 1B2A4A, 333333, E5E5E5, F8F8F8, 999999)
- Logo file paths reference brand-assets/ directory
- Photography section preserved with warm/cold contrast note
- Turkish language throughout

- [ ] **Step 4: Commit**

```bash
git add docs/brand/gorsel-kimlik.md
git commit -m "docs(brand): rewrite gorsel-kimlik with white + navy palette"
```

---

### Task 11: Final verification

- [ ] **Step 1: Verify all deliverables exist**

```bash
echo "=== Logo SVGs ==="
ls -la brand-assets/logo/
echo "=== Favicons ==="
ls -la brand-assets/favicon/
echo "=== Social ==="
ls -la brand-assets/social/
```

Expected: 6 SVGs in logo/, 7 files in favicon/, 4 PNGs in logo-png/, 2 PNGs in social/.

- [ ] **Step 2: Verify SVGs only use brand colors**

```bash
grep -r "fill\|stroke" brand-assets/logo/ | grep -v "#1B2A4A" | grep -v "#FFFFFF" | grep -v "none"
```

Expected: no output (all fills/strokes are navy, white, or none).

- [ ] **Step 3: Check spec acceptance criteria**

Run through the 8 acceptance criteria from the spec:
1. All 6 SVG logo variants — check file count in logo/
2. Favicon recognizable at 32x32 — open favicon-32x32.png
3. OG image 1200x630 — verify with sips
4. Instagram profile recognizable — open instagram-profile.png
5. gorsel-kimlik.md updated — verify no old colors
6. SVGs use only #1B2A4A or #FFFFFF — grep verified above
7. Turkish characters — open logo SVGs in browser
8. WCAG contrast — documented in spec and gorsel-kimlik.md

- [ ] **Step 4: Final commit if any cleanup needed**

```bash
git add -A
git status
# Only commit if there are changes
git commit -m "chore(brand): final brand kit cleanup"
```
