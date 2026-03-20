# Instagram Reels AI UGC Video Production Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce two 15–30 second Instagram Reels video ads for inanctekstil.store using AI-generated room staging, a lip-synced AI avatar, and CapCut assembly — manual creative workflow, no code.

**Architecture:** Each video is assembled in CapCut from three layers: (1) context video clips (AI-staged rooms + screen recordings), (2) transparent-background talking-head avatar overlay (bottom-left), (3) auto-generated captions. All AI generation happens on fal.ai; voice on ElevenLabs; final edit in CapCut.

**Tech Stack:** fal.ai (FLUX 1.1 Pro Ultra for images, Kling v2.1 Pro for image-to-video, Kling AI Avatar for lip-sync, Bria for background removal), ElevenLabs (TTS), CapCut (assembly), iPhone (screen recording)

---

## Model Reference (fal.ai — confirmed March 2026)

| Task | Model ID | Cost |
|------|----------|------|
| Room staging (image gen) | `fal-ai/flux-pro/v1.1-ultra` | $0.06/image |
| Iterate/edit existing image | `fal-ai/flux-pro/kontext` | $0.04/edit |
| Curtain animation (image→video) | `fal-ai/kling-video/v2.1/pro/image-to-video` | ~$0.49/5s clip |
| Talking avatar (photo+audio→video) | `fal-ai/kling-video/v1/pro/ai-avatar` | $0.115/sec |
| Higher-quality avatar (alternative) | `fal-ai/bytedance/omnihuman/v1.5` | $0.16/sec |
| Video background removal | `fal-ai/bria/video/background-removal` | check playground |
| Image background removal | `fal-ai/birefnet` | sub-cent/image |

**Estimated cost per finished Reel:** ~$3–4 in fal.ai credits.

> ⚠️ **Creatify/Aurora:** The spec originally referenced `fal-ai/creatify` and `fal-ai/aurora`. Both return 404 as of March 2026 — not accessible on fal.ai. The spec has been updated to reflect this. `fal-ai/kling-video/v1/pro/ai-avatar` is the replacement — same workflow (portrait photo + audio → lip-synced video), same one-step process.

---

## Output File Structure

```
docs/marketing/meta-ads/reels-production/
  scripts/
    video1-script.md        ← Final Turkish script, ElevenLabs settings, line-by-line timing
    video2-script.md        ← Same for Video 2
  prompts/
    fal-prompts.md          ← All fal.ai prompts, copy-paste ready
  assets/
    avatar-portrait.jpg
    video1-voice.mp3
    video2-voice.mp3
    video1-avatar-raw.mp4
    video2-avatar-raw.mp4
    video1-avatar-transparent.webm
    video2-avatar-transparent.webm
    room-fon-living.jpg
    room-blackout-bedroom.jpg
    room-fon-animated.mp4
    room-blackout-animated.mp4
    screen-website-scroll.mp4
    screen-odanda-gor-flow.mp4
    blackout-ar-screenshot.jpg
    fon-ar-screenshot.jpg
    Video1-30YilGüven-FINAL.mp4
    Video2-OdandaGör-FINAL.mp4
  capcut/
    video1-assembly.md      ← CapCut step-by-step for Video 1
    video2-assembly.md      ← CapCut step-by-step for Video 2
```

---

## Phase 1 — Scripts

### Task 1: Write and finalize Video 1 script

**File:** `docs/marketing/meta-ads/reels-production/scripts/video1-script.md`

- [ ] Create the file with the following content:

