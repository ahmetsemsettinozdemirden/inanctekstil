# ElevenLabs Voice Guide

Covers voice selection, settings, and export for both Reel videos.

---

## Access

elevenlabs.io → Text to Speech (left sidebar)

---

## Voice Selection

**Goal:** Find a warm, natural Turkish female voice that sounds like a real person, not a narrator or customer service bot.

### How to audition voices

1. Text to Speech → click the voice selector dropdown
2. Filter by: Language → Turkish
3. For each candidate voice, paste this test sentence and press play:
   > *"30 yıldır İskenderun'da perde diken aile işletmesi."*

**Accept** if the voice sounds:
- Warm and conversational
- Like a 30-35 year old woman talking to a friend
- Natural pacing (slight pauses feel human)
- Turkish accent is native, not foreign-sounding

**Reject** if the voice sounds:
- Like a radio presenter or TV announcer
- Overly formal or corporate
- Robotic or monotone
- Rushed or breathless

### Saving the voice ID

After selecting, note down the **voice ID** (visible in the URL or voice settings panel). You must use the same voice ID for both videos — consistency signals it's the same person across both ads.

---

## Settings

| Setting | Video 1 | Video 2 |
|---------|---------|---------|
| Model | Eleven Multilingual v2 | Eleven Multilingual v2 |
| Stability | 0.50 | Same as V1 |
| Similarity Boost | 0.75 | Same as V1 |
| Style | 0 | 0 |
| Speaker Boost | On | On |
| Output format | MP3, 44.1kHz | MP3, 44.1kHz |

**Stability explained:**
- Lower (0.40) = more natural variation between sentences, more human-feeling
- Higher (0.60) = more consistent tone, less variation
- Start at 0.50 — if it sounds robotic, go to 0.45; if it sounds too inconsistent, go to 0.55

**Style = 0** always. Non-zero style values exaggerate emotion and will make the avatar sound performative rather than genuine.

---

## Generating Video 1 audio

Paste the full script as **one block** (all 4 segments together — no line breaks between segments). ElevenLabs handles pacing from the punctuation and sentence rhythm.

```
30 yıldır İskenderun'da perde diken aile işletmesi — ben de 10 yıldır onlardan alıyorum. Artık online da sipariş verebiliyorsunuz. inanctekstil.store — ölçünüzü girin, kumaşı seçin, size özel diksinler. Fon ve blackout seçenekleri var, her ölçüye özel dikiyorlar — hazır kalıp yok. Bir bakın derim, pişman olmazsınız.
```

**Common issue — `inanctekstil.store`:**
If the URL is mispronounced, replace it with the phonetic form:
```
inanç tekstil nokta store
```
Then edit the caption in CapCut to display `inanctekstil.store` correctly.

**Listening checklist:**
- [ ] Natural pacing throughout — no sentences feel rushed
- [ ] Each sentence has a brief natural pause before the next
- [ ] No robotic artifacts or pitch jumps
- [ ] The URL (or phonetic version) is pronounced clearly
- [ ] The tone sounds like someone telling a friend, not recording an ad

---

## Generating Video 2 audio

Use the **same voice ID** as Video 1. Open a new generation with the same settings.

```
Perde seçerken en büyük sorun — "evimde nasıl durur acaba?" Tam benim sorunum buydu. İnanç Tekstil'in sitesinde bir özellik var — odasının fotoğrafını yükle, perdeyi seç, hemen görürsün. Blackout denedim, fon denedim — karar vermeden önce kendi odamda gördüm. inanctekstil.store — gidin, deneyin.
```

**Note on the quoted question:** *"evimde nasıl durur acaba?"* — if ElevenLabs doesn't raise the intonation naturally for the question, add a `?` and re-generate.

---

## Export

After generating and approving:
- Click **Download**
- Format: MP3
- Save Video 1 audio as: `assets/video1-voice.mp3`
- Save Video 2 audio as: `assets/video2-voice.mp3`
