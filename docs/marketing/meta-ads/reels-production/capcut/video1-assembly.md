# CapCut Assembly — Video 1: "30 Yıllık Güven, Artık Online"

**Canvas:** 1080×1920 (9:16) | **Target duration:** 25–28 seconds

---

## Assets needed before opening CapCut

| File | Source |
|------|--------|
| `video1-avatar-transparent.webm` | fal.ai Bria background removal |
| `room-fon-animated.mp4` | fal.ai Kling i2v |
| `room-blackout-animated.mp4` | fal.ai Kling i2v |
| `screen-website-scroll.mp4` | iPhone screen recording |

---

## Layer structure

```
Layer 3 (top):    Auto-captions (text)
Layer 2 (middle): Avatar overlay — bottom-left, ~30% frame width
Layer 1 (base):   Context video clips — full 9:16 frame
```

---

## Step 1 — Create new project

Open CapCut → **New Project** → select `room-fon-animated.mp4` as the first clip to create the project.

After the project opens, verify the canvas is **9:16 / 1080×1920**:
- Tap the canvas area (not a clip) → look for ratio indicator in the toolbar
- If wrong: tap **Format** or **Ratio** → select 9:16

---

## Step 2 — Build the base (context) track

Add clips to the **main timeline** in this order. The main timeline is Layer 1.

| Order | Clip | Target duration | How to trim |
|-------|------|-----------------|-------------|
| 1 | `room-fon-animated.mp4` | 5s | Drag right edge left to the 5s mark |
| 2 | `screen-website-scroll.mp4` | 9s | Use the 9 most natural-looking seconds of the scroll |
| 3 | `room-fon-animated.mp4` (add again) | 3s | Use the first 3 seconds |
| 4 | `room-blackout-animated.mp4` | 5s | Full clip (or trim to 5s) |
| 5 | [CTA card — dark background] | 6s | See Step 5 |

**To add a clip:** Tap the **+** at the end of the main timeline → select from your camera roll.

**Transitions:** Tap the small white square between two clips → select **None**. Repeat for every transition. Hard cuts only — no dissolves, no fades.

---

## Step 3 — Scale clips to fill frame

For each clip on the main track:
- Tap the clip → on the canvas preview, **pinch-zoom outward** until the video fills the full 9:16 frame with no black bars
- Or: tap the clip → tap **Scale** (if visible) → **Fill**

---

## Step 4 — Add avatar as overlay

The avatar is a **separate track above the base** — do NOT add it to the main timeline.

1. Tap anywhere on the canvas (deselect everything)
2. In the bottom toolbar, scroll right until you find **Overlay** (sometimes labeled **PIP** on older CapCut versions)
3. Tap **Overlay** → **Add overlay** → select `video1-avatar-transparent.webm`
4. The avatar clip appears as a floating element on the canvas preview
5. **Position:** drag it to the **bottom-left corner**
6. **Size:** pinch to resize until it's approximately **30% of the frame width** (~320px wide). Her head and shoulders should be fully visible.
7. **Duration:** The avatar must run for the full video length. Tap the overlay clip in the timeline → drag its right edge to the end of the project. Or: tap the clip → tap **Duration** → type the total video duration in seconds.
8. **Background:** do NOT enable CapCut's Background Removal on this layer — the background is already removed from the fal.ai step. Enabling it again may degrade edge quality.

---

## Step 5 — Create CTA card (Segment 4, 22–28s)

At the 22-second mark on the main timeline:

1. Tap **+** → **Color** (solid color clip) → select black or very dark grey → set duration to 6 seconds
2. Tap **Text** in the toolbar → type: `inanctekstil.store`
   - Font: clean sans-serif (Montserrat, Poppins, or similar)
   - Color: white
   - Size: large — readable on a phone screen at arm's length
   - Position: upper-center of the dark card area
   - Duration: 6 seconds (match the card)
3. Add a second text element: WhatsApp number
   - Same font, smaller size, centered below the URL
4. Optional: add a WhatsApp icon from CapCut's Sticker library (search "whatsapp")

---

## Step 6 — Add auto-captions

1. Select the main timeline clip (or tap the audio waveform)
2. In the bottom toolbar: **Captions** or **Auto Captions**
3. Language: **Turkish**
4. Tap **Generate** and wait
5. Review every caption — tap each one to read it. Auto-captions sometimes mishear Turkish:
   - `inanctekstil.store` often gets mangled — edit it manually
   - Check word boundaries (compounded Turkish words sometimes split wrong)
6. Style: tap one caption → **Batch Edit** → set style for all:
   - Font color: **white**
   - Outline: **black**, medium weight
   - Size: large enough to read on a phone without zooming
   - Position: center-bottom, above the avatar

---

## Step 7 — Add ambient audio

1. Tap **Audio** in the bottom toolbar → **Sounds**
2. Search: `indoor ambient`, `home interior`, or `room tone`
3. Select a subtle, quiet track with no identifiable melody
4. Trim to match the full video length
5. Volume: **10–15%** (barely audible — just adds room presence, not a music bed)
6. The avatar's voiceover (embedded in the avatar video file) is the primary audio — the ambient track should not compete with it

---

## Step 8 — Final review

Watch the full video on your **phone** (not just the CapCut desktop/tablet preview — the viewing context is mobile).

- [ ] Avatar is visible throughout, positioned bottom-left, not cut off at edges
- [ ] No black bars or letterboxing on any clip
- [ ] Captions are accurate, legible, and not overlapping the avatar
- [ ] All cuts are hard (no dissolve effects between clips)
- [ ] CTA card is legible in the final 6 seconds
- [ ] Total duration: 25–28 seconds
- [ ] Avatar voiceover is clearly audible; ambient audio is very soft

---

## Step 9 — Export

Tap the **export arrow** (top-right corner):

| Setting | Value |
|---------|-------|
| Resolution | 1080p |
| Frame rate | 30fps |
| Format | MP4 |
| Quality | Recommended (or highest available) |

Save as: `assets/Video1-30YilGüven-FINAL.mp4`