```markdown
# Video 1 Script — "30 Yıllık Güven, Artık Online"

**Duration target:** 25–28 seconds
**Voice:** ElevenLabs — warm Turkish female, conversational pace
**Segment timing is approximate — adjust to actual TTS output**

---

## Segment 1 (0–5s)
**Avatar says:**
> "30 yıldır İskenderun'da perde diken aile işletmesi — ben de 10 yıldır onlardan alıyorum."

**Context video:** AI-staged living room with fon perdeler (warm afternoon light)

---

## Segment 2 (5–14s)
**Avatar says:**
> "Artık online da sipariş verebiliyorsunuz. inanctekstil.store — ölçünüzü girin, kumaşı seçin, size özel diksinler."

**Context video:** Screen recording of inanctekstil.store on iPhone (product page scroll)

---

## Segment 3 (14–22s)
**Avatar says:**
> "Fon ve blackout seçenekleri var, her ölçüye özel dikiyorlar — hazır kalıp yok."

**Context video:** 2 cuts — fon perde in living room → blackout perde in bedroom

---

## Segment 4 (22–28s)
**Avatar says:**
> "Bir bakın derim, pişman olmazsınız."

**Context video:** CapCut CTA card — website URL + WhatsApp number

---

## ElevenLabs Settings
- Voice: [select warm Turkish female voice — test 2–3 options first, paste chosen voice ID here]
- Model: Eleven Multilingual v2
- Stability: 0.45–0.55 (slight variation feels more human)
- Similarity Boost: 0.75
- Style: 0 (no exaggeration)
- Speaker Boost: enabled
- Export format: MP3, 44.1kHz
```

- [ ] Read through the script aloud — does it sound like a real person talking to a friend, not a brand ad? Revise any line that sounds like marketing copy.
- [ ] Save the file.
- [ ] Commit: `git add docs/marketing/meta-ads/reels-production/scripts/video1-script.md && git commit -m "content: add Video 1 script — brand trust Reel"`

---

### Task 2: Write and finalize Video 2 script

**File:** `docs/marketing/meta-ads/reels-production/scripts/video2-script.md`

> ⚠️ Video 2 is blocked on Odanda Gör being live. Write the script now; do not produce audio or video until the feature is confirmed live and visually polished on iPhone.

- [ ] Create the file with the following content:

```markdown
# Video 2 Script — "Odanda Gör: Evinizde Dene"

**Duration target:** 25–28 seconds
**Voice:** Same ElevenLabs voice ID as Video 1 (critical — paste voice ID here after Video 1 is done)
**Segment timing is approximate — adjust to actual TTS output**

---

## Segment 1 (0–5s)
**Avatar says:**
> "Perde seçerken en büyük sorun — 'evimde nasıl durur acaba?' Tam benim sorunum buydu."

**Context video:** Screen recording — Odanda Gör feature opening on iPhone

---

## Segment 2 (5–15s)
**Avatar says:**
> "İnanç Tekstil'in sitesinde bir özellik var — odasının fotoğrafını yükle, perdeyi seç, hemen görürsün."

**Context video:** Screen recording — upload room photo → select fon perde → AR result

---

## Segment 3 (15–22s)
**Avatar says:**
> "Blackout denedim, fon denedim — karar vermeden önce kendi odamda gördüm."

**Context video:** 2 cuts — same room with blackout → same room with fon
(Use AR screenshots from the tool. Only use fal.ai staging as fallback — see spec for why.)

---

## Segment 4 (22–28s)
**Avatar says:**
> "inanctekstil.store — gidin, deneyin."

**Context video:** Website on screen, Odanda Gör entry point visible

---

## ElevenLabs Settings
- Voice: [SAME voice ID as Video 1 — paste here]
- All other settings: identical to Video 1
```

- [ ] Save the file.
- [ ] Commit: `git add docs/marketing/meta-ads/reels-production/scripts/video2-script.md && git commit -m "content: add Video 2 script — Odanda Gör Reel"`

---

## Phase 2 — Voice Generation (ElevenLabs)

### Task 3a: Generate Video 1 voiceover

**Output file:** `docs/marketing/meta-ads/reels-production/assets/video1-voice.mp3`

