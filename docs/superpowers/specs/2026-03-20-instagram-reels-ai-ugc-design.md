# Instagram Reels AI UGC Video Ads — Design Spec
## İnanç Tekstil

**Date:** 2026-03-20
**Status:** Draft

---

## Overview

Two 15–30 second Instagram Reels ads for inanctekstil.store. Both use an AI avatar persona — a trusted 10-year customer of İnanç Tekstil — commenting over a context video that changes with what she's saying. Manual creative workflow using fal.ai, ElevenLabs, and CapCut. Products: **Fon Perdeler** and **Blackout Perdeler** only.

These two videos serve different funnel purposes and should launch sequentially: **Video 1 first** (brand/trust awareness, cold audience), then **Video 2** only after Odanda Gör is confirmed live and visually polished (see blocker note in Video 2 section). Do not run both simultaneously to the same audience — frequency compounds.

---

## Avatar Persona

**Who she is:** A Turkish woman (30–35) who has bought from İnanç Tekstil for 10 years. She knows the family personally. She is not a brand spokesperson or influencer — she is a loyal customer recommending her trusted shop to a friend. Her tone is warm, certain, and conversational. No superlatives, no sales energy. Pure personal testimony.

**Age note:** She is 30–35 to make "10 years as a customer" credible (started at 20–25).

**Voice:** Warm, conversational female Turkish voice. Generated via ElevenLabs (same voice ID for both videos — consistency across the campaign).

**Visual:** Head and shoulders, transparent background. Generated via fal.ai — use **Creatify** for avatar selection and lip-sync video generation (upload avatar photo + ElevenLabs .mp3 → outputs lip-synced talking head video with transparent background). Aurora is an alternative if Creatify is unavailable on fal.ai at time of production.

---

## Layer Structure (Both Videos)

```
Layer 1 (base):   Context video — full 9:16 frame, changes per script segment
Layer 2 (overlay): Avatar — transparent bg, head+shoulders, fixed bottom-left (~30% frame width)
Layer 3 (top):    Auto-captions (CapCut)
Audio:            ElevenLabs TTS (lip-synced by fal.ai Creatify)
```

**Export spec:** 9:16, 1080×1920, for Instagram Reels and Meta feed placement.

---

## Production Workflow

Applies to both videos, in order:

```
1. Finalize Turkish script (customer voice — see scripts below)
2. ElevenLabs → generate .mp3 voiceover
     - Select a warm, natural female Turkish voice (same voice ID both videos)
     - Conversational pacing, slight pauses between sentences
     - Plain TTS output — no effects
3. fal.ai Creatify → avatar photo + .mp3 → lip-synced talking head video
     - Upload: static avatar image (AI-generated Turkish woman, 30–35)
     - Upload: .mp3 from step 2
     - Output: lip-synced video with transparent background (.webm or similar)
4. fal.ai → generate AI room staging images
     - Fon perdeler in Turkish living room (warm afternoon light)
     - Blackout perdeler in Turkish bedroom
     - See fal.ai prompt guidance in Asset Production Notes below
5. Kling → animate room images with curtain movement
     - Input: static room staging image (JPG/PNG from step 4)
     - Access: kling.ai web app (no API needed for manual workflow)
     - Prompt: "gentle curtain breeze, soft fabric movement, 4 seconds, no camera movement"
     - Output: 3–5 sec video clip per image
6. iPhone screen recording → inanctekstil.store pages
     - Video 1: product page scroll (portrait, natural speed)
     - Video 2: full Odanda Gör flow — see blocker note in Video 2 section
7. CapCut assembly:
     a. Context video clips on base layer, cut per script segment (simple cuts, no transitions)
     b. Avatar .webm overlay, bottom-left, ~30% screen width, no border or shadow
     c. Auto-captions: white text, black outline, large mobile-readable size
     d. Sound effects: subtle ambient room audio under voiceover (CapCut library)
     e. Export 9:16 1080×1920
```

---

## Video 1 — "30 Yıllık Güven, Artık Online"

**Goal:** Introduce inanctekstil.store to people who may know the physical shop but haven't ordered online. Establish trust via customer testimony. Cold audience, top of funnel.

**Script + Context Segments:**

| Time | Avatar (customer voice) | Context video | Asset source |
|------|------------------------|---------------|--------------|
| 0–5s | *"30 yıldır İskenderun'da perde diken aile işletmesi — ben de 10 yıldır onlardan alıyorum."* | AI-staged living room with fon perdeler (warm afternoon light, Turkish apartment) | fal.ai → Kling animated |
| 5–14s | *"Artık online da sipariş verebiliyorsunuz. inanctekstil.store — ölçünüzü girin, kumaşı seçin, size özel diksinler."* | Screen recording of inanctekstil.store on iPhone, scrolling product page | iPhone screen record |
| 14–22s | *"Fon ve blackout seçenekleri var, her ölçüye özel dikiyorlar — hazır kalıp yok."* | 2 cuts: fon perde in living room → blackout perde in bedroom | fal.ai → Kling animated (2 images) |
| 22–28s | *"Bir bakın derim, pişman olmazsınız."* | Static graphic: website URL + WhatsApp number (white text on dark background) | CapCut text layer — no screen recording needed |

**Assets required:**
- fal.ai: AI room staging — fon perdeler in Turkish living room (warm light)
- fal.ai: AI room staging — blackout perdeler in Turkish bedroom
- Kling: animate both room images (4 sec curtain movement clips)
- Screen recording: inanctekstil.store product page on iPhone (portrait, natural scroll)
- CapCut: final CTA card (website URL + WhatsApp number as text layer)

