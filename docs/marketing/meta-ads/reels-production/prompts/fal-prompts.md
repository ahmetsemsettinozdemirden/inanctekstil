# fal.ai Prompts & Settings Reference

All models accessed via web playground at `fal.ai/models/<model-id>` — no code required.

---

## 1. Avatar Portrait Generation

**Model:** `fal-ai/flux-pro/v1.1-ultra`
**URL:** https://fal.ai/models/fal-ai/flux-pro/v1.1-ultra
**Cost:** $0.06 per image

### Settings

| Parameter | Value |
|-----------|-------|
| Image size | 1024×1024 (square) or 896×1152 (portrait) |
| num_images | 4 (generate multiple, pick best) |
| guidance_scale | 3.5 (default) |
| output_format | jpeg |

### Prompt

```
Portrait photo of a Turkish woman, 32 years old, warm genuine smile, natural minimal makeup,
wearing casual home clothes such as a light knit sweater or simple blouse,
softly blurred modern apartment interior background, looking directly at camera,
natural window lighting from the side, photorealistic, shot on iPhone,
real everyday person — not a model, not an influencer, not a stock photo,
warm skin tone, dark hair, relaxed expression
```

### Negative guidance (if the model supports it)

```
model, influencer, fashion shoot, studio lighting, heavy makeup,
perfect symmetry, uncanny, AI-looking, oversaturated, HDR
```

### Selection criteria

Pick the result that looks most like a real person you might meet in İskenderun. Reject any image that looks like a stock photo, has overly perfect symmetry, or looks like an Instagram influencer. She should look like she actually buys curtains for her own home.

---

## 2. Room Staging — Fon Perdeler (Living Room)

**Model:** `fal-ai/flux-pro/v1.1-ultra`
**URL:** https://fal.ai/models/fal-ai/flux-pro/v1.1-ultra
**Cost:** $0.06 per image

### Settings

| Parameter | Value |
|-----------|-------|
| Image size | 1080×1920 (9:16 portrait — critical for Reels) |
| num_images | 4 |
| guidance_scale | 3.5 |
| output_format | jpeg |

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
- Verify: window is not cut off at the bottom of the frame — avatar overlay will sit bottom-left
- If the room is right but curtain color/style is wrong: use **fal-ai/flux-pro/kontext** to edit (see section 2b below)

---

## 2b. Room Image Editing (if curtain needs adjustment)

**Model:** `fal-ai/flux-pro/kontext`
**URL:** https://fal.ai/models/fal-ai/flux-pro/kontext
**Cost:** $0.04 per edit

### Settings

| Parameter | Value |
|-----------|-------|
| Input | Upload the generated room image |
| output_format | jpeg |

### Edit prompts (examples)

```
Change the curtain fabric to a warm ivory/cream linen, same drape and folds, keep the room identical
```

```
Make the curtain slightly more sheer so light filters through more softly, same room
```

```
Change curtain color to light grey, same fabric texture and drape, keep everything else identical
```

---

## 3. Room Staging — Blackout Perdeler (Bedroom)

**Model:** `fal-ai/flux-pro/v1.1-ultra`
**URL:** https://fal.ai/models/fal-ai/flux-pro/v1.1-ultra
**Cost:** $0.06 per image

### Settings

Same as section 2 (1080×1920, num_images: 4).

### Prompt

```
Photorealistic interior photograph of a modern Turkish apartment bedroom,
large double window with floor-length dark charcoal grey blackout curtains fully closed,
daytime — outside light completely blocked by the curtains demonstrating blackout effect,
warm bedside lamp casting a cozy golden glow, light parquet or laminate floor,
simple modern bed with neutral bedding, clean and comfortable atmosphere,
vertical 9:16 composition with the curtained window prominent,
no people, sharp detail on the heavy fabric texture and fullness of the curtain folds,
realistic Turkish apartment bedroom — not a hotel room, not a luxury suite
```

### After generating

- Key check: the blackout effect should be visible — window should appear dark/blocked, not glowing
- Curtain should look heavy and opaque, not sheer
- Same Turkish apartment feel as the living room image

---

## 4. Curtain Animation — Fon Perdeler

**Model:** `fal-ai/kling-video/v2.1/pro/image-to-video`
**URL:** https://fal.ai/models/fal-ai/kling-video/v2.1/pro/image-to-video
**Cost:** ~$0.49 for 5 seconds

### Settings

| Parameter | Value |
|-----------|-------|
| Input image | `assets/room-fon-living.jpg` |
| Duration | 5 seconds |
| Aspect ratio | 9:16 |
| cfg_scale | 0.5 |
| output_format | mp4 |

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
2. Leave the floor, furniture, and walls unmasked
3. This constrains all motion to the curtain, preventing furniture from warping

### Quality check

- Motion should look like real fabric physics — smooth wave, not jitter
- Floor and furniture should not distort or ripple
- If motion looks unnatural: lower cfg_scale to 0.4 and regenerate
- If furniture distorts: use the dynamic mask, or use the static image in CapCut instead

