# Image Generator — Inanc Tekstil

Quality-focused AI product image generation. Uses **BAML** for typed prompt engineering, **Amazon Bedrock Claude** for prompt crafting and quality evaluation, **fal.ai Nano Banana 2 Edit** for image generation, and **Satori + resvg** for deterministic text overlay rendering (hero banners, collection cards).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Generation Pipeline                      │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │  1. CRAFT     │    │  2. GENERATE  │    │  3. EVALUATE  │   │
│  │  PROMPT       │───>│  IMAGE        │───>│  QUALITY      │   │
│  │              │    │              │    │              │   │
│  │ Bedrock      │    │ fal.ai       │    │ Bedrock      │   │
│  │ Claude Sonnet│    │ nano-banana-2│    │ Claude Sonnet│   │
│  │ via BAML     │    │ /edit        │    │ via BAML     │   │
│  └──────────────┘    └──────────────┘    └──────┬───────┘   │
│                                                  │           │
│                    ┌─────────────────┐           │           │
│                    │  4. RETRY with   │<──────────┘           │
│                    │  improved prompt │  (if score < 7)      │
│                    └─────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

**Why this pipeline:**
- Raw prompts like "replace the curtain" produce inconsistent results
- Bedrock Claude sees the actual swatch + room images and crafts a prompt that describes the specific fabric's physical properties
- After generation, Claude evaluates the result against the inputs and scores it on 6 dimensions
- If quality is below threshold, the improvement suggestion feeds back into the next attempt
- Max 3 attempts, then returns the best result

## Setup

```bash
cd image-generator

# Install dependencies
npm install

# Generate BAML client (run after any .baml file changes)
npm run baml:generate

# Copy and fill environment variables
cp .env.example .env
```

### Required credentials in `.env`:

```bash
# fal.ai — image generation
FAL_KEY=your_fal_api_key

# Amazon Bedrock — prompt crafting + quality evaluation
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
```

**Bedrock model access:** Request access to `us.anthropic.claude-sonnet-4-20250514-v1:0` and `us.anthropic.claude-haiku-4-5-20251001-v1:0` in the [AWS Bedrock console](https://console.aws.amazon.com/bedrock/home#/modelaccess).

## Usage

All flows are driven by `assets/input/manifest.json` which defines products, rooms, banners, and collections.

### PDP Lifestyle (curtain in room)

```bash
# Generate lifestyle images for a product (all rooms defined in manifest)
npm run lifestyle -- --sku TUL-001

# Generate for a specific room only
npm run lifestyle -- --sku TUL-001 --room room-02-modern-salon
```

### PDP Texture (fabric close-up)

```bash
npm run texture -- --sku TUL-001
```

### Hero Banner

```bash
npm run generate -- --banner spring-sale
```

### Collection Card

```bash
npm run generate -- --collection bahar
```

### All flows for a product

```bash
npm run generate -- --sku TUL-001
```

### What happens when you run it

```
=== PDP Lifestyle: TUL-001 x room-02-modern-salon ===
Fabric: white Tul (polyester)
Room: modern living room — beige walls

--- Upload images ---
  Swatch: https://fal.media/files/...
  Room: https://fal.media/files/...

--- Craft prompt ---
  Prompt: Replace the sheer curtain in the first image with a tulle
  curtain made from the delicate woven mesh fabric in the second image.
  The tulle should be semi-transparent — light passes through revealing
  the dark wall behind, creating a soft luminous glow. Maintain pencil
  pleats at the top, with the fabric falling in gentle vertical folds
  to the floor. Keep the exact same room: dark brown wall, wooden side
  table with lattice drawer, white ceramic vase with red and pink roses,
  light wood floor. Natural, even lighting. Professional interior
  product photography.
  Reasoning: Described specific physical properties of the tul fabric...
  Negative cues: no text, no AI artifacts, no window frame addition

--- Generate + Evaluate (attempt 1/3) ---
  Generated 2 images
Evaluating...
  Image 1: overall=8 fabric=7 room=9 realism=8 lighting=8 drape=7 pass=true

=== PASS — assets/output/TUL-001/TUL-001-room-02-modern-salon.webp (overall: 8) ===
Total duration: 42.3s
```

## BAML Functions

All prompts are defined as typed BAML functions in `src/baml_src/`:

| Function | Client | Purpose |
|---|---|---|
| `CraftLifestylePrompt` | Bedrock Sonnet | Takes fabric + room descriptions + actual images, outputs optimized prompt |
| `CraftTexturePrompt` | Bedrock Sonnet | Takes fabric description + swatch image, outputs texture prompt |
| `CraftBannerPrompt` | Bedrock Sonnet | Takes fabric + room + text placement, outputs banner prompt |
| `EvaluateLifestyleImage` | Bedrock Sonnet | Scores generated image on 6 quality dimensions |
| `EvaluateTextureImage` | Bedrock Haiku | Fast evaluation for texture shots |

### Quality Scoring (6 dimensions)

| Dimension | What it checks |
|---|---|
| `fabric_fidelity` | Does the curtain match the swatch color/texture/pattern? |
| `room_coherence` | Are walls, floor, furniture, plants preserved correctly? |
| `realism` | Does it look like a real photo? No AI artifacts? |
| `lighting` | Consistent light between curtain and room? |
| `curtain_drape` | Realistic pleats and folds for the fabric weight? |
| `overall` | Would this pass on an e-commerce product page? |

**Pass criteria:** overall >= 7 AND no individual score < 5.

## Project Structure

```
image-generator/
  src/
    generate.ts              # Main generation pipeline + CLI
    baml_src/                # BAML prompt definitions
      clients.baml           # Bedrock Sonnet + Haiku clients
      types.baml             # FabricDescription, RoomDescription, QualityScore
      craft_prompt.baml      # CraftLifestylePrompt, CraftTexturePrompt, CraftBannerPrompt
      evaluate.baml          # EvaluateLifestyleImage, EvaluateTextureImage
      generators.baml        # TypeScript codegen config
    baml_client/             # Generated TypeScript client (gitignored)
    lib/
      fal-client.ts          # fal.ai upload + generate + download
      renderer.ts            # Satori + resvg text overlay rendering
      helpers.ts             # Shared helpers (toFabricDescription, toRoomDescription, etc.)
    __tests__/               # Vitest unit + integration tests
  assets/
    input/                   # Manifest + swatches + room templates
      manifest.json          # Product, room, banner, collection definitions
      swatches/              # Fabric swatch photos
      rooms/                 # Room template photos
    output/                  # Generated images (gitignored)
    fonts/                   # Inter TTF fonts (Regular, Bold, ExtraBold)
    sample-images/           # Reference images by type
  docs/
    flows.md                 # Detailed flow documentation
```

## Testing

```bash
npm test            # Run all tests once
npm run test:watch  # Watch mode
```

## Costs per generation

| Step | Model | Cost |
|---|---|---|
| Craft prompt | Bedrock Sonnet (multimodal, ~2K tokens) | ~$0.02 |
| Generate image | fal.ai nano-banana-2 (2K resolution) | $0.12 |
| Evaluate image | Bedrock Sonnet (multimodal, ~1K tokens) | ~$0.01 |
| **Total per image** | | **~$0.15** |
| **Total per image with retry** | (avg 1.3 attempts) | **~$0.20** |

For detailed flow documentation (prompts, aspect ratios, post-processing), see [docs/flows.md](docs/flows.md).