- [ ] Open ElevenLabs (elevenlabs.io) → Text to Speech
- [ ] Browse voices → filter by Language: Turkish → test at least 3 warm female voices with this sentence: *"30 yıldır İskenderun'da perde diken aile işletmesi."* Pick the most natural, non-announcer-sounding voice.
- [ ] **Save the chosen voice ID** — paste it into `scripts/video1-script.md` AND `scripts/video2-script.md` (both videos must use the same voice).
- [ ] Set parameters: Eleven Multilingual v2, Stability 0.45–0.55, Similarity Boost 0.75, Style 0, Speaker Boost on.
- [ ] Paste the full Video 1 script (all 4 segments as one block) into the text field.
- [ ] Generate. Listen through completely. Check:
  - No robotic artifacts or unnatural pauses
  - Pacing feels conversational (not rushed, not slow)
  - `inanctekstil.store` is pronounced clearly (if not, write it phonetically: *"inanç tekstil nokta store"*)
- [ ] If not satisfied: adjust Stability by ±0.05 and regenerate.
- [ ] Download as MP3 → save to `assets/video1-voice.mp3`
- [ ] Commit: `git add docs/marketing/meta-ads/reels-production/assets/video1-voice.mp3 && git commit -m "asset: Video 1 ElevenLabs voiceover"`

---

### Task 3b: Generate Video 2 voiceover

**Output file:** `docs/marketing/meta-ads/reels-production/assets/video2-voice.mp3`

> ⚠️ **BLOCKER:** Only proceed after confirming Odanda Gör is live and visually ready on iPhone (see Task 11). Do not generate Video 2 audio before the feature is confirmed — the script may need to be revised based on what the actual AR flow looks like.

- [ ] Confirm Odanda Gör is live before continuing.
- [ ] Open ElevenLabs → use the **same voice ID** saved in Task 3a.
- [ ] Paste full Video 2 script → generate → review for naturalness.
- [ ] Download as MP3 → save to `assets/video2-voice.mp3`
- [ ] Commit: `git add docs/marketing/meta-ads/reels-production/assets/video2-voice.mp3 && git commit -m "asset: Video 2 ElevenLabs voiceover"`

---

## Phase 3 — Avatar Video Generation (fal.ai)

### Task 4: Generate avatar portrait

**Output file:** `docs/marketing/meta-ads/reels-production/assets/avatar-portrait.jpg`

- [ ] Open fal.ai playground → `fal.ai/models/fal-ai/flux-pro/v1.1-ultra`
- [ ] Use this prompt:

```
Portrait photo of a Turkish woman, 32 years old, warm smile, natural makeup,
wearing casual home clothes (light sweater), modern Istanbul apartment interior
background (slightly blurred), looking directly at camera, natural lighting,
photorealistic, not a model or influencer — a real everyday person, shot on iPhone
```

- [ ] Image size: square (1:1) or portrait, minimum 512×512. Avoid landscape.
- [ ] Generate 4 images. Pick the most natural-looking, least "model-like" result.
- [ ] Verify: she should look like someone who buys curtains for her own home, not a fashion shoot.
- [ ] Save chosen image as `assets/avatar-portrait.jpg`
- [ ] Commit.

---

### Task 5: Generate lip-synced avatar video (Video 1)

**Output file:** `docs/marketing/meta-ads/reels-production/assets/video1-avatar-raw.mp4`

> **Note:** The spec originally referenced `fal-ai/creatify` — that model returns 404 on fal.ai as of March 2026. `fal-ai/kling-video/v1/pro/ai-avatar` is the direct replacement with the same workflow.

- [ ] Open fal.ai playground → `fal.ai/models/fal-ai/kling-video/v1/pro/ai-avatar`
- [ ] Upload: `avatar-portrait.jpg` as image input
- [ ] Upload: `video1-voice.mp3` as audio input
- [ ] Optional prompt: `"woman talking naturally, slight head movement, warm expression, solid neutral background for easy removal"`
- [ ] Generate. Review output:
  - Lip-sync matches the audio throughout
  - No uncanny valley artifacts (eye glitches, mouth distortion)
  - Head movement feels natural (not robotic)
- [ ] If Kling avatar quality is not convincing: switch to `fal.ai/models/fal-ai/bytedance/omnihuman/v1.5` — same inputs, higher realism ($0.16/sec vs $0.115/sec).
- [ ] Save output as `assets/video1-avatar-raw.mp4`
- [ ] Commit.