---

## Video 2 — "Odanda Gör: Evinizde Dene"

**Goal:** Drive awareness and trial of the Odanda Gör AR feature. Remove the #1 purchase hesitation for curtains: "will it look right in my room?" Cold audience, top of funnel, feature-led.

> **⚠ BLOCKER:** Do not produce or launch Video 2 until the Odanda Gör feature is confirmed live, accessible on iPhone, and visually polished enough to record. A buggy or incomplete feature demo will damage trust. If the feature is not ready, hold this video.

**Script + Context Segments:**

| Time | Avatar (customer voice) | Context video | Asset source |
|------|------------------------|---------------|--------------|
| 0–5s | *"Perde seçerken en büyük sorun — 'evimde nasıl durur acaba?' Tam benim sorunum buydu."* | Screen recording: Odanda Gör feature opening on iPhone | iPhone screen record |
| 5–15s | *"İnanç Tekstil'in sitesinde bir özellik var — odasının fotoğrafını yükle, perdeyi seç, hemen görürsün."* | Screen recording: uploading room photo → selecting fon perde → AR result appearing | iPhone screen record |
| 15–22s | *"Blackout denedim, fon denedim — karar vermeden önce kendi odamda gördüm."* | 2 cuts: same room with blackout → same room with fon | **AR screenshots from the Odanda Gör tool itself (preferred)**. Use fal.ai staging only if AR screenshots are visually insufficient — but note: using AI-staged images here would contradict the claim being made in the voiceover. Resolve before editing. |
| 22–28s | *"inanctekstil.store — gidin, deneyin."* | Website on screen with Odanda Gör entry point visible | iPhone screen record |

**Assets required:**
- Screen recording: full Odanda Gör flow on iPhone — primary asset, must be real (see blocker above)
- AR screenshots: same room with blackout perde vs. fon perde from the actual tool
- Fallback only: fal.ai staging for segment 3 if AR screenshots are unusable (confirm before editing)

---

## Asset Production Notes

### fal.ai Room Staging Prompts (guidance)

Rooms should feel like **real Turkish apartments**, not Scandinavian showrooms:
- Tiled or parquet floors
- Standard Turkish double window format (two panels, curtain rod)
- Warm, lived-in interiors — not minimalist or overly styled
- Fon: warm afternoon light filtering through fabric, living room or salon setting
- Blackout: bedroom, daylight fully blocked, cozy atmosphere

**Critical:** AI staging is for room context only. The curtain color, texture, and drape should match the real product as closely as possible. If the AI output over-saturates or misrepresents the fabric, regenerate. Turkish buyers' top complaint is "fotoğraftaki gibi çıkmadı" — do not create that expectation.

### Kling Animation Notes

- Access: kling.ai web app
- Input: static room image (JPG/PNG, ideally 1080×1920 or 1:1)
- Target output: 4 seconds, no camera movement, only curtain fabric movement
- Review before using: if the motion looks unnatural or distorts the curtain shape, use the static image instead

### ElevenLabs Voice Notes

- Select a warm, natural-sounding Turkish female voice (not robotic or overly formal)
- Generate both video scripts in the same session using the same voice ID
- Pacing: conversational, slight natural pauses between sentences
- No voice effects — plain TTS output is more authentic than processed audio

### CapCut Assembly Notes

- Avatar overlay: bottom-left corner, ~30% of frame width, no border or drop shadow
- Context transitions: simple hard cuts (no dissolves or wipes) — more authentic
- Captions: white text, black outline, large enough to read on mobile without zooming
- Audio: subtle ambient room sounds under voiceover — avoid music-led audio, it signals "advertisement"
- CTA card (Video 1 segment 4): dark background, white text, website URL prominent, WhatsApp number secondary

---

## Content Strategy Notes

- **Tone guard:** Avatar never sounds like a brand ad. If a line reads like marketing copy, rewrite it as something a person would actually say to a friend over WhatsApp.
- **30-year heritage:** Video 1 script opens with it ("30 yıldır... ben de 10 yıldır alıyorum") — connects brand heritage to personal testimony without the avatar sounding like a spokesperson.
- **No AI product misrepresentation:** Curtain appearance must be accurate. AI tools are for room staging context only, never for representing the product itself.
- **WhatsApp CTA:** Video 1 includes it (appropriate for the "trusted recommendation" message). Video 2 is feature-demo focused — website CTA is sufficient.

---

## Success Metrics (Meta Ads)

Both videos target cold audience, top of funnel. Primary goal: quality traffic to the website.

| Metric | Target | What it tells you |
|--------|--------|------------------|
| 3-second view rate | >40% | Is the opening hook working? |
| CTR (link) | >1.5% | Is the message driving clicks? |
| Landing page view rate | >60% of clicks | Does the landing page match the promise? |
| Cost per landing page view | Benchmark after 500 impressions | Overall efficiency |
| Frequency | Rotate creative when >3/week | Audience fatigue signal |

**Testing note:** Launch Video 1 first. Once it has 500+ impressions and a stable CTR baseline, launch Video 2 (if Odanda Gör is ready). Do not run both simultaneously to the same audience — frequency compounds. These are two sequential tests, not a simultaneous campaign pair.

---

## Related Docs

- `docs/marketing/meta-ads/creative-strategy-ugc-ai.md` — full AI+UGC strategy, tool stack, Turkish market context
- `docs/marketing/meta-ads/conversion-optimization-strategy.md` — signal accumulation and optimization goal progression
- `docs/brand/marka-kimligi.md` — brand voice, persona, and tone guidelines
