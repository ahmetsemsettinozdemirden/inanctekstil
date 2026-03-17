# Image Generation Flows

Detailed documentation for each image generation flow. Every flow uses the **Nano Banana 2 Edit** model (`fal-ai/nano-banana-2/edit`). Prompts are dynamically crafted by **BAML functions** backed by Bedrock Claude — the static prompts in this document are reference examples showing the style and intent.

---

## Table of Contents

1. [Flow 1: PDP Lifestyle Image](#flow-1-pdp-lifestyle-image)
2. [Flow 2: PDP Texture Close-up](#flow-2-pdp-texture-close-up)
3. [Flow 3: Hero Banner](#flow-3-hero-banner)
4. [Flow 4: Collection Card](#flow-4-collection-card)
5. [Future: Category Header](#future-category-header)
6. [Future: Social Media Post](#future-social-media-post)

---

## Flow 1: PDP Lifestyle Image

The highest-priority flow. Generates the main product images shown on WooCommerce product detail pages. These sell the "look" — a customer sees the curtain in a realistic room and imagines it in their own home.

### What We're Making

Two distinct composition styles based on curtain type:

**Style A — Fon/Blackout in Room** (see `assets/sample-images/pdp-lifestyle/pdp-bright-fon-antrasit.jpg`)

- Portrait orientation (3:4)
- A styled room with a visible window, curtain rod/pelmet at top
- Fon curtain pulled to one side with deep pinch pleats, floor-length
- White sheer tul behind it spanning the full window, semi-transparent with garden/sky visible through it
- Room props: side table, plant, rug, floor cushion
- Warm natural daylight from window
- The fon fabric is the hero — it occupies ~40% of the frame

**Style B — Tul Standalone** (see `assets/sample-images/pdp-lifestyle/pdp-sturdy-tul-perde-1.jpg`)

- Square (1:1)
- Simpler composition: tul curtain takes ~65% of frame on left side
- Hung against a solid colored wall (no window frame necessary)
- Pencil pleats at top, floor-length
- Minimal props on the right: small side table with a vase of flowers
- The tul fabric is the hero — its transparency, texture, and drape are the focus

### Inputs

All inputs are defined in `assets/input/manifest.json`. Each product specifies which rooms to pair with.

| Input | Source | Description |
|---|---|---|
| **Room template** (image 1) | `manifest.rooms[roomId].image` | A photograph of a styled room that already has a curtain in it |
| **Fabric swatch** (image 2) | `manifest.products[].swatch` | Close-up photo of the fabric from the kartela |

### Prompt Crafting

Prompts are generated dynamically by the `CraftLifestylePrompt` BAML function (Bedrock Claude Sonnet). The function receives structured fabric + room descriptions plus the actual images, and outputs an optimized prompt tailored to the specific fabric's physical properties.

**Example reference prompt (Tul curtain):**

```
Replace the sheer curtain fabric in the first image with a tulle curtain
made from the semi-transparent fabric shown in the second image. Keep the
exact same room, wall color, furniture, and props. The tulle should be
light and airy, with soft pencil pleats, and you should be able to partially
see through it. Match the color and texture of the second image exactly.
Professional product photography, soft even lighting.
```

The BAML function adapts the prompt based on curtain type (tul vs. fon vs. blackout vs. saten), emphasizing different drape physics, transparency levels, and fabric weight for each.

### Quality Evaluation

Each generated image is evaluated by `EvaluateLifestyleImage` (Bedrock Claude Sonnet) on 6 dimensions. If overall < 7 or any score < 5, the improvement suggestion feeds back into the next attempt (max 3 attempts).

### API Parameters

```javascript
{
  prompt: "...",           // Dynamically crafted by CraftLifestylePrompt
  image_urls: [
    roomTemplateUrl,       // Image 1: room with existing curtain
    swatchUrl              // Image 2: fabric close-up
  ],
  num_images: 2,           // Generate 2 variants per attempt
  resolution: "2K",        // High quality for product pages
  aspect_ratio: "3:4",     // Portrait for fon/blackout; "1:1" for tul
  output_format: "webp"
}
```

On retry attempts, `thinking_level: "high"` is enabled to improve generation quality.

### Output

| Property | Value |
|---|---|
| Format | WebP |
| Resolution | 2K (~1536x2048 for 3:4, ~1536x1536 for 1:1) |
| Post-processing | None (raw AI output saved as final) |
| Files per product per room | 1 (best passing image) |
| Naming | `{sku}-{room-id}.webp` e.g. `TUL-001-room-02-modern-salon.webp` |
| Location | `assets/output/{sku}/` |

### What Can Go Wrong

| Problem | Fix |
|---|---|
| Model changes furniture or wall color | CraftLifestylePrompt explicitly lists room elements to preserve |
| Fabric color doesn't match swatch | The BAML function describes the specific fabric color from the swatch |
| Curtain looks flat / unrealistic drape | CraftLifestylePrompt adapts drape instructions per fabric type/weight |
| Tul not transparent enough | The prompt includes transparency-specific instructions for tul |
| Room template curtain rod disappears | Add room-specific preservation details in manifest |
| Dark wall rooms struggle (scores ~4/10) | Use rooms with windows and natural light for better results |

---

## Flow 2: PDP Texture Close-up

Generates styled close-up images of the fabric for the product image gallery. These show texture, weave, and color fidelity.

### What We're Making

Two sub-types:

**Type A — Pleated fabric close-up** (see `assets/sample-images/pdp-texture/pdp-sturdy-tul-perde-2.jpg`)

- Square (1:1)
- Extreme close-up showing the fabric's weave/mesh structure
- The fabric is pleated/folded showing depth and shadow
- No background, no props — pure fabric
- This is essentially a cleaned-up version of the swatch card itself

**Type B — Draped fabric shot** (generated, not in samples)

- Square (1:1)
- The fabric shown draped or folded artistically
- Clean background (white or light gray)
- Shows how the fabric falls and catches light
- Product photography feel

### Inputs

| Input | Source | Description |
|---|---|---|
| **Fabric swatch** (single image) | `manifest.products[].swatch` | The kartela close-up photo |

Only one image needed — no room template.

### Prompt Crafting

Prompts are generated dynamically by the `CraftTexturePrompt` BAML function (Bedrock Claude Sonnet). The function receives fabric description + swatch image and outputs a prompt for a professional textile close-up.

**Example reference prompt:**

```
Take this fabric and show it as a close-up product photograph. The fabric
should be softly pleated with visible folds, filling the entire frame.
Show the texture and weave detail clearly. Even, diffused studio lighting
from above. No background visible, only the fabric. Sharp focus on the
textile surface. Professional product photography.
```

### Quality Evaluation

Each generated image is evaluated by `EvaluateTextureImage` (Bedrock Claude Haiku — fast and cheap). The first passing image is selected; if none pass, the last generated image is used.

### API Parameters

```javascript
{
  prompt: "...",           // Dynamically crafted by CraftTexturePrompt
  image_urls: [swatchUrl], // Single image only
  num_images: 2,
  resolution: "1K",        // 1K is enough for texture shots
  aspect_ratio: "1:1",
  output_format: "webp"
}
```

### Output

| Property | Value |
|---|---|
| Format | WebP |
| Resolution | 1K (~1024x1024) |
| Post-processing | None (raw AI output saved as final) |
| Files per product | 1 |
| Naming | `{sku}-texture.webp` e.g. `TUL-001-texture.webp` |
| Location | `assets/output/{sku}/` |

### What Can Go Wrong

| Problem | Fix |
|---|---|
| Model changes the fabric color | CraftTexturePrompt emphasizes preserving exact color |
| Model adds patterns that don't exist | BAML prompt specifies "keep the original fabric exactly" |
| Output is blurry for texture | Add "sharp focus, high detail" in BAML prompt template |

---

## Flow 3: Hero Banner

Generates wide promotional banners for the homepage carousel. This is a **two-stage process**: AI generates the base image, then Satori + sharp composites the text overlay.

### What We're Making

**Style A — Product + Text** (see `assets/sample-images/hero-banner/hero-banner-1.webp`)

- Ultra-wide (roughly 2.77:1, we use 21:9)
- Layout: LEFT half = solid color area for text overlay, RIGHT half = lifestyle product photo
- The AI generates a room/curtain scene composed to the right side
- Text rendered deterministically with Satori on the left side
- Warm, soft gradient blend connecting the two halves

### Inputs

Defined in `manifest.banners`:

| Input | Source | Description |
|---|---|---|
| **Room template** (image 1) | `manifest.rooms[banner.room].image` | Room scene with curtain |
| **Fabric swatch** (image 2) | Product's swatch via `banner.sku` | Fabric close-up |
| **Campaign text** | `banner.headline`, `sub_headline`, `discount`, `cta`, `disclaimer` | Text content |
| **Theme colors** | `banner.bg_color`, `text_color`, `accent_color` | Optional, with defaults |
| **Logo** (optional) | `banner.logo` | SVG/PNG path relative to `assets/input/` |

### Stage 1: AI Image Generation

The prompt is generated dynamically by `CraftBannerPrompt` BAML function (Bedrock Claude Sonnet). It receives fabric + room descriptions, actual images, and a `text_side` parameter ("left") to ensure the room/curtain scene is composed on the opposite side.

**Example reference prompt:**

```
Create a wide panoramic composition using these two images. On the RIGHT
side of the frame, show the room from the first image with the curtain
fabric replaced by the fabric from the second image. The curtain should
have elegant pleats and natural draping. On the LEFT side, keep the
background clean and softly blurred — a warm, light gradient that smoothly
connects to the room scene. The left 40% of the image should be mostly
empty space suitable for text overlay. Professional interior design
photography, warm natural lighting, cinematic wide composition.
```

### Stage 1: API Parameters

```javascript
{
  prompt: "...",           // Dynamically crafted by CraftBannerPrompt
  image_urls: [roomTemplateUrl, swatchUrl],
  num_images: 2,           // Generate 2 variants
  resolution: "2K",        // Banners need to be crisp at large sizes
  aspect_ratio: "21:9",    // Ultra-wide banner format
  output_format: "png"     // PNG for compositing, convert to webp after
}
```

No quality evaluation step — both variants are rendered and saved.

### Stage 2: Text Overlay (Satori + resvg + sharp)

After getting the AI base image, composite text and brand elements using `src/lib/renderer.ts` — `renderHeroBanner()`.

**Rendering pipeline:**
1. **Sharp** resizes the AI base image and positions it on the right 55%
2. **Sharp** creates the background canvas (solid brand color) and blends the image with a 200px gradient mask
3. **Satori** renders the text/UI elements as a transparent PNG using Inter font (TTF, supports Turkish characters)
4. **Sharp** composites the text layer onto the canvas
5. **Sharp** exports as WebP (quality 90)

**Overlay layout:**

```
+------------------------------------------------------------------+
|                                    |                              |
|  [Logo - top left]                 |                              |
|                                    |                              |
|  HEADLINE TEXT                     |     [AI-generated room       |
|  **Bold Sub-headline**             |      scene with curtain      |
|  %XX AZ ODE!                      |      on the right side]      |
|                                    |                              |
|  [ALISVERISE BASLA] (CTA button)  |                              |
|                                    |                              |
|  _small disclaimer text_           |                              |
+------------------------------------------------------------------+
```

**Text elements:**

| Element | Font | Size | Weight | Color |
|---|---|---|---|---|
| Headline | Inter | 32px | 700 (Bold) | textColor (default #5C4033) |
| Sub-headline | Inter | 48px | 700 (Bold) | textColor |
| Discount | Inter | 96px | 800 (ExtraBold) | accentColor (default #C17F59) |
| CTA button | Inter | 18px | 700 (Bold) | accentColor with border |
| Disclaimer | Inter | 13px | 400 (Regular) | textColor at 60% opacity |

**Color themes:** Configurable via `bgColor`, `textColor`, `accentColor` in manifest. Default is warm beige (#F5F0EB bg, #5C4033 text, #C17F59 accent).

### Output

| Property | Value |
|---|---|
| Format | WebP |
| Dimensions | 2160x780 (configurable) |
| Rendering | Satori + resvg for text, sharp for compositing |
| Files per banner | 1-2 (one per AI base variant) |
| Naming | `{banner-id}.webp` or `{banner-id}-{n}.webp` e.g. `spring-sale.webp` |
| Location | `assets/output/hero-banners/` |

### What Can Go Wrong

| Problem | Fix |
|---|---|
| AI doesn't leave left side empty | CraftBannerPrompt explicitly instructs asymmetric composition |
| Composition is centered, not right-biased | Adjust BAML prompt to be more explicit about right-side placement |
| Ultra-wide ratio distorts the room | Try `16:9` instead and crop to target dimensions |
| Text is hard to read over the image | Adjust gradient blend width (currently 200px) in renderer.ts |

---

## Flow 4: Collection Card

Generates artistic showcase images for homepage collection sections. These are editorial/mood images representing a group of fabrics, not individual product shots.

### What We're Making

See `assets/sample-images/collection-card/`:

**Common traits:**
- Approximately 5:4 ratio (1280x1040)
- The fabric/textile is prominent in an aspirational lifestyle context
- Dark gradient band at the bottom 20% of the image
- Collection name in white, centered, in the gradient band (auto-uppercased)
- Rounded corners (12px radius)

### Inputs

Defined in `manifest.collections`:

| Input | Source | Description |
|---|---|---|
| **Fabric swatches** (1+) | Products matched by `collection.skus` | Multiple swatch photos from the same collection |
| **Collection name** | `collection.name` | e.g. "Bahar Koleksiyonu" |
| **Mood** | `collection.mood` | "outdoor-natural", "indoor-warm", "minimal-modern" |
| **Room** (optional) | `collection.room` | Room ID for richer BAML-crafted prompts |

### Prompt Crafting

Two paths depending on whether a room is specified:

**With room context:** Uses `CraftBannerPrompt` BAML function with `text_side: "bottom"` to generate a prompt that places the scene above the gradient text zone.

**Without room (mood template):** Uses hardcoded mood-based prompts:

**outdoor-natural:**
```
Create an artistic lifestyle photograph for a curtain fabric collection.
Show a sunlit outdoor garden setting with the fabrics from the provided
images draped elegantly over natural elements like tree branches, stone
surfaces, or garden furniture. The scene should feel editorial, aspirational,
and natural. Warm golden-hour sunlight, shallow depth of field. The fabrics
should be clearly visible and prominent. Professional fashion/lifestyle
photography. 5:4 composition.
```

**indoor-warm:**
```
Create a lifestyle photograph for a curtain fabric collection. Show a
cozy, warm interior with the fabrics from the provided images displayed
as curtains and draped textiles. Warm tones with styled furniture and
decor. The textiles should be the visual focus. Professional interior
lifestyle photography, warm natural lighting. 5:4 composition.
```

**minimal-modern:**
```
Create a minimal, modern lifestyle photograph for a curtain fabric
collection. Show the fabrics from the provided images elegantly draped
and arranged on a clean surface and hung from a simple rod. Architectural
setting with clean lines and natural light. Professional textile
photography, bright and airy. 5:4 composition.
```

### API Parameters

```javascript
{
  prompt: "...",
  image_urls: [
    roomUrl,       // Optional: room template (if specified)
    swatch1Url,    // Primary fabric of the collection
    swatch2Url,    // Additional (if multiple SKUs)
  ],
  num_images: 2,           // Generate 2 variants
  resolution: "1K",
  aspect_ratio: "5:4",     // Matches target dimensions (~1280x1040)
  output_format: "png"     // PNG for post-processing
}
```

### Stage 2: Text Overlay (Satori + resvg + sharp)

Uses `src/lib/renderer.ts` — `renderCollectionCard()`:

1. **Sharp** resizes AI base image to 1280x1040 (cover fit)
2. **Sharp** composites a dark gradient SVG overlay on the bottom 20%:
   - Transparent at top -> `rgba(0, 0, 0, 0.65)` at bottom
3. **Satori** renders collection name as transparent PNG:
   - White (#FFFFFF), Inter Bold 32px, letter-spacing 3px
   - Centered horizontally, positioned in the gradient band
   - Auto-uppercased
4. **Sharp** composites text onto base
5. **Sharp** applies rounded corner mask (12px radius)
6. Export as PNG (transparency needed for rounded corners)

### Output

| Property | Value |
|---|---|
| Format | PNG |
| Dimensions | 1280x1040 (configurable) |
| Rendering | Satori + resvg for text, sharp for compositing + rounded corners |
| Files per collection | 1-2 (one per AI base variant) |
| Naming | `{collection-id}.png` or `{collection-id}-{n}.png` e.g. `bahar.png` |
| Location | `assets/output/collections/` |

### What Can Go Wrong

| Problem | Fix |
|---|---|
| Model doesn't use all provided fabric swatches | Mention each image explicitly in BAML prompt |
| Fabrics are too small/hidden in the scene | Add "the textile fabrics should be the dominant visual element" to prompt |
| Generated scene doesn't match brand aesthetic | Add color direction in manifest mood or use room context |

---

## Future: Category Header

> **Not yet implemented.** Defined in `types.baml` as `CategoryHeader` flow type but no BAML function or pipeline code exists. Planned for a future iteration.

Generates wide, short banners for the top of category listing pages (e.g., tul-perdeler, fon-perdeler, blackout-perdeler).

**Planned specs:**
- Very wide (4:1 ratio, ~1920x480)
- A panoramic slice of a room showing the curtain type
- Soft, atmospheric, slightly desaturated/muted to not compete with product cards below
- No text overlay needed (WordPress renders category name)

---

## Future: Social Media Post

> **Not yet implemented.** Defined in `types.baml` as `SocialPost` flow type but no BAML function or pipeline code exists. Planned for a future iteration.

Generates square images for Instagram and Facebook posts.

**Planned types:**
- **New Product Announcement** — lifestyle room shot (1:1), bold colors, brand watermark
- **Seasonal Campaign** — flat-lay of multiple fabrics with campaign text overlay
- **Styling Tip / Before-After** — side-by-side split composition

---

## Flow Summary

| Flow | Status | Input Images | Aspect Ratio | Resolution | Post-processing | Cost/Image |
|---|---|---|---|---|---|---|
| 1. PDP Lifestyle | Implemented | Room + Swatch | 3:4 or 1:1 | 2K | Quality eval + retry | ~$0.15 |
| 2. PDP Texture | Implemented | Swatch only | 1:1 | 1K | Quality eval | ~$0.11 |
| 3. Hero Banner | Implemented | Room + Swatch | 21:9 | 2K | Satori text + sharp composite | ~$0.14 |
| 4. Collection Card | Implemented | Swatches (+ Room) | 5:4 | 1K | Satori text + sharp composite + rounded corners | ~$0.10 |
| 5. Category Header | Planned | Room + Swatch | 4:1 | 2K | Resize, desaturate | ~$0.12 |
| 6. Social Media | Planned | Varies | 1:1 | 1K | Resize, watermark | ~$0.08 |

---

## Room Template Library (Shared Across Flows)

Flows 1, 3 (and future 5, 6) require room templates. These are defined in `manifest.rooms` and stored in `assets/input/rooms/`.

### Current Templates

| ID | Room | Wall Color | Props | Used By |
|---|---|---|---|---|
| `room-01-dark-wall` | Studio-style | Dark brown | Side table, ceramic vase, roses | Flow 1 |
| `room-02-modern-salon` | Modern living room | Beige | Side table, books, palm plant, floor cushion, rug | Flow 1, 3, 4 |

### Adding New Templates

1. Add the room photo to `assets/input/rooms/`
2. Add an entry in `manifest.rooms` with room description fields
3. Reference the room ID in product `rooms` arrays or banner/collection definitions

### Where to Source Room Templates

1. **Our own sample images** — `pdp-bright-fon-antrasit.jpg` and `pdp-sturdy-tul-perde-1.jpg` are already usable as room templates
2. **Stock photos** — Search for "curtain interior photography" on Unsplash/Pexels (free) or Shutterstock (paid, higher quality)
3. **AI-generated base rooms** — Use Nano Banana 2 in text-to-image mode to generate initial room templates, then use those consistently

---

## Prompt Engineering Notes

### How Prompts Work

All prompts are **dynamically crafted** by BAML functions (Bedrock Claude Sonnet). The functions receive structured data (fabric type, room description, etc.) plus the actual images, and output optimized prompts tailored to each specific generation. This produces much better results than static templates because:

- Claude sees the actual swatch and room images and can describe specific visual properties
- Prompts adapt to fabric type (tul drapes differently than blackout)
- Quality evaluation feedback can be fed back into improved prompts on retry

### What Works Well with Nano Banana 2 Edit

- **Explicit "first image" / "second image" references** — The model understands image ordering in `image_urls`
- **"Keep the exact same X"** — Strong instruction to preserve room elements
- **"Replace X with Y"** — Clear editing directive
- **Describing the desired result** rather than the process

### What to Avoid

- Vague prompts like "make it look nice" — be specific about fabric type, drape style, lighting
- Contradictory instructions ("keep everything the same" + "change the room lighting")
- Extremely long prompts (>500 words) — the model works best with focused, clear instructions
- Asking for text in the image — AI-generated text is unreliable; always add text in post-processing via Satori