---

### Task 6: Generate lip-synced avatar video (Video 2)

**Output file:** `docs/marketing/meta-ads/reels-production/assets/video2-avatar-raw.mp4`

> ⚠️ Only after Task 3b (Video 2 voice) is complete.

- [ ] Same process as Task 5 using `video2-voice.mp3` and the same `avatar-portrait.jpg`
- [ ] Save as `assets/video2-avatar-raw.mp4`
- [ ] Commit.

---

### Task 7: Remove avatar video background

**Output files:**
- `docs/marketing/meta-ads/reels-production/assets/video1-avatar-transparent.webm`
- `docs/marketing/meta-ads/reels-production/assets/video2-avatar-transparent.webm`

- [ ] Open fal.ai playground → `fal.ai/models/fal-ai/bria/video/background-removal`
- [ ] Upload `video1-avatar-raw.mp4` → download result
- [ ] Inspect for clean edges around hair and shoulders on a few frames.
- [ ] Save as `assets/video1-avatar-transparent.webm`
- [ ] Repeat for `video2-avatar-raw.mp4` → save as `assets/video2-avatar-transparent.webm`
- [ ] Commit both files.

> **CapCut fallback (if fal.ai output has rough edges):** Import the raw avatar video into CapCut → select the clip → tap "..." or "Edit" → AI Tools → Background Removal. CapCut's built-in removal is reliable for portrait videos against simple backgrounds. Export as video and use in place of the fal.ai output.

---

## Phase 4 — Room Staging Images (fal.ai)

### Task 8: Generate room staging images

**Output files:**
- `assets/room-fon-living.jpg`
- `assets/room-blackout-bedroom.jpg`

- [ ] Open fal.ai playground → `fal.ai/models/fal-ai/flux-pro/v1.1-ultra`
- [ ] Image size: 1080×1920 (9:16 portrait for Reels)
- [ ] Generate room 1 — fon perdeler, living room:

```
Photorealistic interior photo of a modern Turkish apartment living room,
sheer beige linen curtains (fon perde) on a large double window,
warm afternoon sunlight filtering through the fabric, parquet floor,
simple Turkish home furniture, lived-in and cozy atmosphere,
9:16 vertical composition with window centered, no people, sharp focus on curtains
```

- [ ] Generate room 2 — blackout perdeler, bedroom:

```
Photorealistic interior photo of a modern Turkish apartment bedroom,
dark grey blackout curtains (blackout perde) fully closed on a double window,
cozy nighttime atmosphere, warm bedside lamp light, parquet floor,
simple modern bed and furniture, 9:16 vertical composition with window prominent,
no people, sharp detail on curtain fabric and folds
```

- [ ] Generate 4 variants of each. For each, verify:
  - Curtain color/texture looks realistic (not AI-hallucinated oversaturated fabric)
  - Room feels like a real Turkish apartment (tiled or parquet floor, standard windows)
  - Composition works for 9:16 with avatar overlay in bottom-left — window should not be cut off at bottom
- [ ] If a room is right but curtain is wrong: use `fal.ai/models/fal-ai/flux-pro/kontext` — upload the image + prompt: `"change curtains to [specific color] linen fabric, keep same room and lighting"`
- [ ] Save the best result for each room.
- [ ] Commit.

---

## Phase 5 — Curtain Animation (fal.ai)

### Task 9: Animate room staging images

**Output files:**
- `assets/room-fon-animated.mp4`
- `assets/room-blackout-animated.mp4`

> **Note:** The spec references `kling.ai web app`. This plan uses the **fal.ai playground** for Kling v2.1 Pro instead — same Kling model, accessed via fal.ai's web UI (no account required beyond fal.ai login), and fal.ai exposes the `dynamic_mask_url` parameter which constrains motion to the curtain only. The kling.ai web app is an alternative if you prefer Kling's native UI, but fal.ai's playground is recommended for this workflow.

