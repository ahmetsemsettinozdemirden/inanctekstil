# fal.ai Prompts & Settings Reference

All models accessed via web playground at `fal.ai/models/<model-id>` — no code required.

---

## 1. Avatar Portrait Generation

**Model:** `fal-ai/nano-banana-pro`
**URL:** https://fal.ai/models/fal-ai/nano-banana-pro
**Cost:** $0.15 per image

### Settings

| Parameter | Value |
|-----------|-------|
| aspect_ratio | `1:1` (square portrait) |
| resolution | `2K` |
| num_images | `4` (generate multiple, pick best) |
| output_format | `jpeg` |
| safety_tolerance | `4` (default) |

### Prompts — 3 phenotypes

Generate 4 images from each prompt (12 total), then pick the single best result across all three. Selection is based on face expression and naturalness, not phenotype.

**Settings for all three:**

| Parameter | Value |
|-----------|-------|
| aspect_ratio | `1:1` |
| resolution | `2K` |
| num_images | `4` |
| output_format | `jpeg` |
| safety_tolerance | `4` |

---

#### Phenotype A — Ege / Batı Türk
Fair skin, hazel or light brown eyes, medium brown hair

```json
{
  "subject": "Turkish woman, 32 years old, Western Turkish / Aegean features",
  "quality": "naturally attractive with a kind, trustworthy face — beauty comes from warmth, not symmetry",
  "eyes": "soft hazel or light brown eyes, kind expression, slight natural catchlight, direct camera gaze",
  "smile": "genuine relaxed smile with slightly visible teeth, smile reaches her eyes, relaxed jaw",
  "skin": "fair to light skin with cool-neutral undertone, light natural freckles possible, healthy not airbrushed, subtle natural texture",
  "hair": "medium brown, medium length, loose and slightly wavy, falls naturally around face and shoulders — not blown out, not styled",
  "makeup": "minimal — touch of mascara, natural lip color, no foundation, no contouring",
  "clothing": "cozy light beige or dusty rose knit sweater, casual and comfortable",
  "background": "softly blurred warm Turkish apartment interior — hints of natural wood furniture and warm neutral tones, bokeh depth",
  "lighting": "natural side window light, soft flattering shadows across face, no harsh highlights",
  "style": "photorealistic, candid portrait, shot on iPhone 15, natural grain, not studio photography",
  "persona": "naturally attractive woman you might know from your neighborhood — not a model, not an influencer, not a beauty queen, not a stock photo. She looks like she has a real life."
}
```

---

#### Phenotype B — İç Anadolu
Medium olive skin, dark brown eyes, dark brown hair — classic Turkish look

```json
{
  "subject": "Turkish woman, 32 years old, Central Anatolian features",
  "quality": "naturally attractive with a kind, trustworthy face — beauty comes from warmth, not symmetry",
  "eyes": "warm dark brown eyes, kind expression, slight natural catchlight, direct camera gaze",
  "smile": "genuine relaxed smile with slightly visible teeth, smile reaches her eyes, relaxed jaw",
  "skin": "naturally clear skin with olive-warm undertone, subtle natural texture, slight warmth in cheeks, healthy not airbrushed, no heavy foundation look",
  "hair": "dark brown, medium length, loose and slightly wavy, falls naturally around face and shoulders — not blown out, not styled",
  "makeup": "minimal — touch of mascara, natural lip color, no foundation, no contouring",
  "clothing": "cozy light beige or dusty rose knit sweater, casual and comfortable",
  "background": "softly blurred warm Turkish apartment interior — hints of natural wood furniture and warm neutral tones, bokeh depth",
  "lighting": "natural side window light, soft flattering shadows across face, no harsh highlights",
  "style": "photorealistic, candid portrait, shot on iPhone 15, natural grain, not studio photography",
  "persona": "naturally attractive woman you might know from your neighborhood — not a model, not an influencer, not a beauty queen, not a stock photo. She looks like she has a real life."
}
```

