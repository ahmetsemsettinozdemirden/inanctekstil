# Kumaş Swatch Dijitalleştirme Rehberi

Perde kumaşlarını AI görüntü üretimi için güvenilir dijital varlıklara dönüştürme kılavuzu.
Hedef: her swatch'tan tutarlı renk, doku, şeffaflık ve desen verisi çıkarmak.

---

## 1. Fiziksel Setup

### 1.1 DIY Işık Kutusu (Lightbox)

**Malzeme Listesi**

| Malzeme | Türkçe | Boyut | Nereden | ~Fiyat |
|---------|--------|-------|---------|--------|
| Karton köpük levha 5mm (×4 adet) | Karton köpük / PVC köpük levha | A1 | Kırtasiye | ₺80–120 |
| Sıcak tutkal tabancası + çubuk | Sıcak tutkal seti | — | Kırtasiye / market | ₺50 |
| Şeffaf düz cam | Float cam (pencere camı) | 35×35cm, 3mm | Yerel camcı | ₺50–80 |
| LED ışık tablası (tracing pad) | A3 LED ışık tablası çizim | A3 (30×42cm) | Trendyol | ₺150–250 |
| Nötr beyaz şerit LED (5000–6500K) | Daylight şerit LED | — | Trendyol | ₺80–150 |
| Renk kalibrasyon kartı | X-Rite ColorChecker Classic Mini | — | Amazon TR / fotoğrafçı | ₺800–1200 |
| Dikey masa üstü kamera standı | Repro standı / dikey telefon standı | — | Trendyol | ₺200–400 |

**Toplam: ~₺1.400–2.250**

---

### 1.2 Kutu Yapımı

İç ölçü: **42×42×20cm** — maket bıçağıyla kes, sıcak tutkal ile birleştir.

```
        Açık üst (kamera buradan bakar)
       ┌──────────────────────────────┐
  LED →│                              │← LED
       │     beyaz iç yüzey           │
  LED →│                              │
       └──────────────────────────────┘
              Açık taban
              (ışık tablası ayrı, Shot 2'de altına konur)
```

- Tüm iç yüzeyler beyaz mat olmalı — karton köpük zaten beyaz
- Şerit LED'leri 3 duvarın **üst kenarına** yapıştır, ışık aşağı-içe doğru duvara vursun (doğrudan kumaşa değil — yayılı ışık için)
- Önden yarım açık bırak — iPhone'a alan açmak için

---

### 1.3 LED Renk Sıcaklığı

Evdeki şerit LED sıcak sarıysa (**warm white, ~2700K**) → renk cast'i oluşturur, kullanma.
**5000–6500K (daylight / soğuk beyaz)** al. Ambalajında Kelvin değeri yazar.

Kontrol: Duvarı ak beyaz bir kağıda yansıt — kağıt sarımtırak görünüyorsa warm white, nötrse daylight.

---

### 1.4 Kamera Setup

- **Cihaz:** iPhone 16 Pro
- **Lens:** 2× (48mm eşdeğeri) — ultra-wide kesinlikle değil, barrel distortion yapar
- **Format:** ProRAW — Settings → Camera → Formats → ProRAW
- **Beyaz balans:** Her oturumda aynı ayar. Camera app'te uzun bas → WB kilit
- **Pozlama:** Kilit — önce bir boş kutu karesiyle doz ayarla, sonra kilitle
- **Zamanlayıcı:** 3 saniye veya **iPhone Mirroring** (MacBook'tan Camera app'i kontrol et — en ergonomik yöntem)
- **Sabit yükseklik:** Tripod direğine bant yapıştır, her seferinde aynı noktaya getir

---

### 1.5 Swatch Yerleşimi

Swatch boyutu: **120×30cm** — lightbox 42cm genişliğinde, kumaş iki yandan sarkar. Bu normal, sorun değil.

```
←——— 120cm ———→
  ←—42cm—→
  ┌────────┐
──┤ capture├──   ← kumaş bu şekilde uzanır, uçlar sarkar
  │  zone  │
  └────────┘
   25×25cm
```

- Kumaşı ortaya hizala — **her iki taraf eşit sarksın**
- Kenarlardan değil, **ortadan** çek — kenarlarda kenar payı (selvedge), üretici etiketi, katlama izi olabilir
- Cam levhayı sadece capture zone'un üstüne koy (tüm kumaşa değil)