- [ ] Open fal.ai playground → `fal.ai/models/fal-ai/kling-video/v2.1/pro/image-to-video`
- [ ] Upload `room-fon-living.jpg`
- [ ] Settings:
  - Duration: 5 seconds
  - Aspect ratio: 9:16
  - CFG scale: 0.5
- [ ] Motion prompt:

```
Sheer curtain gently billowing in a soft breeze, slow and graceful fabric movement,
warm afternoon light, no camera movement, room stays still, only curtain moves
```

- [ ] **Dynamic mask (strongly recommended):** If the playground shows a "Motion Brush" or mask option, draw a rough selection over the curtain area only. This prevents the floor and furniture from distorting.
- [ ] Review output: motion should look natural, not jittery or warped. If jittery: reduce CFG to 0.4 and regenerate.
- [ ] Save as `assets/room-fon-animated.mp4`
- [ ] Repeat for `room-blackout-bedroom.jpg` with motion prompt:

```
Heavy blackout curtain with subtle fabric texture movement, minimal slow sway,
no camera movement, room stays still, cozy bedroom atmosphere
```

- [ ] Save as `assets/room-blackout-animated.mp4`
- [ ] Commit both files.

---

## Phase 6 — Screen Recordings (iPhone)

### Task 10: Record inanctekstil.store product page (Video 1)

**Output file:** `assets/screen-website-scroll.mp4`

- [ ] On iPhone: Settings → Control Centre → verify Screen Recording is available (tap the record button icon)
- [ ] Open Safari → navigate to `inanctekstil.store` → go to the Fon Perdeler or Blackout collection page
- [ ] Swipe down from top-right corner → tap Screen Recording button → 3-second countdown starts → begin recording
- [ ] Scroll naturally through the product grid for 6–8 seconds (unhurried pace)
- [ ] Tap into one product briefly (2 seconds), scroll the product page, then go back
- [ ] Stop recording: swipe down → tap red record button → "Stop"
- [ ] Find recording in Photos app → review: is the page visually polished? Are product images loading properly?
- [ ] Transfer to Mac (AirDrop or cable) → save as `assets/screen-website-scroll.mp4`
- [ ] Commit.

---

### Task 11: Record Odanda Gör flow + save AR screenshots (Video 2)

**Output files:**
- `assets/screen-odanda-gor-flow.mp4`
- `assets/blackout-ar-screenshot.jpg`
- `assets/fon-ar-screenshot.jpg`

> ⚠️ **BLOCKER:** Only proceed when Odanda Gör is confirmed live, accessible, and visually polished on iPhone. A buggy or incomplete AR demo will permanently damage trust — this is the primary asset for Video 2.

- [ ] Confirm Odanda Gör is live at `inanctekstil.store` and accessible from a product page
- [ ] Prepare a test room photo on your phone — a real room with a visible window works best
- [ ] **Do a dry run first** (without recording): go through the full flow once to know the exact taps required
- [ ] Plan the recording flow:
  1. Open the Odanda Gör feature
  2. Select a **fon perde** product
  3. Upload the room photo
  4. Wait for AR result to load → hold for 3 seconds
  5. **Take a screenshot here** (side button + volume up) → this is `fon-ar-screenshot.jpg`
  6. Go back → select a **blackout perde**
  7. Wait for AR result → hold for 3 seconds
  8. **Take a screenshot here** → this is `blackout-ar-screenshot.jpg`
- [ ] Now record the full flow in one take (start recording before opening the feature)
- [ ] Stop recording → review: is the AR result convincing? Does the curtain look realistic?
- [ ] Transfer video to Mac → save as `assets/screen-odanda-gor-flow.mp4`
- [ ] Transfer screenshots to Mac → save as `assets/fon-ar-screenshot.jpg` and `assets/blackout-ar-screenshot.jpg`
- [ ] Commit all three files: `git add docs/marketing/meta-ads/reels-production/assets/screen-odanda-gor-flow.mp4 assets/blackout-ar-screenshot.jpg assets/fon-ar-screenshot.jpg && git commit -m "asset: Odanda Gör screen recording + AR screenshots"`