---

#### Phenotype C — Güney / Hatay Akdeniz
Deep olive skin, near-black eyes, very dark hair — closest to İskenderun local phenotype

```json
{
  "subject": "Turkish woman, 32 years old, Southern Turkish / Hatay Mediterranean features",
  "quality": "naturally attractive with a kind, trustworthy face — beauty comes from warmth, not symmetry",
  "eyes": "very dark brown, almost black eyes, almond-shaped, kind expression, slight natural catchlight, direct camera gaze",
  "smile": "genuine relaxed smile with slightly visible teeth, smile reaches her eyes, relaxed jaw",
  "skin": "deep olive warm skin, rich Mediterranean tan undertone, naturally clear with subtle texture, healthy not airbrushed, no heavy foundation look",
  "hair": "very dark brown to black, medium length, loose and slightly wavy, falls naturally around face and shoulders — not blown out, not styled",
  "makeup": "minimal — touch of mascara, natural lip color, no foundation, no contouring",
  "clothing": "cozy light beige or dusty rose knit sweater, casual and comfortable",
  "background": "softly blurred warm Turkish apartment interior — hints of natural wood furniture and warm neutral tones, bokeh depth",
  "lighting": "natural side window light, soft flattering shadows across face, no harsh highlights",
  "style": "photorealistic, candid portrait, shot on iPhone 15, natural grain, not studio photography",
  "persona": "naturally attractive woman you might know from your neighborhood — not a model, not an influencer, not a beauty queen, not a stock photo. She looks like she has a real life."
}
```

---

### Selection criteria

Reject: perfect symmetry, over-lit studio look, Instagram filter feel, hollow cheekbones, fashion-forward styling, anything that looks hired.

Accept: the result where your first reaction is "she seems kind" before "she seems pretty." Slight natural imperfections are a plus. Pick based on face expression and naturalness — phenotype doesn't matter.

> **Note:** nano-banana-pro embeds a SynthID watermark in all outputs. This is invisible to the human eye and does not affect ad use — Meta's systems do not detect or flag it.

---

## 2. Room Staging — Fon Perdeler (Living Room)

**Model:** `fal-ai/nano-banana-pro`
**URL:** https://fal.ai/models/fal-ai/nano-banana-pro
**Cost:** $0.15 per image ($0.30 at 4K)

### Settings

| Parameter | Value |
|-----------|-------|
| aspect_ratio | `9:16` (portrait — critical for Reels) |
| resolution | `2K` |
| num_images | `4` |
| output_format | `jpeg` |
| safety_tolerance | `4` |

### Prompt

```
Photorealistic interior photograph of a modern Turkish apartment living room,
large double window with floor-length sheer beige linen fon perde curtains,
warm late afternoon sunlight filtering softly through the fabric creating gentle shadows,
light parquet wood floor, simple modern sofa and furniture in warm neutral tones,
lived-in cozy atmosphere, not a staged showroom,
vertical 9:16 composition with the window as the visual focal point,
no people, sharp detail on curtain fabric folds and texture,
realistic Turkish apartment — not minimalist Scandinavian, not luxury penthouse
```

### After generating

- Verify: curtain color and fabric texture look realistic (not oversaturated or glowing)
- Verify: room feels like a real Turkish apartment (standard window proportions, typical furniture)
- Verify: window is not cut off at the bottom of the frame — avatar overlay sits bottom-left in CapCut
- If the room is right but curtain color/style is wrong: use the **`/edit` endpoint** (see section 2b)

---

## 2b. Room Image Editing (if curtain needs adjustment)

**Model:** `fal-ai/nano-banana-pro` — `/edit` endpoint
**URL:** https://fal.ai/models/fal-ai/nano-banana-pro/edit
**Cost:** $0.15 per edit

### Settings

| Parameter | Value |
|-----------|-------|
| image_urls | Upload or paste URL of the generated room image (up to 14 images supported) |
| aspect_ratio | `9:16` |
| resolution | `2K` |
| output_format | `jpeg` |