---

## 2. Çekim Protokolü

### Oturum öncesi kontrol listesi

- [ ] Kumaş üzerindeki toz ve tüyleri **lint roller** ile temizle — işıkla tüyler gölge yapar
- [ ] Cam levhayı temizle (mikrofiber bez)
- [ ] iPhone lens'ini temizle
- [ ] ColorChecker kartı hazırla
- [ ] Oda ışığını kapat veya kıs — dışarıdan giren ışık renk dengensizliği yaratır
- [ ] Eğer kumaşta katlama izi varsa ütü buharlayıcıyla hafifçe buharla, sonra düzleştir

---

### Shot 1 — Yansımalı Işık (Reflected Light)

**Amaç:** Renk, doku, desen

1. Şerit LED'leri aç
2. Işık tablası kapalı
3. Kumaşı düz yay, cam koy
4. ColorChecker kartı sağ ön köşeye koy (her zaman aynı köşe)
5. Fotoğrafı çek
6. Dosya adı: `{SKU}-reflected.dng`

---

### Shot 2 — Arka Işık (Backlit)

**Amaç:** Şeffaflık ölçümü

1. Şerit LED'leri kapat
2. Kumaşı ışık tablasının üzerine koy — **tek kat, katlanmamış**
3. Cam koy
4. Işık tablasını aç
5. Fotoğrafı çek
6. Dosya adı: `{SKU}-backlit.dng`

> **Neden tek kat?**
> Perde gerçekte tek kat asılır. Çift kat koyarsan şeffaflık değeri yarıya düşer, AI yanlış render eder.

---

### Shot 3 — Baseline (Her Oturumda Bir Kez)

**Amaç:** Şeffaflık hesabında referans

1. Kumaş yok, cam yok, ColorChecker yok
2. Sadece ışık tablası açık
3. Fotoğrafı çek
4. Dosya adı: `baseline-{tarih}.dng`

---

## 3. İşleme Pipeline'ı

### 3.1 Renk Kalibrasyonu

Her Shot 1'de ColorChecker kartı görünür. Post-processing adımı:

1. Lightroom Mobile veya Darkroom → ColorChecker patch'lerini referans al
2. Beyaz balans + exposure düzeltmesi uygula
3. Aynı preset'i tüm oturumdaki fotoğraflara toplu uygula
4. JPEG olarak export et (1024×1024, kare crop, sadece capture zone)

Amaç: farklı günlerde çekilen aynı kumaşın rengi eşleşmeli.

---

### 3.2 Renk Çıkarımı (Hex Kodları)

Export edilen `{SKU}-reflected.jpg` üzerinde k-means renk kümeleme:

```python
# Pseudo-kod
image = load("{SKU}-reflected.jpg")
# Sadece merkez bölge — ColorChecker kartı hariç
center_crop = image[100:924, 100:924]
colors = kmeans(center_crop, k=3)
hex_codes = [rgb_to_hex(c) for c in colors]
# Örnek çıktı: ["#C8A870", "#D4B882", "#BFA060"]
```

**Çıktı:** 1–3 dominant hex kod → catalog.json'a kaydet

---

### 3.3 Şeffaflık Hesabı

```python
baseline = average_brightness(load("baseline.jpg"))
backlit  = average_brightness(load("{SKU}-backlit.jpg")[center_crop])
transparency_pct = backlit / baseline  # 0.0 → 1.0
```

| Değer | Kumaş tipi |
|-------|-----------|
| 0.00–0.05 | Blackout |
| 0.06–0.25 | Fon (opak) |
| 0.26–0.55 | Yarı saydam |
| 0.56–1.00 | Tül / vual |

---

### 3.4 Doku Tile Çıkarımı

Shot 1'den 512×512 seamless texture tile:

1. Capture zone'un tam merkezinden 512×512 crop
2. Kenarları seamless yap (Photoshop → Filter → Other → Offset → Clone Stamp, veya Python `seamless_tile` kütüphanesi)
3. Dosya adı: `{SKU}-texture-tile.jpg`

Bu tile AI prompt'a ek referans görüntü olarak verilir.

