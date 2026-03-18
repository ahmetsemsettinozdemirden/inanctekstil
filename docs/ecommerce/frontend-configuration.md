# Frontend Yapilandirmasi

Bu dokuman Shopify Horizon temasi uzerindeki site ozellestirmesini ve tema gelistirme is akisini kapsar.

---

## 1. Tema: Horizon

Shopify'in resmi Horizon temasi kullanilir. Tema dosyalari repoda `technical/theme/` dizininde bulunur.

### Tema Gelistirme Is Akisi

Tema degisiklikleri Shopify CLI ile yapilir. Dosyalar JSON formatinda duzenlenir ve uzak temaya push edilir.

```bash
# Tema listeleme (ID'leri gormek icin)
shopify theme list --store 1z7hb1-2d.myshopify.com

# Degisiklikleri onizleme temasina push etme
shopify theme push --theme <TEMA_ID> --store 1z7hb1-2d.myshopify.com --only "templates/index.json" --nodelete --path technical/theme

# Birden fazla dosya push etme
shopify theme push --theme <TEMA_ID> --store 1z7hb1-2d.myshopify.com \
  --only "templates/index.json" \
  --only "sections/header-group.json" \
  --nodelete --path technical/theme

# Uzak temadan dosya cekme
shopify theme pull --theme <TEMA_ID> --store 1z7hb1-2d.myshopify.com --only "templates/index.json" --path technical/theme

# Temayi canli yapma
shopify theme publish --theme <TEMA_ID> --store 1z7hb1-2d.myshopify.com --force
```

**Onemli:** `--path technical/theme` her zaman kullanilmalidir. Bu parametre olmadan CLI proje kokunde dosya arar ve yanlis (veya bos) dosya yukler.

### Onizleme Is Akisi

1. Degisiklikleri yayinlanmamis temaya push et
2. Onizleme linki: `https://inanctekstil.store/?preview_theme_id=<TEMA_ID>`
3. Ekran goruntusu ile dogrula
4. Onaylandi ise: `shopify theme publish --theme <TEMA_ID> --force`

### Dizin Yapisi

```
technical/theme/
  templates/          -- JSON sablonlari (index.json, product.json, vb.)
  sections/           -- Bolum grubu JSON (header-group.json, footer-group.json)
  assets/             -- CSS, JS, gorseller
  snippets/           -- Liquid parcalari
  layout/             -- Layout dosyalari
```

### Yerlesik Bolumler

Ozel .liquid dosyalari yerine Horizon'in yerlesik bolumleri JSON ile yapilandirilir:

| Bolum Tipi | Kullanim |
|------------|----------|
| `hero` | Ana sayfa hero bolgesi |
| `product-list` | Koleksiyon bazli urun gridi |
| `collection-links` | Kategori linkleri (spotlight gorunumu) |
| `custom-liquid` | YouTube embed, FAQ akordeon gibi ozel icerikler |

---

## 2. Header

### Duyuru Cubugu (Donuyor)

Uc mesaj arasinda donuyor:

1. "WhatsApp: 0541 428 80 05"
2. "Hatay Ici Ucretsiz Kargo (1.000 TL+)"
3. "Kendi Atolyemizde Ozel Dikim"

Dosya: `technical/theme/sections/header-group.json`

### Navigasyon Menusu

Navigasyon cubugu YALNIZCA urun kategori linklerini icerir:

```
Tul Perdeler | Saten Perdeler | Fon Perdeler | Blackout Perdeler
```

---

## 3. Ana Sayfa Bolumleri (index.json)

Sirasiyla (section ID'leri parantez icinde):

### 3.1 Hero (hero_perde)
- Baslik: "30 Yildir Iskenderun'un Perde Atolyesi"
- Alt yazi: Kisisellestirilmis perde yapimi hakkinda
- CTA: "Tum Perdeleri Gor" -> /collections/all
- Gorsel: spring-sale-1.webp
- Renk semasi: scheme-6, overlay ile

### 3.2 Kategori Linkleri (categories)
- Tip: `collection-links` (spotlight gorunumu)
- Koleksiyonlar: tul-perdeler, fon-perdeler, blackout-perdeler
- Her koleksiyon icin gorsel ve urun sayisi gosterilir

### 3.3 Tul Perdeler (products_tul)
- Tip: `product-list`
- Koleksiyon: `tul-perdeler`
- 4 sutun grid, maks 8 urun
- Baslik: Koleksiyon ismi (otomatik)
- "Tumunu Gor" linki

### 3.4 Fon Perdeler (products_fon)
- Tip: `product-list`
- Koleksiyon: `fon-perdeler`
- Ayni yapilandirma (4 sutun, maks 8)

### 3.5 Blackout Perdeler (products_blk)
- Tip: `product-list`
- Koleksiyon: `blackout-perdeler`
- Ayni yapilandirma (4 sutun, maks 8)

### 3.6 Perde Olcusu Nasil Alinir? (measurement_videos)
- Tip: `custom-liquid`
- 3 YouTube video embed (youtube-nocookie.com)
  - Kalorifer Ustu Olcu Alma
  - Cam Hizasinda Olcu Alma
  - Yere Kadar Uzanan Olcu Alma
- 3 sutunlu grid, mobilde tek sutun
- Renk semasi: scheme-2

### 3.7 Sikca Sorulan Sorular (faq)
- Tip: `custom-liquid`
- 6 adet `<details>/<summary>` akordeon
- Tam genislik (max-width kisitlamasi yok)
- Sorular: Olcu alma, iade, teslimat suresi, kargo, yikama, taksit

---

## 4. Footer

### Ust Footer
- E-posta kayit formu: "E-posta listemize katilin"
- Alt metin: "Ozel firsatlardan ve yeni urunlere erken erisimden yararlanin."

### Alt Footer
- Copyright: "(c) 2026 Inanc Tekstil"
- Politika linkleri
- Sosyal medya: Instagram

Dosya: `technical/theme/sections/footer-group.json`

---

## 5. Marka Renkleri

| Kullanim | Renk | HEX |
|----------|------|-----|
| Ana renk (Navy) | Derin Lacivert | #1B2A4A |
| Arka plan (acik) | Acik Gri | #F8F8F8 |
| Vurgu | Beyaz | #FFFFFF |
| Kenarlik | Acik Gri | #E5E5E5 |

### Tipografi
- Govde fontu: Inter veya system-ui
- Baslik fontu: Playfair Display

---

## 6. WhatsApp Butonu

Sabit, sag alt kosede WhatsApp butonu (henuz eklenmedi):

- **Numara:** 905414288005
- **Varsayilan mesaj:** "Merhaba, perde siparisi hakkinda bilgi almak istiyorum."
- Shopify uygulamasi veya tema ozel kodu ile saglanabilir

---

## 7. Koleksiyonlar

| Handle | Isim | Navigasyonda |
|--------|------|--------------|
| tul-perdeler | Tul Perdeler | Evet |
| saten-perdeler | Saten Perdeler | Evet |
| fon-perdeler | Fon Perdeler | Evet |
| blackout-perdeler | Blackout Perdeler | Evet |

---

## 8. SEO

### Meta Aciklamalar

- **Ana Sayfa:** "30 yildir Iskenderun'da hizmet veren Inanc Tekstil. Olcuye ozel dikim tul, fon ve blackout perde."
- Koleksiyon meta description'lari: Shopify Admin > Koleksiyonlar > SEO bolumunden girilir