### Edit prompts (examples)

```
Change the curtain fabric to a warm ivory cream linen, keep the same drape,
folds, and room — only the curtain color and texture changes
```

```
Make the curtain slightly more sheer so afternoon light filters through more softly,
keep everything else in the room exactly the same
```

```
Change curtain color to light grey, same heavy linen fabric texture and drape,
keep the room, lighting, and composition identical
```

> **Tip:** nano-banana-pro uses natural language holistically — describe *what you want changed* and *what should stay the same* explicitly. It understands both equally well.

---

## 3. Room Staging — Blackout Perdeler (Bedroom)

**Model:** `fal-ai/nano-banana-pro`
**URL:** https://fal.ai/models/fal-ai/nano-banana-pro
**Cost:** $0.15 per image

### Settings

Same as section 2 (`9:16`, `2K`, `num_images: 4`).

### Prompt

```
Photorealistic interior photograph of a modern Turkish apartment bedroom,
large double window with floor-length dark charcoal grey blackout curtains fully closed,
daytime — outside light completely blocked by the curtains demonstrating the blackout effect,
warm bedside lamp casting a cozy golden glow, light parquet or laminate floor,
simple modern bed with neutral bedding, clean and comfortable atmosphere,
vertical 9:16 composition with the curtained window prominent,
no people, sharp detail on the heavy fabric texture and fullness of the curtain folds,
realistic Turkish apartment bedroom — not a hotel room, not a luxury suite
```

### After generating

- Key check: the blackout effect must be visible — the window should appear dark/blocked, not glowing through
- Curtain should look heavy and opaque, not translucent
- Same lived-in Turkish apartment feel as the living room image

---

## 4. Curtain Animation — Fon Perdeler

**Model:** `fal-ai/veo3.1/first-last-frame-to-video` (standard quality)
**URL:** https://fal.ai/models/fal-ai/veo3.1/first-last-frame-to-video
**Draft model:** `fal-ai/veo3.1/fast/first-last-frame-to-video` — half cost ($0.80 vs $1.60 for 8s)
**Cost:** $0.20/sec at 1080p, no audio ($1.60 for 8s)

**Why this model:** Setting the same room image as both `first_frame_url` and `last_frame_url` locks the composition at start and end — no camera drift, no furniture warp. The model animates only what the prompt describes (curtain movement) between two identical frames, producing a naturally loopable clip. See `veo3-reference.md` for full model comparison.

### Settings

| Parameter | Value | Notes |
|-----------|-------|-------|
| `first_frame_url` | Upload `assets/room-fon-living.jpg` | Start frame — max 8MB |
| `last_frame_url` | Upload `assets/room-fon-living.jpg` | **Same image** — locks composition |
| `prompt` | See below | |
| `negative_prompt` | See below | |
| `resolution` | `1080p` | Use `720p` for drafts |
| `duration` | `8s` | Max duration — gives most footage to trim in CapCut |
| `aspect_ratio` | `9:16` | Portrait for Reels (inferred from image if set to `auto`) |
| `generate_audio` | `false` | Voiceover comes from ElevenLabs |
| `safety_tolerance` | `4` | Default |

### Prompt

```
Sheer linen curtain gently billowing in a soft indoor breeze through a slightly open window,
slow graceful fabric movement with natural wave patterns,
warm afternoon light shifting subtly through the fabric,
camera completely still, floor and furniture completely static,
only the curtain fabric moves
```

### Negative prompt

```
camera movement, zoom, pan, tilt, camera shake,
distorted furniture, warped floor, rippling walls,
fast motion, time lapse, people, hands
```

### Quality check

- Curtain motion is slow and natural — fabric physics, not a fan blowing
- Camera is completely still — no drift, no zoom, no pan
- Floor, walls, and furniture are static throughout
- First and last frames match the input image composition

### If quality is insufficient after 2 attempts