---

## Phase 7 — CapCut Assembly

### Task 12: Assemble Video 1 in CapCut

**Reference file:** `docs/marketing/meta-ads/reels-production/capcut/video1-assembly.md`
**Output file:** `assets/Video1-30YilGüven-FINAL.mp4`

- [ ] Create `capcut/video1-assembly.md` with this content:

```markdown
# CapCut Assembly — Video 1: "30 Yıllık Güven, Artık Online"

**Canvas:** 1080×1920 (9:16 vertical) | **Target:** 25–28 seconds

## Assets to import before starting
- video1-avatar-transparent.webm
- room-fon-animated.mp4
- room-blackout-animated.mp4
- screen-website-scroll.mp4

---

## Step 1: Create new project

Open CapCut → New Project → select any one of the context videos to start
→ After project opens: tap the settings gear or "..." → set canvas ratio to 9:16
(CapCut may auto-set this from the first clip — verify it says 1080×1920)

## Step 2: Build the base (context) video track

The main timeline is the base layer. Add clips in this order:

| Clip | Duration needed | How to trim |
|------|-----------------|-------------|
| `room-fon-animated.mp4` | 5s | Tap clip → drag right edge left to 5s mark |
| `screen-website-scroll.mp4` | 9s | Trim to best 9 seconds of scroll footage |
| `room-fon-animated.mp4` (add again) | 3s | Use the start of the clip (0–3s) |
| `room-blackout-animated.mp4` | 5s | Full clip or trim to 5s |
| [black or dark solid — see Step 5] | 6s | |

To add a clip: tap the "+" at the end of the timeline → select from your camera roll.
All transitions: **no effect** — tap between two clips → select "None". Hard cuts only.

## Step 3: Scale base clips to fill frame

For each clip on the main track:
Tap the clip → pinch-zoom on the canvas preview to scale up until no black bars appear.
Or: tap the clip → tap "Scale" button (if available) → "Fill".

## Step 4: Add avatar as overlay (Picture-in-Picture)

This is a separate track above the base layer — NOT added to the main timeline.

1. Tap the main timeline so nothing is selected
2. Tap "Overlay" in the bottom tool bar (sometimes labeled "PIP" on older CapCut versions)
3. Tap "Add overlay" → select `video1-avatar-transparent.webm`
4. The avatar clip appears as a floating element on the canvas
5. Drag it to the **bottom-left corner** of the canvas
6. Pinch to resize to approximately **30% of the frame width** (~320px)
7. **Set duration to match full video:** tap the overlay clip in the timeline → tap the right edge → drag to the end of the video (or tap "Duration" field and type the total video duration in seconds)
8. Tap the overlay clip → check "Remove BG" is NOT enabled (the background is already removed from the fal.ai step — enabling it again may degrade quality)

## Step 5: Create CTA card for Segment 4 (22–28s)

At the 22-second mark on the base layer, add a dark background:
- Tap "+" on main track → select a black or very dark solid color clip (CapCut has color clips in the "Color" section of the media library) → set duration to 6s
- Tap "Text" in the toolbar → add text: `inanctekstil.store` → style: white, large, centered
- Tap "Text" again → add second line: WhatsApp number → style: white, smaller, centered below

## Step 6: Add auto-captions

Tap the main clip → scroll the bottom toolbar to find "Captions" or "Auto Captions"
→ Language: Turkish → Generate
→ Review each caption: tap each one to read → correct any mis-heard Turkish words
→ Style: white text, black outline (tap a caption → "Batch Edit" to apply style to all)

## Step 7: Add ambient audio

Tap "Audio" in the bottom toolbar → "Sounds" → search "indoor ambient" or "home interior"
→ Select a subtle, quiet track → trim to full video length
→ Volume: 10–15% (slider far to the left) — barely audible, just adds room presence
→ The avatar's voiceover (embedded in the avatar video) is the primary audio

## Step 8: Final review checklist

Watch the full video on your phone (not just the CapCut preview):
- [ ] Avatar visible throughout, positioned bottom-left, no cutoff at edges
- [ ] No black bars on any clip
- [ ] All captions accurate and readable on mobile without zooming
- [ ] Hard cuts between segments (no dissolve effects)
- [ ] CTA card readable in the last 6 seconds
- [ ] Total duration: 25–28 seconds
- [ ] Avatar voiceover clearly audible; ambient audio very low

## Step 9: Export

Tap the export arrow (top-right) → Resolution: 1080p → Frame rate: 30fps → Export
Save file as: `Video1-30YilGüven-FINAL.mp4`
```

