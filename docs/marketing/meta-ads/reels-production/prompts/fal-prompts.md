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

### Prompt

```
Portrait photo of a Turkish woman, 32 years old, warm genuine smile, natural minimal makeup,
wearing casual home clothes such as a light knit sweater or simple blouse,
softly blurred modern apartment interior background, looking directly at camera,
natural window lighting from the side, photorealistic, shot on iPhone,
real everyday person — not a model, not an influencer, not a stock photo,
warm skin tone, dark hair, relaxed expression
```

### Selection criteria

Pick the result that looks most like a real person you might meet in İskenderun. Reject any image that looks like a stock photo, has overly perfect symmetry, or looks like an Instagram influencer. She should look like she actually buys curtains for her own home.

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

**Model:** `fal-ai/kling-video/v2.1/pro/image-to-video`
**URL:** https://fal.ai/models/fal-ai/kling-video/v2.1/pro/image-to-video
**Cost:** ~$0.49 for 5 seconds

### Settings

| Parameter | Value |
|-----------|-------|
| Input image | `assets/room-fon-living.jpg` |
| Duration | `5` seconds |
| Aspect ratio | `9:16` |
| cfg_scale | `0.5` |
| output_format | `mp4` |

### Motion prompt

```
Sheer linen curtain gently billowing in a soft indoor breeze through a slightly open window,
slow graceful fabric movement with natural wave patterns,
warm afternoon light shifting subtly through the fabric,
camera completely still, no camera movement, floor and furniture completely static,
only the curtain fabric moves
```

### Dynamic mask (strongly recommended)

If the playground shows a **Motion Brush** or mask drawing tool:
1. Draw a rough selection over the curtain panels only
2. Leave floor, furniture, and walls outside the mask
3. This constrains all motion to the curtain, preventing furniture from warping

### Quality check

- Motion should look like real fabric physics — smooth wave, not jitter
- Floor and furniture should not distort or ripple
- If motion looks unnatural: lower cfg_scale to `0.4` and regenerate
- If furniture distorts regardless: use the static image in CapCut instead of the animated clip

---

## 5. Curtain Animation — Blackout Perdeler

**Model:** `fal-ai/kling-video/v2.1/pro/image-to-video`
**URL:** https://fal.ai/models/fal-ai/kling-video/v2.1/pro/image-to-video
**Cost:** ~$0.49 for 5 seconds

### Settings

Same as section 4 (`5s`, `9:16`, `cfg_scale: 0.5`), with `assets/room-blackout-bedroom.jpg` as input.

### Motion prompt

```
Heavy blackout curtain panels with subtle slow fabric texture movement,
barely perceptible natural sway as if from a very gentle air current,
cozy bedroom atmosphere maintained,
camera completely still, only the curtain fabric has minimal movement,
dramatic heavy fabric with deep folds
```

> **Note:** Blackout curtain movement should be very minimal — these are heavy panels. The goal is just enough motion to show the fabric is real, not a freeze frame. Too much movement will look wrong for a blackout product.

---

## 6. Talking Avatar Video — Video 1

**Model:** `fal-ai/kling-video/v1/pro/ai-avatar`
**URL:** https://fal.ai/models/fal-ai/kling-video/v1/pro/ai-avatar
**Cost:** $0.115 per second of output (~$2.88 for a 25s clip)

> Note: `fal-ai/creatify` and `fal-ai/aurora` return 404 as of March 2026. Kling AI Avatar is the current replacement.

### Inputs

| Input | Value |
|-------|-------|
| image_url | Upload `assets/avatar-portrait.jpg` |
| audio_url | Upload `assets/video1-voice.mp3` |

### Optional prompt

```
Turkish woman talking naturally and warmly to camera,
slight natural head movement, genuine friendly expression,
simple indoor background, conversational energy
```

### Quality check

- Lip-sync matches audio throughout (check mid-clip and end, not just the first few seconds)
- Eyes look natural — no rapid blinking, no glassy stare
- Head movement is subtle and human (not robotic nodding)
- No mouth distortion artifacts

### If quality is insufficient

Switch to `fal-ai/bytedance/omnihuman/v1.5` (https://fal.ai/models/fal-ai/bytedance/omnihuman/v1.5) — same inputs, higher realism, $0.16/sec.

---

## 7. Talking Avatar Video — Video 2

**Model:** `fal-ai/kling-video/v1/pro/ai-avatar`
**Same settings as section 6**, with:

| Input | Value |
|-------|-------|
| image_url | Same `assets/avatar-portrait.jpg` |
| audio_url | Upload `assets/video2-voice.mp3` |

Using the same portrait image for both videos is intentional — visual consistency signals it's the same person across both ads.

---

## 8. Video Background Removal (Avatar)

**Model:** `fal-ai/bria/video/background-removal`
**URL:** https://fal.ai/models/fal-ai/bria/video/background-removal
**Cost:** Check playground (not listed on pricing page)

### Input

Upload `assets/video1-avatar-raw.mp4` (or video2).

### Quality check

Inspect edge quality around hair and shoulders. Check a mid-clip frame, not just the first frame.

### CapCut fallback

If fal.ai output has rough edges:
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
| Fon animation | kling v2.1 i2v | ~$0.49/5s | 1–2 clips | $0.49–0.98 |
| Blackout animation | kling v2.1 i2v | ~$0.49/5s | 1–2 clips | $0.49–0.98 |
| Avatar video V1 (25s) | kling ai-avatar | $0.115/s | 25s | $2.88 |
| Avatar video V2 (25s) | kling ai-avatar | $0.115/s | 25s | $2.88 |
| BG removal | bria video | TBD | 2 videos | TBD |
| **Total estimate** | | | | **~$9–12** |