Fall back to `fal-ai/veo3.1/image-to-video` (single image input) — or `fal-ai/kling-video/v2.1/pro/image-to-video` which has a **Motion Brush** mask tool to spatially constrain movement to the curtain area only.

---

## 5. Curtain Animation — Blackout Perdeler

**Model:** `fal-ai/veo3.1/first-last-frame-to-video` (standard quality)
**URL:** https://fal.ai/models/fal-ai/veo3.1/first-last-frame-to-video
**Draft model:** `fal-ai/veo3.1/fast/first-last-frame-to-video`
**Cost:** $0.20/sec at 1080p, no audio ($1.60 for 8s)

### Settings

Same as section 4, with `assets/room-blackout-bedroom.jpg` as **both** `first_frame_url` and `last_frame_url`.

### Prompt

```
Heavy blackout curtain panels with subtle slow fabric texture movement,
barely perceptible natural sway as if from a very gentle air current,
cozy dimly lit bedroom atmosphere maintained,
camera completely still,
only the heavy curtain fabric moves slightly
```

### Negative prompt

```
camera movement, zoom, pan, camera shake,
sheer curtain, transparent fabric, light through curtain,
distorted furniture, warped floor, fast motion, people
```

> **Note:** Blackout curtain movement should be very minimal. Heavy panels sway slightly — they do not billow. The negative prompt explicitly excludes sheer/transparent fabric to preserve the blackout look.

---

## 6. Talking Avatar Video — Video 1

**Model:** `fal-ai/creatify/aurora`
**URL:** https://fal.ai/models/fal-ai/creatify/aurora
**Cost:** $0.14/sec at 720p (~$3.50 for a 25s clip)

### Inputs

| Parameter | Value |
|-----------|-------|
| `image_url` | Upload `assets/avatar-portrait.jpg` |
| `audio_url` | Upload `assets/video1-voice.mp3` |
| `resolution` | `720p` (use for final output; use `480p` for test drafts at $0.07/s) |
| `guidance_scale` | `1` (default — how closely the model follows the text prompt) |
| `audio_guidance_scale` | `2` (default — lip-sync adherence; increase to `3` if sync feels loose) |

### Prompt

```
Turkish woman speaking warmly to camera, natural conversational tone,
medium close-up framing, steady eye contact, slight natural head movement,
soft indoor lighting, studio quality
```

### Guidance scale tuning

| Parameter | Lower value | Higher value |
|-----------|-------------|--------------|
| `guidance_scale` (0–5) | Less prompt influence, more natural movement | More rigid adherence to prompt description |
| `audio_guidance_scale` (0–5) | Looser lip-sync, more natural motion | Tighter lip-sync precision |

Start with defaults (`1` / `2`). If lip-sync looks off: raise `audio_guidance_scale` to `3`. If movement looks robotic: lower `guidance_scale` to `0.5`.

### Quality check

- Lip-sync matches audio throughout — check mid-clip and final seconds, not just the start
- Eyes look natural (no rapid blinking, no glassy stare)
- Head movement feels human and unhurried
- No mouth or jaw distortion artifacts

### Supported audio formats

mp3, ogg, wav, m4a, aac — all accepted. Use `video1-voice.mp3` from ElevenLabs directly.

### If quality is insufficient

