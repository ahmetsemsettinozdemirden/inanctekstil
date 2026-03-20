# fal.ai Veo 3.1 — Complete Model Reference

All 9 variants documented. See bottom for use-case recommendation.

---

## Pricing

| Tier | Resolution | Audio OFF | Audio ON |
|------|-----------|-----------|---------|
| Standard | 720p / 1080p | $0.20/sec | $0.40/sec |
| Standard | 4K | $0.40/sec | $0.60/sec |
| Fast | 720p / 1080p | $0.10/sec | $0.15/sec |
| Fast | 4K | $0.30/sec | $0.35/sec |

**Practical cost for 8s clip at 1080p, no audio:**
- Standard: $1.60
- Fast: $0.80

---

## Common Parameters (all models)

| Parameter | Type | Default | Valid Values |
|-----------|------|---------|--------------|
| `prompt` | string (max 20,000 chars) | — | Required on all models |
| `negative_prompt` | string | null | Optional on all models |
| `resolution` | enum | `"720p"` | `"720p"`, `"1080p"`, `"4k"` |
| `duration` | enum | `"8s"` | `"4s"`, `"6s"`, `"8s"` (see per-model notes) |
| `aspect_ratio` | enum | varies | `"16:9"`, `"9:16"`, `"auto"` (see per-model) |
| `generate_audio` | boolean | `true` | Set `false` when using own voiceover |
| `auto_fix` | boolean | varies | Auto-rewrites prompts that fail content policy |
| `safety_tolerance` | enum | `"4"` | `"1"` (strictest) to `"6"` (most permissive) |
| `seed` | integer | null | For reproducibility |

**Common constraints:**
- Input images: max 8MB per file
- Input videos (extend-video): max 8 seconds
- Output: MP4, 24 FPS
- Aspect ratios: `16:9` or `9:16` only (some accept `"auto"`)

---

## Model 1 — `fal-ai/veo3.1`

**Type:** Text-to-Video (Standard quality)
**URL:** https://fal.ai/models/fal-ai/veo3.1

Flagship text-only endpoint. No image input. Highest quality, 4K support, built-in audio generation.

### Unique inputs

None beyond common parameters.

### `aspect_ratio` default: `"16:9"`
### `auto_fix` default: `true`

---

## Model 2 — `fal-ai/veo3.1/extend-video`

**Type:** Video Extension (Standard quality)
**URL:** https://fal.ai/models/fal-ai/veo3.1/extend-video

Takes an existing video and generates a seamless continuation. Duration of extension is fixed at `"7s"`. No 4K. `auto_fix` defaults to `false`.

### Unique inputs

| Parameter | Type | Required | Notes |
|-----------|------|----------|-------|
| `video_url` | string | Yes | Input video: 720p/1080p, 16:9 or 9:16, max 8 sec |

### `aspect_ratio` default: `"auto"`
### `duration`: fixed `"7s"`
### `resolution`: `"720p"` or `"1080p"` only (no 4K)

> ⚠️ May require Vertex AI access — verify in playground before use.

---

## Model 3 — `fal-ai/veo3.1/fast`

**Type:** Text-to-Video (Fast / cheaper)
**URL:** https://fal.ai/models/fal-ai/veo3.1/fast

Faster, lower-cost version of Model 1. Identical parameter surface. Use for draft testing before committing to standard quality.

### Unique inputs

None beyond common parameters.

### `aspect_ratio` default: `"16:9"`
### `auto_fix` default: `true`

---

## Model 4 — `fal-ai/veo3.1/fast/extend-video`

**Type:** Video Extension (Fast / cheaper)
**URL:** https://fal.ai/models/fal-ai/veo3.1/fast/extend-video

Fast-tier equivalent of Model 2. Extends an existing video at lower cost.

### Unique inputs

| Parameter | Type | Required | Notes |
|-----------|------|----------|-------|
| `video_url` | string | Yes | Input video: 720p/1080p, 16:9 or 9:16, max 8 sec |

### `aspect_ratio` default: `"auto"`
### `duration`: fixed `"7s"`
### `resolution`: `"720p"` or `"1080p"` only

> ⚠️ Same Vertex AI availability caveat as Model 2.

---

## Model 5 — `fal-ai/veo3.1/fast/first-last-frame-to-video`

**Type:** First + Last Frame Interpolation (Fast / cheaper)
**URL:** https://fal.ai/models/fal-ai/veo3.1/fast/first-last-frame-to-video

Fast-tier equivalent of Model 7. Accepts two images — start frame and end frame — and generates the video between them. Use for draft testing.

### Unique inputs

| Parameter | Type | Required | Notes |
|-----------|------|----------|-------|
| `first_frame_url` | string | Yes | Start frame image, max 8MB |
| `last_frame_url` | string | Yes | End frame image, max 8MB |