---

### 3.5 Desen Tekrarı (Pattern Repeat)

Eğer kumaşta baskı veya dokuma desen varsa:

1. Shot 1'de desenin en az **2 tam tekrarı** görünmeli
2. Gerekirse kumaşı kaydır, 2. çekim yap
3. Tekrar boyutunu mm cinsinden ölç ve catalog'a kaydet: `pattern_repeat_cm: 12`
4. Deseniz yoksa (düz kumaş): `pattern_repeat_cm: null`

---

## 4. Swatch Başına Dijital Varlık Paketi

Her SKU için şu dosyalar üretilmeli:

```
products/swatches/{SKU}/
  {SKU}-reflected.jpg        # renk + doku referans (1024×1024)
  {SKU}-backlit.jpg          # şeffaflık referans (1024×1024)
  {SKU}-texture-tile.jpg     # seamless doku tile (512×512)
  {SKU}-meta.json            # aşağıdaki metadata
```

**`{SKU}-meta.json` içeriği:**

```json
{
  "sku": "TUL-001",
  "dominant_colors": ["#F0EDE0", "#E8E2D0"],
  "transparency_pct": 0.72,
  "transparency_class": "sheer",
  "pattern_repeat_cm": null,
  "has_pattern": false,
  "shot_date": "2026-03-22",
  "baseline_file": "baseline-2026-03-22.jpg"
}
```

---

## 5. AI Prompt'a Entegrasyon

Mevcut pipeline `AnalyzeSwatch` BAML fonksiyonuna şeffaf renk adı ve belirsiz doku tanımı gönderiyordu. Yeni pipeline ile:

**Eski:**
```
color: "cream white"
transparency: "sheer"
```

**Yeni:**
```
color: "hex #F0EDE0 — warm ivory white"
transparency_pct: 0.72
texture_reference: [swatch-reflected.jpg, texture-tile.jpg]
backlit_reference: backlit.jpg
```

- Hex kodu prompt'a **kelime ve kod olarak** yaz: `"hex #F0EDE0 warm ivory, NOT grey, NOT off-white"`
- Şeffaflık yüzdesi sayısal olarak geçsin — model sayıya anlam verir
- Backlit görüntüyü ek referans image olarak ver — model ışık geçişini görselden anlar
- Texture tile'ı ayrı image olarak ver — model dokuyu metin tanımından değil görselden alır

---

## 6. Sık Yapılan Hatalar

| Hata | Sonuç | Çözüm |
|------|-------|-------|
| Warm white LED kullanmak | Tüm renkler sarı cast alır | 5000–6500K daylight LED |
| Backlit'te çift kat kumaş | Şeffaflık yarıya düşer, tül fon gibi görünür | Tek kat açılmış kumaş |
| Camı silmeden çekmek | Toz gölgeleri doku gibi görünür | Her çekim öncesi sil |
| Katlama izi olan kumaş | Doku tutarsız, ışık gölgeli | Önce buharla, düzleştir |
| Kenardan çekmek | Selvedge, etiket, yıpranma | Her zaman kumaş ortasından |
| Dışarıdan ışık giren oda | Renk dengesi bozulur | Perde çek veya gece çek |
| Tripod yüksekliği değişmek | Ölçek tutarsız, texture tile uyuşmaz | Bant işareti koy |
| ColorChecker olmadan çekmek | Farklı günlerde renkler uyuşmaz | Her çekimde kart görünür olmalı |
| ProRAW yerine HEIF | Post-processing esnekliği az | Settings → Camera → ProRAW aç |

---

## 7. Öncelik Sırası

Tüm 352 variant'ı yeniden çekmek gerekmez. Önce:

1. **Aktif 4 design** (blk-sonil, fon-hurrem, stn-saten, tul-bornova) — Shopify'a sync'li olanlar
2. **Tül grubu tümü** — şeffaflık en kritik bu grupta
3. **Blackout grubu** — renk tutarlılığı kritik
4. Geri kalanlar sırayla

Mevcut `ecommerce/cropped-kategorized/` klasöründeki fotoğraflar için sadece metadata pipeline'ını çalıştır — yeniden çekim gerekmeyebilir, renk çıkarımı yeterli olabilir.