Try `fal-ai/kling-video/v1/pro/ai-avatar` (https://fal.ai/models/fal-ai/kling-video/v1/pro/ai-avatar) — same image + audio inputs, $0.115/sec, different rendering approach.

---

## 7. Talking Avatar Video — Video 2

**Model:** `fal-ai/creatify/aurora`
**Same settings as section 6**, with:

| Parameter | Value |
|-----------|-------|
| `image_url` | Same `assets/avatar-portrait.jpg` |
| `audio_url` | Upload `assets/video2-voice.mp3` |
| `resolution` | `720p` |
| `guidance_scale` | `1` |
| `audio_guidance_scale` | `2` |

Same prompt as Video 1. Using the same portrait image is intentional — visual consistency signals it's the same person across both ads.

---

## 8. Video Background Removal (Avatar)

**Model:** `veed/video-background-removal`
**URL:** https://fal.ai/models/veed/video-background-removal
**Cost:** $0.0225/sec (with edge refinement) · $0.015/sec (without) — a 25s avatar clip ≈ $0.56

### Settings

| Parameter | Value | Notes |
|-----------|-------|-------|
| `video_url` | Upload `assets/video1-avatar-raw.mp4` | Required — hosted URL or direct upload |
| `output_codec` | `vp9` | **vp9 = single `.webm` with alpha channel** — preferred for CapCut overlay. `h264` produces two separate files (RGB + alpha mask). |
| `refine_foreground_edges` | `true` | Enables edge smoothing — keep enabled for hair and shoulders |
| `subject_is_person` | `true` | Optimizes model for human subject — always set true for avatar videos |

### Output

- **vp9 (recommended):** single `.webm` file with embedded alpha transparency — import directly into CapCut as overlay
- **h264:** two files (RGB video + alpha mask) — requires compositing in a video editor; skip unless CapCut rejects the `.webm`

Save output as:
- `assets/video1-avatar-transparent.webm`
- `assets/video2-avatar-transparent.webm`

### Quality check

Inspect edge quality around hair and shoulders. Check a mid-clip frame, not just the first frame. The subject_is_person + refine_foreground_edges combination should produce clean edges without fringing.

### CapCut fallback

If the `.webm` output has rough edges or CapCut can't import it:
1. Import the raw avatar video into CapCut
2. Select the clip → **Edit** → scroll toolbar → **AI Tools** → **Background Removal**
3. Export the processed clip and use it as the transparent overlay

---

## 9. Image Background Removal (Avatar Portrait — optional)

**Model:** `fal-ai/birefnet`
**URL:** https://fal.ai/models/fal-ai/birefnet
**Cost:** Sub-cent per image

Use this to clean the avatar portrait *before* feeding it to Kling AI Avatar, if the generated portrait has a complex background that might confuse the lip-sync model.

### Settings

| Parameter | Value |
|-----------|-------|
| Input | Upload `assets/avatar-portrait.jpg` |
| Model | BiRefNet-portrait |
| Resolution | 1024px |

Output: PNG with transparent background. Use this as the input to Kling AI Avatar instead of the original JPG.

---

## Cost Summary

| Task | Model | Unit cost | Expected quantity | Total |
|------|-------|-----------|-------------------|-------|
| Avatar portrait | nano-banana-pro | $0.15/img | 4 images | $0.60 |
| Room: fon | nano-banana-pro | $0.15/img | 4 images | $0.60 |
| Room: blackout | nano-banana-pro | $0.15/img | 4 images | $0.60 |
| Room edits (if needed) | nano-banana-pro /edit | $0.15/edit | 0–4 edits | $0–0.60 |
| Fon animation (8s, 1080p) | veo3.1/first-last-frame-to-video | $0.20/s | 1–2 clips | $1.60–3.20 |
| Blackout animation (8s, 1080p) | veo3.1/first-last-frame-to-video | $0.20/s | 1–2 clips | $1.60–3.20 |
| Avatar video V1 (25s) | creatify/aurora 720p | $0.14/s | 25s | $3.50 |
| Avatar video V2 (25s) | creatify/aurora 720p | $0.14/s | 25s | $3.50 |
| BG removal | veed/video-background-removal | $0.0225/s | 2 × 25s clips | ~$1.13 |
| **Total estimate** | | | | **~$14–19** |

> **Draft tips:**
> - Avatar: use `resolution: 480p` ($0.07/s) for test runs. Switch to `720p` for final export.
> - Curtain animation: use `fal-ai/veo3.1/fast` ($0.10/s) for test prompts. Switch to standard `fal-ai/veo3.1/image-to-video` ($0.20/s) at `1080p` for final output.