---

## 5. Curtain Animation — Blackout Perdeler

**Model:** `fal-ai/kling-video/v2.1/pro/image-to-video`
**URL:** https://fal.ai/models/fal-ai/kling-video/v2.1/pro/image-to-video
**Cost:** ~$0.49 for 5 seconds

### Settings

Same as section 4 (5s, 9:16, cfg_scale 0.5), with `assets/room-blackout-bedroom.jpg` as input.

### Motion prompt

```
Heavy blackout curtain panels with subtle slow fabric texture movement,
barely perceptible natural sway as if from a very gentle air current,
cozy bedroom atmosphere maintained,
camera completely still, only the curtain fabric has minimal movement,
dramatic heavy fabric with deep folds
```

**Note:** Blackout curtain movement should be very minimal — these are heavy panels. The goal is just enough motion to show the fabric is real, not a freeze frame. Overcorrecting here will look wrong.

---

## 6. Talking Avatar Video — Video 1

**Model:** `fal-ai/kling-video/v1/pro/ai-avatar`
**URL:** https://fal.ai/models/fal-ai/kling-video/v1/pro/ai-avatar
**Cost:** $0.115 per second of output (~$2.88 for a 25s clip)

> Note: `fal-ai/creatify` and `fal-ai/aurora` return 404 as of March 2026. Kling AI Avatar is the current replacement — same one-step workflow.

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

- Lip-sync matches audio throughout (not just the first few seconds)
- Eyes look natural — no rapid blinking, no glassy stare
- Head movement is subtle and human (not robotic nodding)
- No mouth distortion artifacts

### If quality is insufficient

Switch to `fal-ai/bytedance/omnihuman/v1.5` (https://fal.ai/models/fal-ai/bytedance/omnihuman/v1.5) — same inputs, higher realism, $0.16/sec. Use for the final output if Kling avatar has artifacts.

---

## 7. Talking Avatar Video — Video 2

**Model:** `fal-ai/kling-video/v1/pro/ai-avatar`
**Same settings as section 6**, with:

| Input | Value |
|-------|-------|
| image_url | Same `assets/avatar-portrait.jpg` |
| audio_url | Upload `assets/video2-voice.mp3` |

Using the same portrait image for both videos is intentional — visual consistency signals it's the same person.

---

## 8. Video Background Removal (Avatar)

**Model:** `fal-ai/bria/video/background-removal`
**URL:** https://fal.ai/models/fal-ai/bria/video/background-removal
**Cost:** Check playground (not listed on pricing page)

### Input

Upload `assets/video1-avatar-raw.mp4` (or video2).

### Quality check

Inspect edge quality around:
- Hair (most difficult — stray hairs should be clean, not cut off)
- Shoulders (should be a clean line, not blurry)
- Any frames where the avatar moves more (check mid-clip, not just first frame)

### CapCut fallback

If fal.ai output has rough edges:
1. Import `video1-avatar-raw.mp4` into CapCut
2. Select the clip in the timeline
3. Tap **Edit** → scroll toolbar → **AI Tools** → **Background Removal**
4. CapCut processes the video and removes the background in-app
5. Export this clip and use it as the transparent overlay

---

## 9. Image Background Removal (Avatar Portrait — if needed for clean input)

**Model:** `fal-ai/birefnet`
**URL:** https://fal.ai/models/fal-ai/birefnet
**Cost:** Sub-cent per image

Use this to clean the avatar portrait *before* feeding it to the Kling AI Avatar model, if the generated portrait has a complex or busy background that might confuse the lip-sync model.

### Settings

| Parameter | Value |
|-----------|-------|
| Input | Upload `assets/avatar-portrait.jpg` |
| Model | BiRefNet-portrait (best for human subjects) |
| Resolution | 1024px |

Output: PNG with transparent background. Replace the original portrait JPG with the clean cutout before uploading to Kling AI Avatar.

---

## Cost Summary

| Task | Model | Unit cost | Expected quantity | Total |
|------|-------|-----------|-------------------|-------|
| Avatar portrait | flux-pro/v1.1-ultra | $0.06/img | 4 images | $0.24 |
| Room: fon | flux-pro/v1.1-ultra | $0.06/img | 4 images | $0.24 |
| Room: blackout | flux-pro/v1.1-ultra | $0.06/img | 4 images | $0.24 |
| Room edits (if needed) | flux-pro/kontext | $0.04/edit | 0–4 edits | $0–0.16 |
| Fon animation | kling v2.1 i2v | ~$0.49/5s | 1–2 clips | $0.49–0.98 |
| Blackout animation | kling v2.1 i2v | ~$0.49/5s | 1–2 clips | $0.49–0.98 |
| Avatar video (V1, 25s) | kling ai-avatar | $0.115/s | 25s | $2.88 |
| Avatar video (V2, 25s) | kling ai-avatar | $0.115/s | 25s | $2.88 |
| BG removal | bria video | TBD | 2 videos | TBD |
| **Total estimate** | | | | **~$7–9** |
