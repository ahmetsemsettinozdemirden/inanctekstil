# Frontend Yapilandirmasi

Bu dokuman Shopify Horizon temasi uzerindeki site ozellestirmesini kapsar.

---

## 1. Tema: Horizon

Shopify'in resmi Horizon temasi kullanilir.

```
Shopify Admin > Online Magaza > Temalar > Ozellestir
```

---

## 2. Header

### Ust Cubuk (Duyuru Cubugu)

```
Duyuru metni:
  "Kendi Atolyemizde Ozel Dikim | Hatay Ici Ucretsiz Kargo (1.000 TL+) | WhatsApp: 0541 428 80 05"
```

### Ana Header
- **Sol:** Logo (maks 200px genislik)
- **Orta:** Arama cubugu
- **Sag:** Hesap ikonu + Sepet ikonu

### Navigasyon Menusu

Navigasyon cubugu YALNIZCA urun kategori linklerini icerir:

```
Tul Perdeler | Fon Perdeler | Blackout Perdeler | Saten
```

Ana Sayfa, Hakkimizda, Iletisim gibi sayfalar **YALNIZCA** footer'da yer alir.

---

## 3. Ana Sayfa Bolumleri

Sirasiyla:

1. **Hero Bolumu:** Baslik + alt yazi + CTA buton
   - Baslik: "30 Yildir Iskenderun'un Perde Uzmani"
   - Alt yazi: "Olcunuze ozel dikim perde — kendi atolyemizde, kendi elimizle dikiyoruz."
   - CTA: "Urunleri Inceleyin" -> /collections/all

2. **Kategori Kartlari:** 4 koleksiyon karti (Tul, Fon, Blackout, Saten)

3. **Neden Inanc Tekstil?** Trust badge'lari:
   - 30 Yillik Tecrube
   - Kendi Atolyemizde Imalat
   - Olcuye Ozel Dikim
   - 1000 TL Uzeri Ucretsiz Kargo

4. **One Cikan Urunler:** Secili urunler gridi

---

## 4. Footer

### Ust Footer -- 4 Kolon

| Kolon | Baslik | Icerik |
|-------|--------|--------|
| 1 | Inanc Tekstil | Marka adi + "Iskenderun'da 30 yildir olcuye ozel perde dikimi" |
| 2 | Hizli Linkler | Ana Sayfa, Urunler, Hakkimizda, Iletisim |
| 3 | Musteri Hizmetleri | Iade Politikasi, KVKK/Gizlilik, Mesafeli Satis Sozlesmesi, Cerez Politikasi |
| 4 | Iletisim | Iskenderun Hatay, 0541 428 80 05, WhatsApp, Pzt-Cmt 09:00-19:00 |

### Alt Footer
```
(c) 2026 Inanc Tekstil -- Tum haklari saklidir. [Visa] [Mastercard] [Troy]
```

---

## 5. Marka Renkleri

| Kullanim | Renk | HEX |
|----------|------|-----|
| Ana renk (Navy) | Derin Lacivert | #1B2A4A |
| Arka plan (acik) | Acik Gri | #F8F8F8 |
| Metin (acik arka plan) | Gri | #C5CDD8 |
| Vurgu | Beyaz | #FFFFFF |
| Kenarlik | Acik Gri | #E5E5E5 |

### Tipografi
- Govde fontu: Inter veya system-ui
- Baslik fontu: Playfair Display

---

## 6. WhatsApp Butonu

Sabit, sag alt kosede WhatsApp butonu:

- **Numara:** 905414288005
- **Varsayilan mesaj:** "Merhaba, perde siparisi hakkinda bilgi almak istiyorum."
- **Konum:** Sabit, sag alt (bottom: 24px, right: 24px)
- **Stil:** Yesil (#25D366), yuvarlak, WhatsApp ikonu
- **Mobil:** Sadece ikon (metin gizlenir)

Shopify'da bu bir tema ozel kodu veya WhatsApp uygulamasi ile saglanabilir.

---

## 7. Urun Sayfasi Trust Sinyalleri

Urun detay sayfasinda gosterilecek guven sinyalleri:

| Ikon | Metin |
|------|-------|
| Makas | Kendi Atolyemizde Dikilir |
| Kutu | 5-7 Is Gunu Teslimat |
| Ok | Iade Politikasi (link) |
| Mesaj | WhatsApp Destek (link) |

---

## 8. SEO

### Meta Aciklamalar

Temel sayfalar icin meta description'lar Shopify tema ayarlarindan veya sayfa duzenleyicisinden girilir:

- **Ana Sayfa:** "30 yildir Iskenderun'da hizmet veren Inanc Tekstil. Olcuye ozel dikim tul, fon ve blackout perde. Kendi atolyemizde dikiyoruz."
- **Hakkimizda:** Marka hikayesi ozeti
- **Iletisim:** Adres ve iletisim bilgileri

### Koleksiyon Sayfalari

Her koleksiyon icin Shopify Admin > Koleksiyonlar > [Koleksiyon] > SEO bolumunden meta description girilir.