- [ ] Follow the guide step by step in CapCut.
- [ ] At Step 8, watch on your own phone at full screen.
- [ ] Export → save to `assets/Video1-30YilGüven-FINAL.mp4`
- [ ] Commit guide + final video.

---

### Task 13: Assemble Video 2 in CapCut

**Reference file:** `docs/marketing/meta-ads/reels-production/capcut/video2-assembly.md`
**Output file:** `assets/Video2-OdandaGör-FINAL.mp4`

> ⚠️ Only after Tasks 3b, 6, 7 (Video 2 voice, avatar, background removal) and Task 11 (screen recordings) are complete.

- [ ] Create `capcut/video2-assembly.md` with this content:

```markdown
# CapCut Assembly — Video 2: "Odanda Gör: Evinizde Dene"

**Canvas:** 1080×1920 (9:16 vertical) | **Target:** 25–28 seconds

## Assets to import before starting
- video2-avatar-transparent.webm
- screen-odanda-gor-flow.mp4
- blackout-ar-screenshot.jpg
- fon-ar-screenshot.jpg

---

## Step 1: Create new project
Same as Video 1 Step 1 — open CapCut → New Project → verify 9:16 / 1080×1920 canvas.

## Step 2: Build the base (context) video track

| Clip | Duration needed | Notes |
|------|-----------------|-------|
| `screen-odanda-gor-flow.mp4` | 5s | Segment 1 — feature opening |
| `screen-odanda-gor-flow.mp4` (continuation) | 10s | Segment 2 — upload + result. Use the part of the recording that shows the full flow |
| `blackout-ar-screenshot.jpg` | 3.5s | Segment 3, cut 1. **This is a still image** — tap clip after adding → tap "Duration" → type 3.5 |
| `fon-ar-screenshot.jpg` | 3.5s | Segment 3, cut 2. Same — set duration to 3.5s manually |
| `screen-odanda-gor-flow.mp4` (end section) | 5s | Segment 4 — website with Odanda Gör visible |

**Note on still images in CapCut:** When you add a JPG to the timeline, CapCut defaults to a fixed duration (usually 3s). To change it: tap the image clip → tap and drag the right edge, OR tap "Duration" in the clip settings and type 3.5. Do NOT use CapCut's Ken Burns / zoom-pan effect on these — keep still images completely static (no animation) for authenticity.

Hard cuts between all clips. No transitions.

## Step 3: Scale clips to fill frame
Same as Video 1 Step 3 — pinch-zoom each clip to fill 9:16 with no black bars.

## Step 4: Add avatar as overlay (Picture-in-Picture)
Same process as Video 1 Step 4, using `video2-avatar-transparent.webm` instead.
- Import via "Overlay" → "Add overlay" → select `video2-avatar-transparent.webm`
- Position: bottom-left corner, ~30% frame width
- Duration: extend to match full video length

## Step 5: CTA card for Segment 4 (22–28s)
The last base clip already shows the website — no separate CTA card needed.
Add a text overlay: `inanctekstil.store` → white text, centered at bottom of frame → duration: 6s
Alternatively: use CapCut's "Sticker" to add a subtle tap/click animation near the Odanda Gör button.

## Step 6: Auto-captions
Same as Video 1 Step 6 — Turkish language, white + black outline style.

## Step 7: Ambient audio
Same as Video 1 Step 7 — subtle indoor ambient, 10–15% volume.

## Step 8: Final review checklist
- [ ] AR screenshots look convincing and match what avatar is saying
- [ ] Screen recording segments are the right parts of the flow (not too fast, not too slow)
- [ ] Still images are static — no Ken Burns zoom movement
- [ ] Avatar visible throughout, positioned bottom-left
- [ ] Captions accurate throughout
- [ ] Total duration: 25–28 seconds

## Step 9: Export
Same as Video 1 — 1080p, 30fps.
Save as: `Video2-OdandaGör-FINAL.mp4`
```

