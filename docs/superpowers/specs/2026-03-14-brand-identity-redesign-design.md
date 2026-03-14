# Brand Identity Redesign — Design Spec

**Date:** 2026-03-14
**Status:** Draft
**Purpose:** Replace the warm earth-tone brand identity with a clean, minimal white + navy system inspired by TAC benchmark. Produce a complete brand kit including logo, favicon, social assets, and updated guidelines.

---

## 1. Design Direction

**Inspiration:** TAC (tac.com.tr) — clean white canvas, sharp contrast, minimal color. Products provide visual richness, not the UI.

**Core Principle:** White dominates (~80% of any screen). Navy used for emphasis only. Zero warm tones in the UI.

---

## 2. Color Palette

### Primary Colors

| Role | Name | HEX | RGB | Usage |
|------|------|-----|-----|-------|
| Background | Pure White | `#FFFFFF` | 255, 255, 255 | Site background, cards, product pages |
| Primary / Brand | Deep Navy | `#1B2A4A` | 27, 42, 74 | Logo, headings, nav text, CTA buttons, footer background |

### Supporting Neutrals

| Role | Name | HEX | RGB | Usage |
|------|------|-----|-----|-------|
| Body Text | Charcoal | `#333333` | 51, 51, 51 | Paragraphs, descriptions, secondary text |
| Borders | Light Gray | `#E5E5E5` | 229, 229, 229 | Card borders, section dividers, input borders |
| Subtle BG | Off-White | `#F8F8F8` | 248, 248, 248 | Alternating sections, hover states, category bar |
| Muted | Mid Gray | `#999999` | 153, 153, 153 | Placeholder text, disabled states, meta info |

### Functional Colors

| Role | HEX | Usage |
|------|-----|-------|
| Success | `#2D7D46` | Stock badges, success messages |
| Error | `#D32F2F` | Form errors, out-of-stock |
| Link Hover | `#2A3F6B` | Hover state for navy buttons/links |

### Color Usage Rules

- No warm tones (brown, beige, cinnamon, olive) anywhere in the UI
- Products and photography provide all color richness
- Navy used for emphasis only — white dominates (~80% of any screen)
- WCAG AA contrast: Navy `#1B2A4A` on White = 14.5:1 ratio (exceeds AAA)
- Small text in `#333333` on white = 12.6:1 ratio (exceeds AAA)
- Link hover `#2A3F6B` on white = 8.5:1 ratio (exceeds AAA)

### Color Usage Ratios

- Pure White: ~80% (dominant background)
- Deep Navy: ~10% (headings, nav, buttons, footer)
- Charcoal: ~5% (body text)
- Light Gray / Off-White: ~4% (borders, sections)
- Functional colors: ~1% (contextual only)

---

## 3. Typography

### Font Pairing

| Role | Font | Weight | Color |
|------|------|--------|-------|
| Logo wordmark | Playfair Display | Bold (700) | `#1B2A4A` |
| Page headings (H1, H2) | Playfair Display | Bold (700) | `#1B2A4A` |
| Subheadings (H3) | Inter | Semi-Bold (600) | `#1B2A4A` |
| Body text | Inter | Regular (400) | `#333333` |
| Small text / meta | Inter | Regular (400) | `#999999` |
| Buttons | Inter | Medium (500) | `#FFFFFF` on `#1B2A4A` |
| Navigation | Inter | Medium (500) | `#1B2A4A` |
| Price | Inter | Semi-Bold (600) | `#1B2A4A` |

### Font Sizing

Sizes are reduced from the previous guidelines (was H1 36px, H2 28px, Body 16px) to achieve a tighter, more TAC-like minimal feel. The smaller headings let whitespace dominate and keep the layout clean.

| Element | Desktop | Mobile | Line Height |
|---------|---------|--------|-------------|
| H1 | 32px | 26px | 1.3 |
| H2 | 24px | 20px | 1.3 |
| H3 | 18px | 16px | 1.3 |
| Body | 16px | 15px | 1.6 |
| Small | 13px | 13px | 1.5 |
| Button | 15px | 15px | 1.0 |

### Interactive States

| Element | State | Treatment |
|---------|-------|-----------|
| Navy button | Hover | Background lightens to `#2A3F6B` |
| Navy button | Active/Pressed | Background darkens to `#111D33` |
| Navy button | Disabled | Background `#999999`, text `#FFFFFF` |
| Navy button | Focus | 2px solid `#2A3F6B` outline, 2px offset |
| Text link | Default | Navy `#1B2A4A`, no underline |
| Text link | Hover | `#2A3F6B`, underline |
| Input field | Focus | Border `#1B2A4A` (from `#E5E5E5`) |

### Typography Rules

- Maximum 2 font families (Playfair Display + Inter)
- No ALL CAPS except navigation links (letter-spacing: 0.5px)
- Paragraph spacing: minimum 1em
- Source: Google Fonts (both fonts have Turkish character support)
- Alternative fallbacks: Lora (for Playfair Display), Source Sans 3 (for Inter)

---

## 4. Logo Design

### Composition

Horizontal layout (primary):
```
[fabric fold icon]  Inanc Tekstil
```

Stacked layout (secondary, for square formats):
```
[fabric fold icon]
 Inanc Tekstil
```

### Wordmark

