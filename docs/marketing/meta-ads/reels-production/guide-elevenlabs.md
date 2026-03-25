# ElevenLabs Voice Guide

Covers model selection, voice selection, settings, and export for both Reel videos.

---

## Model

**Use `Eleven v3` (`eleven_v3`)** — the current flagship. Do NOT use the older `eleven_multilingual_v2`.

| Model | Languages | Notes |
|-------|-----------|-------|
| **Eleven v3** ✅ | 70+ incl. Turkish | Best Turkish pronunciation, most natural emotional range |
| Eleven Multilingual v2 | 29 incl. Turkish | Older model — still works but v3 is noticeably better for Turkish |
| Eleven Flash v2.5 | 32 incl. Turkish | Fast/cheap, built for real-time agents — not needed here |

In the ElevenLabs UI: Text to Speech → click the model selector → choose **Eleven v3**.

---

## Access

elevenlabs.io → Text to Speech (left sidebar)

---

## Voice Selection

**Goal:** A warm, natural Turkish female voice that sounds like a real person, not a narrator or customer service bot.

### Option A — Voice Library (browse existing voices)

1. Text to Speech → click the voice selector dropdown → **Voice Library**
2. Filter: Language = **Turkish** · Gender = **Female**
3. Sort by: **Most used** or **Highest rated**
4. For each candidate, paste this test sentence and press play:
   > *"İskenderun'da 30 yıldır perde diken bir aile var — ben de tam 10 yıldır müşterisiyim."*

**Accept** if the voice sounds:
- Warm and conversational — like a 30–35 year old woman talking to a friend
- Natural pacing, slight pauses between thoughts
- Native Turkish accent, not foreign-sounding
- Unhurried — not rushed or breathless

**Reject** if the voice sounds:
- Like a radio presenter, TV announcer, or customer service bot
- Overly formal, corporate, or monotone
- Any foreign accent in the Turkish

### Option B — Voice Design (generate a custom voice) ← recommended

Eleven v3 supports generating a custom voice from a text description. This is often better than the library because you can describe the exact persona.

1. Text to Speech → voice selector → **Voice Design**
2. Paste this description:
   ```
   A warm, conversational Turkish woman's voice, approximately 32 years old.
   Natural and unhurried, like she's talking to a close friend.
   Confident but not formal. Native Turkish speaker from southern Turkey.
   Slightly lower pitch than average, friendly and genuine.
   ```
3. Generate 3–4 variants → pick the most natural-sounding result
4. **Save it** to your voice library — name it something like "İnanç Tekstil - Müşteri"

### Saving the voice ID

After selecting or generating a voice, copy the **voice ID** (visible in the URL or voice settings panel after saving). Paste it into `scripts/video2-script.md` — Video 2 must use the exact same voice ID.

---

## Settings

| Setting | Value | Notes |
|---------|-------|-------|
| Model | **Eleven v3** | See above |
| Stability | **Natural** preset | Center position on slider. Natural = balanced, closest to original voice |
| Similarity Boost | **0.75** | High adherence to the chosen voice character |
| Style | **0** | Never raise this — non-zero exaggerates emotion and sounds performative |
| Speaker Boost | **On** | Adds presence and clarity |
| Output format | **MP3, 44.1kHz** | For CapCut import |

**Stability presets explained (Eleven v3):**
- Creative = more expressive but unpredictable, may hallucinate inflection
- **Natural = recommended** — balanced, no exaggeration, closest to how the voice actually sounds
- Robust = very consistent but can sound flat or mechanical

---

## Generating Video 1 audio

Paste the full script as **one block** — no line breaks between segments. ElevenLabs reads punctuation for rhythm: `—` creates a short pause, `...` creates a trailing pause, `.` creates a full breath break.

```
Hazır perde alıyosun, ölçü tutmuyor. İnanç Tekstil — İskenderun'da 30 yıldır perde diken bir aile işletmesi. Siteden sipariş veriliyo, ölçünü giriyosun kumaşını seçiyosun, sana özel dikiyorlar. Hazır kalıp yok ya, her ölçüye göre dikiyorlar. inanç tekstil nokta store.
```

> **URL:** The script uses `inanç tekstil nokta store` (phonetic). Fix the displayed caption in CapCut to show `inanctekstil.store`.

**Listening checklist:**
- [ ] "Ya perdem değişti" — sounds like she's sharing something that just happened, not opening a sales pitch
- [ ] "ben yıllardır oradan alıyorum" — casual and matter-of-fact, not a credibility claim
- [ ] "Artık sitelerinden de sipariş veriliyo" — sounds like news she's passing on, not a product announcement
- [ ] "Hazır kalıp almıyorlar ya" — "ya" sounds like she's reminding you of something obvious, not emphasizing a feature
- [ ] "bence en güzel yanı bu" — personal opinion, slightly understated — not enthusiastic endorsement
- [ ] URL pronounced clearly as "inanç tekstil nokta store"
- [ ] No sentence sounds like it was written down first

If any sentence sounds robotic: switch Stability from Natural → Creative and regenerate.

---

## Generating Video 2 audio

Use the **same voice ID** as Video 1. Open a new generation with identical settings.

```
Perde seçiyosun ama "evimde nasıl durur?" diye kafan çalışıyo ya — İnanç Tekstil'in sitesinde odanın fotoğrafını yüklüyosun, perdeyi seçiyosun, kendi odanda görüyosun. Almadan önce. inanç tekstil nokta store — gir, bir dene.
```

**Note on `kafan çalışıyo ya?`** — the "ya?" should sound like a casual check-in to the viewer, not a dramatic question. If it sounds too performative, try Stability → Creative for a softer, more off-hand delivery.

---

## Export

After generating and approving:
- Click **Download**
- Format: MP3
- Save Video 1 audio as: `assets/video1-voice.mp3`
- Save Video 2 audio as: `assets/video2-voice.mp3`
