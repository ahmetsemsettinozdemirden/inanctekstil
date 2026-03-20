# CapCut Assembly — Video 2: "Odanda Gör: Evinizde Dene"

**Canvas:** 1080×1920 (9:16) | **Target duration:** 25–28 seconds

> ⚠️ Only begin assembly after: (1) Odanda Gör is confirmed live on iPhone, (2) screen recordings are complete (Task 11), (3) Video 2 avatar and voiceover are generated.

---

## Assets needed before opening CapCut

| File | Source |
|------|--------|
| `video2-avatar-transparent.webm` | fal.ai Bria background removal |
| `screen-odanda-gor-flow.mp4` | iPhone screen recording |
| `blackout-ar-screenshot.jpg` | iPhone screenshot from Odanda Gör tool |
| `fon-ar-screenshot.jpg` | iPhone screenshot from Odanda Gör tool |

---

## Layer structure

```
Layer 3 (top):    Auto-captions (text)
Layer 2 (middle): Avatar overlay — bottom-left, ~30% frame width
Layer 1 (base):   Context video clips — full 9:16 frame
```

---

## Step 1 — Create new project

Open CapCut → **New Project** → select `screen-odanda-gor-flow.mp4` as the first clip.

Verify canvas is **9:16 / 1080×1920**. If wrong: tap **Format** → select 9:16.

---

## Step 2 — Build the base (context) track

| Order | Clip | Target duration | Notes |
|-------|------|-----------------|-------|
| 1 | `screen-odanda-gor-flow.mp4` | 5s | First part — feature opening screen |
| 2 | `screen-odanda-gor-flow.mp4` (continuation) | 10s | Middle part — the upload + AR result flow. Use the segment that shows: select product → upload photo → result loads → hold on result |
| 3 | `blackout-ar-screenshot.jpg` | 3.5s | **Still image** — see note below |
| 4 | `fon-ar-screenshot.jpg` | 3.5s | **Still image** — see note below |
| 5 | `screen-odanda-gor-flow.mp4` (final section) | 5s | End of the recording — website visible with Odanda Gör entry point |

**To add a clip:** Tap the **+** at the end of the main timeline → select from camera roll.

**Transitions:** Hard cuts only — tap the white square between clips → select **None**.

---

## Handling still images (clips 3 and 4)

JPG images in CapCut default to a 3-second duration. To change to 3.5 seconds:
- Tap the image clip in the timeline
- Tap the right edge of the clip and drag it right to extend to 3.5s
- Or: tap the clip → tap **Duration** field → type `3.5`

**Do NOT** apply any animation to the still images:
- Disable Ken Burns (zoom/pan effect) — tap the clip → check if "Animation" is enabled → turn it off
- These screenshots should be completely static and stable — the content is the AR result, not the motion

---

## Step 3 — Scale clips to fill frame

For each clip and image:
- Tap → pinch-zoom on the canvas preview until the content fills the full 9:16 frame with no black bars
- For the AR screenshots: scale up so the room and curtain fill the frame; the top/bottom may crop slightly — ensure the window with the curtain stays visible

---

## Step 4 — Add avatar as overlay

The avatar is a **separate track above the base** — do NOT add it to the main timeline.

1. Tap anywhere on the canvas (deselect everything)
2. In the bottom toolbar: **Overlay** → **Add overlay** → select `video2-avatar-transparent.webm`
3. The avatar appears as a floating element on the canvas preview
4. **Position:** drag to **bottom-left corner**
5. **Size:** pinch to ~**30% of frame width** (~320px). Same size as Video 1.
6. **Duration:** drag the overlay clip's right edge to the end of the project
7. **Background removal:** do NOT re-enable — background is already removed

---

## Step 5 — CTA text overlay (Segment 4, 22–28s)

The final base clip already shows the website — no separate dark card needed.

Add a text overlay for the last 6 seconds:
1. Tap **Text** → type: `inanctekstil.store`
2. Style: white, large, centered at bottom of frame (above the avatar)
3. Duration: 6 seconds, starting at the 22-second mark
4. Optional: add a subtle tap/click sticker near the Odanda Gör button area on the screen recording

---

## Step 6 — Auto-captions

Same process as Video 1:
1. Bottom toolbar → **Captions** → **Auto Captions** → Language: **Turkish** → Generate
2. Review every caption for accuracy — correct manually where needed
3. Batch style: white text, black outline, large size, centered-bottom position (above avatar)

---

## Step 7 — Ambient audio

Same process as Video 1:
- **Audio** → **Sounds** → search `indoor ambient` or `room tone`
- Volume: **10–15%** — barely audible
- The avatar voiceover is the primary audio

---

## Step 8 — Final review

Watch on your **phone** at full screen.

- [ ] AR screenshots look convincing — the curtain looks realistic in the room
- [ ] Segments 1–2 screen recordings show the actual flow clearly (not too fast, not too slow)
- [ ] Segment 3 AR screenshots are static — no zoom or movement animation
- [ ] AR screenshots in Segment 3 match what the avatar says she tried (blackout then fon)
- [ ] Avatar visible throughout, bottom-left, not cut off
- [ ] Captions accurate throughout
- [ ] Total duration: 25–28 seconds

---

## Step 9 — Export

| Setting | Value |
|---------|-------|
| Resolution | 1080p |
| Frame rate | 30fps |
| Format | MP4 |
| Quality | Recommended |

Save as: `assets/Video2-OdandaGör-FINAL.mp4`
