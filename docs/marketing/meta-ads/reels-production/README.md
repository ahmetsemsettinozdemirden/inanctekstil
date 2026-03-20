# Instagram Reels Production — İnanç Tekstil

Two 15–30 second Instagram Reels video ads. Manual workflow — no code.

---

## Videos

| Video | Concept | Status |
|-------|---------|--------|
| **Video 1** | "30 Yıllık Güven, Artık Online" — brand trust, website intro | Ready to produce |
| **Video 2** | "Odanda Gör: Evinizde Dene" — AR feature demo | ⚠️ Blocked on Odanda Gör going live |

---

## Tools

| Tool | What for | Cost |
|------|----------|------|
| **ElevenLabs** (elevenlabs.io) | Turkish voiceover audio | Free tier or $5/mo |
| **fal.ai** (fal.ai/models) | Avatar, room images, animations, BG removal | ~$4–5/video |
| **iPhone** | Screen recordings of website + Odanda Gör | Free |
| **CapCut** | Final video assembly | Free |

---

## Documentation

| Document | Contents |
|----------|----------|
| `scripts/video1-script.md` | Full Turkish script, segment breakdown, ElevenLabs settings |
| `scripts/video2-script.md` | Same for Video 2 |
| `prompts/fal-prompts.md` | All fal.ai model IDs, input settings, copy-paste prompts, cost estimates |
| `guide-elevenlabs.md` | Voice selection criteria, settings, export guide |
| `capcut/video1-assembly.md` | Step-by-step CapCut assembly for Video 1 |
| `capcut/video2-assembly.md` | Step-by-step CapCut assembly for Video 2 |

---

## Production order

```
Video 1 only (start here):

1. scripts/video1-script.md        ← finalize Turkish script
2. guide-elevenlabs.md             ← generate video1-voice.mp3, save voice ID
3. prompts/fal-prompts.md §1       ← generate avatar-portrait.jpg
4. prompts/fal-prompts.md §6       ← generate video1-avatar-raw.mp4
5. prompts/fal-prompts.md §8       ← remove avatar background
6. prompts/fal-prompts.md §2–3     ← generate room staging images
7. prompts/fal-prompts.md §4–5     ← animate room images
8. iPhone screen recording         ← screen-website-scroll.mp4
9. capcut/video1-assembly.md       ← assemble + export
10. Launch in Meta Ads Manager     ← run for 500+ impressions

Then (only after Odanda Gör is live):

11. scripts/video2-script.md       ← confirm/revise script against real AR flow
12. guide-elevenlabs.md            ← generate video2-voice.mp3 (same voice ID)
13. prompts/fal-prompts.md §7      ← generate video2-avatar-raw.mp4
14. prompts/fal-prompts.md §8      ← remove avatar background
15. iPhone screen recording        ← screen-odanda-gor-flow.mp4 + AR screenshots
16. capcut/video2-assembly.md      ← assemble + export
17. Launch Video 2 in Meta Ads     ← compare CTR against Video 1
```

---

## Assets folder

All generated assets save to `assets/`:

```
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
```

---

## Related docs

- Spec: `docs/superpowers/specs/2026-03-20-instagram-reels-ai-ugc-design.md`
- Production plan (task checklist): `docs/superpowers/plans/2026-03-20-instagram-reels-production.md`
- Creative strategy: `docs/marketing/meta-ads/creative-strategy-ugc-ai.md`
- Brand voice: `docs/brand/marka-kimligi.md`