### `aspect_ratio` default: `"auto"` (inferred from input images)
### `auto_fix` default: `false`

---

## Model 6 — `fal-ai/veo3.1/fast/image-to-video`

**Type:** Image-to-Video (Fast / cheaper)
**URL:** https://fal.ai/models/fal-ai/veo3.1/fast/image-to-video

Fast-tier equivalent of Model 8. Animates a single image with a text prompt. Use for draft testing before committing to standard quality.

### Unique inputs

| Parameter | Type | Required | Notes |
|-----------|------|----------|-------|
| `image_url` | string | Yes | Input image: 720p+, 16:9 or 9:16, max 8MB |

### `aspect_ratio` default: `"auto"`
### `auto_fix` default: `true`

---

## Model 7 — `fal-ai/veo3.1/first-last-frame-to-video`

**Type:** First + Last Frame Interpolation (Standard quality) ⭐ **Recommended for curtain animation**
**URL:** https://fal.ai/models/fal-ai/veo3.1/first-last-frame-to-video

Accepts two images — a start frame and an end frame — and generates video between them. By providing the **same image as both first and last frame**, the animation is constrained to start and end at the same composition, preventing camera drift and creating a naturally loopable clip. This is the ideal approach for animating a static room scene.

### Unique inputs

| Parameter | Type | Required | Notes |
|-----------|------|----------|-------|
| `first_frame_url` | string | Yes | Start frame image, max 8MB |
| `last_frame_url` | string | Yes | End frame image, max 8MB |

### `aspect_ratio` default: `"auto"` (inferred from input images)
### `auto_fix` default: `true`
### `resolution` default: `"720p"`, supports up to `"4k"`

---

## Model 8 — `fal-ai/veo3.1/image-to-video`

**Type:** Image-to-Video (Standard quality) ⭐ Fallback for curtain animation
**URL:** https://fal.ai/models/fal-ai/veo3.1/image-to-video

Standard-quality version of Model 6. Animates a single input image guided by a text prompt. Full 4K support. Use as fallback if first-last-frame produces inconsistent results.

### Unique inputs

| Parameter | Type | Required | Notes |
|-----------|------|----------|-------|
| `image_url` | string | Yes | Input image: 720p+, 16:9 or 9:16, max 8MB |

### `aspect_ratio` default: `"auto"`
### `auto_fix` default: `false` (model page) / `true` (API page — verify at runtime)

---

## Model 9 — `fal-ai/veo3.1/reference-to-video`

**Type:** Reference Images-to-Video (Standard quality)
**URL:** https://fal.ai/models/fal-ai/veo3.1/reference-to-video

Takes an **array of multiple reference images** and generates video with consistent subject appearance across frames. Duration is fixed at `"8s"`. Useful when you have multiple product swatches or angles and want visual coherence.

### Unique inputs

| Parameter | Type | Required | Notes |
|-----------|------|----------|-------|
| `image_urls` | array[string] | Yes | Multiple reference image URLs, max 8MB each |

### `aspect_ratio` default: `"16:9"` (unlike other image-input models which default to `"auto"`)
### `duration`: fixed `"8s"` only
### `auto_fix` default: `false`

---

## Model Selection Guide

| Use case | Model | Cost (8s, 1080p, no audio) |
|----------|-------|---------------------------|
| Test prompts / drafts — text only | `veo3.1/fast` | $0.80 |
| Test prompts / drafts — image input | `veo3.1/fast/image-to-video` | $0.80 |
| Test — controlled start+end frame | `veo3.1/fast/first-last-frame-to-video` | $0.80 |
| **Curtain animation (final output)** | **`veo3.1/first-last-frame-to-video`** | **$1.60** |
| Curtain animation fallback | `veo3.1/image-to-video` | $1.60 |
| Multiple product swatches in one shot | `veo3.1/reference-to-video` | $1.60 |
| Continue / loop a good clip | `veo3.1/extend-video` | $1.40 (7s) |
| Pure text scene (no product image) | `veo3.1` | $1.60 |

---

## Why `first-last-frame-to-video` for Curtain Animation

The curtain animation clips serve as background context in CapCut (bottom layer). The key requirements:

1. **Camera must not drift** — even a 1% zoom or pan makes the avatar overlay look unstable
2. **Room composition must be consistent** — furniture should not warp or move
3. **Loopable is a bonus** — CapCut can loop the clip if it starts and ends the same way

By setting `first_frame_url` = `last_frame_url` = the same room staging JPG, the model is constrained to begin and end at the same pixel composition. All motion in between is limited to the curtain fabric. This is more reliable than prompt-only motion control.

**Draft workflow:**
1. Use `veo3.1/fast/first-last-frame-to-video` ($0.80) to test the prompt and motion quality
2. Switch to `veo3.1/first-last-frame-to-video` ($1.60) for the final 1080p output
