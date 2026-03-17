# Shopify Magaza Yapilandirmasi

## Magaza Bilgileri

```
Shopify Admin > Ayarlar > Magaza detaylari
  Magaza adi: Inanc Tekstil
  E-posta: info@inanctekstil.store
  Magaza sektoru: Ev ve Bahce
  Adres: Iskenderun, Hatay, Turkiye
```

---

## Temel Ayarlar

### Bolge ve Dil

```
Ayarlar > Diller
  Varsayilan dil: Turkce

Ayarlar > Piyasalar
  Turkiye: TRY para birimi
```

### Para Birimi ve Format

```
Ayarlar > Magaza detaylari > Standartlar ve formatlar
  Para Birimi: Turk Lirasi (TRY)
  Birim sistemi: Metrik
  Agirlik birimi: Kilogram
  Saat dilimi: (GMT+03:00) Istanbul
```

---

## Horizon Tema

### Neden Horizon?

- Modern, minimal tasarim
- Shopify'in resmi temalari arasinda
- Mobil uyumlu
- Hizli yukleme suresi

### Kurulum

```
Shopify Admin > Online Magaza > Temalar
  Horizon tema zaten yukluyse: "Ozellestir" butonuna tikla
  Degilse: Tema kutuphanesinden "Horizon" bul > Yukle
```

### Tema Ozellestirmesi

Detayli tema yapilandirmasi icin [frontend-configuration.md](frontend-configuration.md) dosyasina bkz.

---

## KDV (Vergi) Ayarlari

Turkiye'de ev tekstili urunleri icin KDV orani %20'dir.

### Vergi Ayarlari

```
Ayarlar > Vergiler ve harclari
  Turkiye: Vergi bolgesini ekle
  KDV orani: %20
  Fiyatlar vergi dahil: Evet (onerilen)
```

Shopify'da urunleri vergi dahil fiyatla girmek, musteri acisindan daha sade bir deneyim sunar.

---

## Hesap Ayarlari

```
Ayarlar > Odeme
  Musteri hesaplari: Istege bagli (misafir odeme + hesap olusturma)

Ayarlar > Odeme > Odeme islemi
  Musteri iletisim bilgisi: E-posta veya telefon numarasi
  Form secenekleri: Ad soyad — zorunlu
  Adres otomatik tamamlama: Acik
```

---

## Onerilen Shopify Uygulamalari

| Uygulama | Amac | Oncelik |
|---|---|---|
| PayTR | Odeme entegrasyonu | Zorunlu |
| Google & YouTube | Google Analytics, Search Console, Shopping | Yuksek |
| Facebook & Instagram | Meta Pixel, katalog | Yuksek |
| Judge.me veya Yotpo | Urun degerlendirmeleri | Orta |

---

## Bildirimler

```
Ayarlar > Bildirimler
  Siparis onay e-postasi: Turkce sablonla ozellestir
  Kargo bildirimi: Turkce sablonla ozellestir
  Gonderici e-posta: bildirim@inanctekstil.store
```

Shopify bildirim sablonlarini Turkce'ye cevirmeyi unutma. Sablon duzenlemesi: Ayarlar > Bildirimler > ilgili bildirime tikla > HTML/Liquid duzenle.

---

## Alan Adi

```
Ayarlar > Alan adlari
  Birincil alan adi: inanctekstil.store
  Yonlendirmeler: www.inanctekstil.store -> inanctekstil.store
```

DNS ayarlari icin [infrastructure/dns-configuration.md](../infrastructure/dns-configuration.md) dosyasina bkz.

---

## Kontrol Listesi

- [ ] Magaza temel bilgileri girildi
- [ ] Turkce dil ayarlandi
- [ ] TRY para birimi ayarlandi
- [ ] Horizon tema kuruldu ve ozelllestirildi
- [ ] KDV %20 ayarlandi, fiyatlar vergi dahil
- [ ] Musteri hesaplari istege bagli ayarlandi
- [ ] PayTR odeme entegrasyonu yapildi
- [ ] Bildirim sablonlari Turkce'ye cevirildi
- [ ] Alan adi baglandi