- [ ] Follow the guide step by step in CapCut.
- [ ] Watch on your own phone at full screen before exporting.
- [ ] Export → save to `assets/Video2-OdandaGör-FINAL.mp4`
- [ ] Commit guide + final video.

---

## Phase 8 — Meta Ads Launch

### Task 14: Launch Video 1 as Meta Reel Ad

- [ ] Go to Meta Ads Manager → create new campaign
- [ ] Objective: **Traffic** (not Conversions — pixel needs more data first; see `conversion-optimization-strategy.md`)
- [ ] Ad set: İskenderun + 30km radius, women 25–54, broad interests (no interest stacking)
- [ ] Ad: upload `Video1-30YilGüven-FINAL.mp4`
- [ ] Primary text: `"30 yıldır İskenderun'da perde dikiyoruz — artık online sipariş verebilirsiniz. Ölçünüzü girin, size özel dikelim. 🔗 inanctekstil.store"`
- [ ] Headline: `"İnanç Tekstil — Özel Dikim Perde"`
- [ ] CTA button: **Shop Now** (Şimdi Alışveriş Yap)
- [ ] Enable **Advantage+ Creative** on the ad
- [ ] Daily budget: ₺150–200/day
- [ ] Launch and monitor:
  - After 200 impressions: check 3-second view rate (target >40%)
  - After 500 impressions: check CTR (target >1.5%) and note the value — needed as gate for Video 2

---

### Task 15: Launch Video 2 as Meta Reel Ad

> ⚠️ **Prerequisites before starting this task:**
> - [ ] Tasks 3b, 6, 7, 11, 13 all complete (Video 2 fully produced)
> - [ ] Odanda Gör is confirmed live
> - [ ] **Video 1 has reached 500+ impressions with a stable CTR baseline** (check Task 14 monitoring data)

- [ ] In Ads Manager: duplicate the Video 1 ad set
- [ ] Swap creative to `Video2-OdandaGör-FINAL.mp4`
- [ ] Update primary text to reference the Odanda Gör feature
- [ ] Run to same audience — compare CTR and landing page view rate against Video 1
- [ ] Whichever performs better after 500 impressions each becomes the primary creative

---

## Appendix: fal.ai Quick Reference

### Accessing model playgrounds
All models available at: `fal.ai/models/<model-id>`

| What you need | URL |
|--------------|-----|
| Room staging image | fal.ai/models/fal-ai/flux-pro/v1.1-ultra |
| Edit existing room image | fal.ai/models/fal-ai/flux-pro/kontext |
| Curtain animation | fal.ai/models/fal-ai/kling-video/v2.1/pro/image-to-video |
| Talking avatar video | fal.ai/models/fal-ai/kling-video/v1/pro/ai-avatar |
| Higher-quality avatar | fal.ai/models/fal-ai/bytedance/omnihuman/v1.5 |
| Remove video background | fal.ai/models/fal-ai/bria/video/background-removal |
| Remove image background | fal.ai/models/fal-ai/birefnet |

---

## Related Docs

- Spec: `docs/superpowers/specs/2026-03-20-instagram-reels-ai-ugc-design.md`
- Creative strategy: `docs/marketing/meta-ads/creative-strategy-ugc-ai.md`
- Conversion optimization: `docs/marketing/meta-ads/conversion-optimization-strategy.md`
- Brand voice: `docs/brand/marka-kimligi.md`