- Exact wordmark string: **İnanç Tekstil** (U+0130 İ, U+00E7 ç)
- Font: Playfair Display Bold (700)
- Color: Deep Navy `#1B2A4A`
- The İ (capital I with dot above) and ç (c with cedilla) must render correctly in all SVG files

### Icon: Draped Fabric Fold

- Abstract: 2-3 flowing curved lines suggesting draped/falling fabric
- Single color: Deep Navy `#1B2A4A` (same as text)
- Stroke-based, not filled — lightweight and elegant
- Proportions: icon height = cap height of the wordmark text
- Must remain recognizable at 32x32px

### Logo Variants

| Variant | Use Case | Format |
|---------|----------|--------|
| Horizontal (navy on white) | Site header, documents | SVG + PNG |
| Horizontal (white on navy) | Footer, dark backgrounds | SVG + PNG |
| Icon only (navy on white) | Favicon, app icon | SVG + PNG (32, 180, 512px) |
| Icon only (white on navy) | Dark background avatar | SVG + PNG |
| Stacked (navy on white) | Social media profile | SVG + PNG (400x400) |
| Stacked (white on navy) | Dark background social | SVG + PNG (400x400) |

### Logo Clear Space

- Minimum padding on all sides = height of the icon
- No other visual elements, text, or decorations within clear space

### Logo Minimum Sizes

- Horizontal: 120px wide (digital), 30mm (print)
- Icon only: 32px (digital), 10mm (print)

### Logo Misuse Rules

- Do not change logo colors outside brand palette
- Do not add shadows, glows, or 3D effects
- Do not stretch, skew, or alter proportions
- Do not place on busy/patterned backgrounds without a solid backing
- Do not use low-resolution (pixelated) versions

---

## 5. Deliverables

### Logo Files

| File | Path | Description |
|------|------|-------------|
| `inanc-tekstil-logo.svg` | `docs/brand-assets/logo/` | Horizontal, navy on white |
| `inanc-tekstil-logo-white.svg` | `docs/brand-assets/logo/` | Horizontal, white (for dark BG) |
| `inanc-tekstil-icon.svg` | `docs/brand-assets/logo/` | Icon only, navy |
| `inanc-tekstil-icon-white.svg` | `docs/brand-assets/logo/` | Icon only, white |
| `inanc-tekstil-logo-stacked.svg` | `docs/brand-assets/logo/` | Stacked, navy on white |
| `inanc-tekstil-logo-stacked-white.svg` | `docs/brand-assets/logo/` | Stacked, white (for dark BG) |

### Favicon and Touch Icons

| File | Path | Specs |
|------|------|-------|
| `favicon.svg` | `docs/brand-assets/favicon/` | SVG favicon for modern browsers (copy of icon SVG) |
| `favicon.ico` | `docs/brand-assets/favicon/` | Multi-resolution ICO (16x16 + 32x32) |
| `favicon-32x32.png` | `docs/brand-assets/favicon/` | 32x32 PNG |
| `apple-touch-icon.png` | `docs/brand-assets/favicon/` | 180x180 PNG, icon with padding |
| `android-chrome-192x192.png` | `docs/brand-assets/favicon/` | 192x192 PNG |
| `android-chrome-512x512.png` | `docs/brand-assets/favicon/` | 512x512 PNG |
| `site.webmanifest` | `docs/brand-assets/favicon/` | Web app manifest referencing icons |

### Social Media Assets

| File | Path | Specs |
|------|------|-------|
| `og-image.png` | `docs/brand-assets/social/` | 1200x630, white BG, stacked logo centered, tagline below |
| `instagram-profile.png` | `docs/brand-assets/social/` | 400x400, white BG, icon only centered |

### OG Image Design

- White background
- Stacked logo (icon + "Inanc Tekstil") centered
- Below logo: "Ölçünüze Özel Dikim Perde — İskenderun" in Inter Medium 18px
- All navy `#1B2A4A` on white `#FFFFFF`

### Instagram Profile Design

- White background, circular crop-safe
- Fabric fold icon centered
- Navy `#1B2A4A` on white

### Updated Documentation

- Rewrite `docs/brand/gorsel-kimlik.md` with the new palette, typography, and logo rules
- Remove all references to warm earth tones (Sicak Kum Beyazi, Koyu Toprak, Tarcin, Adana Tasi Grisi, Derin Zeytin)

---

## 6. What This Spec Does NOT Cover

- Website theme implementation (Astra customizer settings) — separate task
- Product photography guidelines — existing warm-tone photography direction in gorsel-kimlik.md remains valid. The contrast between warm product photography and a clean white UI is intentional (same approach as TAC: neutral UI, rich product imagery).
- Social media content templates — existing sosyal-medya-kilavuzu.md will need a follow-up update
- Print materials (business cards, packaging) — out of scope for this round
- Dark mode — not planned for initial launch, may revisit later
- Spacing/grid system — deferred to theme implementation task

---

## 7. Acceptance Criteria

1. All 6 SVG logo variants render correctly at target sizes
2. Favicon is recognizable at 32x32
3. OG image displays correctly when shared on social media (1200x630)
4. Instagram profile pic is recognizable at thumbnail size
5. `gorsel-kimlik.md` accurately reflects the new brand identity
6. All SVG files use `#1B2A4A` (navy) or `#FFFFFF` (white) only
7. Turkish characters İ (U+0130) and ç (U+00E7) display correctly in all logo files
8. WCAG AA contrast requirements met for all text/background combinations
