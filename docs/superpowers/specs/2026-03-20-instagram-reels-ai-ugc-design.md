# Instagram Reels AI UGC Video Ads — Design Spec
## İnanç Tekstil

**Date:** 2026-03-20
**Status:** Approved

---

## Overview

Two 15–30 second Instagram Reels ads for inanctekstil.store. Both use an AI avatar persona — a trusted 10-year customer of İnanç Tekstil — commenting over a context video that changes with what she's saying. Manual creative workflow using fal.ai, ElevenLabs, and CapCut. Products: **Fon Perdeler** and **Blackout Perdeler** only.

---

## Avatar Persona

**Who she is:** A Turkish woman (25–35) who has bought from İnanç Tekstil for 10 years. She knows the family personally. She is not a brand spokesperson or influencer — she is a loyal customer recommending her trusted shop to a friend. Her tone is warm, certain, and conversational. No superlatives, no sales energy. Pure personal testimony.

**Voice:** Warm, conversational female Turkish voice. Generated via ElevenLabs (same voice session for both videos — consistency).

**Visual:** Head and shoulders, transparent background. Generated via fal.ai Creatify/Aurora (avatar photo + ElevenLabs audio → lip-synced talking head video).

---

## Layer Structure (Both Videos)

```
Layer 1 (base):   Context video — full 9:16 frame, changes per script segment
Layer 2 (overlay): Avatar — transparent bg, head+shoulders, fixed bottom-left
Layer 3 (top):    Auto-captions (CapCut)
Audio:            ElevenLabs TTS (lip-synced by Creatify/Aurora)
```

**Export spec:** 9:16, 1080×1920, for Instagram Reels and Meta feed placement.

---

## Production Workflow

Applies to both videos, in order:

```
1. Finalize Turkish script (customer voice — see scripts below)
2. ElevenLabs → generate .mp3 voiceover (warm female Turkish voice)
3. fal.ai Creatify/Aurora → avatar photo + .mp3 → lip-synced talking head video
                             (transparent background output)
4. fal.ai → generate AI room staging images
            (fon perdeler in Turkish living room, blackout in Turkish bedroom)
5. Kling → animate room images with gentle curtain movement (3–5 sec clips)
6. iPhone screen record → inanctekstil.store + Odanda Gör flow
7. CapCut assembly:
     a. Context video clips on base layer (cut per script segment)
     b. Avatar video overlay, bottom-left, ~30% screen width
     c. Auto-captions on text layer
     d. Sound effects (ElevenLabs SFX or CapCut library)
     e. Export 9:16 1080×1920
```

---

## Video 1 — "30 Yıllık Güven, Artık Online"

**Goal:** Introduce inanctekstil.store to people who may know the physical shop but haven't bought online. Establish trust via customer testimony.

**Script + Context Segments:**

| Time | Avatar (customer voice) | Context video |
|------|------------------------|---------------|
| 0–5s | *"İnanç Tekstil'den 10 yıldır alıyorum — İskenderun'da herkese tavsiye ettiğim perde ustası."* | AI-staged living room with fon perdeler (warm afternoon light, Turkish apartment) |
| 5–14s | *"Artık online da sipariş verebiliyorsunuz. inanctekstil.store — ölçünüzü girin, kumaşı seçin, size özel diksinler."* | Screen recording of inanctekstil.store on iPhone, scrolling product page |
| 14–22s | *"Fon ve blackout seçenekleri var, her ölçüye özel dikiyorlar — hazır kalıp yok."* | 2 cuts: fon perde in living room → blackout perde in bedroom (AI-staged) |
| 22–28s | *"Bir bakın derim, pişman olmazsınız."* | Website URL on screen + WhatsApp number |

**Assets required:**
- fal.ai: AI room staging — fon perdeler in Turkish living room (warm light)
- fal.ai: AI room staging — blackout perdeler in Turkish bedroom
- Kling: animate both room images (curtain movement, 3–5 sec)
- Screen recording: inanctekstil.store product page on iPhone (portrait)

---

## Video 2 — "Odanda Gör: Evinizde Dene"

**Goal:** Drive awareness and trial of the Odanda Gör AR feature. Remove the #1 purchase hesitation for curtains: "will it look right in my room?"

**Script + Context Segments:**

| Time | Avatar (customer voice) | Context video |
|------|------------------------|---------------|
| 0–5s | *"Perde seçerken en büyük sorun — 'evimde nasıl durur acaba?' Tam benim sorunum buydu."* | Screen recording: Odanda Gör feature opening on iPhone |
| 5–15s | *"İnanç Tekstil'in sitesinde bir özellik var — odasının fotoğrafını yükle, perdeyi seç, hemen görürsün."* | Screen recording: uploading room photo → selecting fon perde → AR result appearing |
| 15–22s | *"Blackout denedim, fon denedim — karar vermeden önce kendi odamda gördüm."* | 2 cuts: same room with blackout → same room with fon (AR screenshots or AI-staged) |
| 22–28s | *"inanctekstil.store — gidin, deneyin."* | Website on screen with Odanda Gör button visible |

**Assets required:**
- Screen recording: full Odanda Gör flow on iPhone (the primary asset — must be real)
- AR screenshots or fal.ai staging: same room with blackout vs. fon variants
- fal.ai: AI room staging backup if AR screenshots are insufficient

---

## Asset Production Notes

### fal.ai Room Staging Prompts (guidance)

For both videos, the AI-staged rooms should feel like **real Turkish apartments**, not Scandinavian showrooms:
- Tiled or parquet floors
- Standard Turkish double window format (two panels)
- Warm, lived-in interiors — not minimalist or overly styled
- Fon: warm afternoon light, living room or salon
- Blackout: bedroom, daytime darkness effect visible

### ElevenLabs Voice Notes

- Select a warm, natural-sounding Turkish female voice (not robotic or overly formal)
- Generate both scripts in the same session / same voice ID for consistency
- Pacing: conversational, slight pauses between sentences — not rushed
- Avoid voice effects — plain TTS output is more authentic

### CapCut Assembly Notes

- Avatar overlay: bottom-left, ~30% of frame width, no border or shadow effects
- Context video transitions: simple cuts (no transitions) — more authentic
- Captions: white text, black outline, large enough to read on mobile
- Sound effects: subtle ambient room sounds under voiceover, not music-led

---

## Content Strategy Notes

- **Tone guard:** Avatar never sounds like a brand ad. If a line sounds like marketing copy, rewrite it as something a person would actually say to a friend.
- **No product claims that AI imagery overstates:** The curtain must always be a real product photo or AI-staged with accurate color/texture. Never let AI hallucinate fabric appearance.
- **CTA:** Both videos end with website URL. WhatsApp number as secondary CTA (Video 1 only — appropriate for the "I trust them" message).
- **Turkish market note:** WhatsApp CTA is critical for custom/made-to-measure. Video 1 includes it. Video 2 is feature-focused so website CTA is sufficient.

---

## Success Metrics (Meta Ads)

| Metric | What to watch |
|--------|--------------|
| 3-second view rate | Is the hook working? Target >40% |
| CTR (link) | Is the message driving clicks? Target >1.5% |
| Landing page view rate | Does the page match the promise? |
| Cost per landing page view | Overall efficiency benchmark |
| Frequency | Rotate creative when >3/week per person |

---

## Related Docs

- `docs/marketing/meta-ads/creative-strategy-ugc-ai.md` — full AI+UGC strategy
- `docs/marketing/meta-ads/conversion-optimization-strategy.md` — signal accumulation
- `docs/brand/marka-kimligi.md` — brand voice and persona guidelines
