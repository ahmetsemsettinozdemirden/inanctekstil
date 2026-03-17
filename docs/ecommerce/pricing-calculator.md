# Perde Fiyat Hesaplama -- Teknik Spesifikasyon

**Durum:** Shopify entegrasyonu gelistirme asamasinda

## Genel Bakis

Perde fiyat hesaplama sistemi, musteri tarafindan girilen olculere gore otomatik fiyat hesaplar. Urun tipine gore farkli hesaplama formulleri kullanilir.

---

## Fiyatlandirma Modeli

### Urun Tipleri ve Formuller

#### 1. TUL (Sheer/Tulle)

**Musteri Girdileri:**
- Pencere eni (cm)
- Pencere boyu (cm) - varsayilan 260 cm
- Pile orani (1:2, 1:2.5, 1:3)

**Formul:**
```
gerekli_kumas_metre = (pencere_eni_cm / 100) x pile_orani
toplam_fiyat = (gerekli_kumas_metre x kumas_metre_fiyati) + (gerekli_kumas_metre x dikis_maliyeti_metre)
```

**Sabitler:**
- Dikis maliyeti: 25 TL/metre
- Standart boy: 260 cm (kumas 260cm boy rulolardan gelir, boy fiyati etkilemez)

**Ornek:**
- Pencere eni: 300 cm
- Pile orani: 1:3
- Kumas fiyati: 150 TL/metre
- Hesaplama: (300/100) x 3 = 9 metre
- Toplam: (9 x 150) + (9 x 25) = 1.350 + 225 = 1.575 TL

---

#### 2. SATEN (Satin Lining)

**Sabit Fiyat Urun:**
- Pencere basina: 150 TL
- Hesaplama yok, sepete direkt ekle
- Renkler: krem, beyaz

---

#### 3. FON (Decorative Side Panels)

**Musteri Girdileri:**
- Panel eni (50-150 cm arasi, tipik: 80cm veya 100cm)
- Pile orani (1:2, 1:2.5, 1:3)

**Formul:**
```
kumas_panel_basina = (panel_eni_cm / 100) x pile_orani
toplam_kumas = kumas_panel_basina x 2  (cift panel)
toplam_fiyat = (toplam_kumas x kumas_metre_fiyati) + dikis_maliyeti_cift
```

**Sabitler:**
- Dikis maliyeti (cift panel): 500 TL sabit
- Cift panel: Her zaman 2 panel (sol + sag)

**Ornek:**
- Panel eni: 100 cm
- Pile orani: 1:2
- Kumas fiyati: 200 TL/metre
- Hesaplama: (100/100) x 2 = 2 metre/panel x 2 panel = 4 metre
- Toplam: (4 x 200) + 500 = 800 + 500 = 1.300 TL

---

#### 4. BLACKOUT

Blackout perdeler fon perde hesaplamasini kullanir (ayni formul).

---

## Urun Metafield Yapisi

Her urun icin Shopify metafield'larda tutulan degerler:

| Metafield | Tip | Ornek | Aciklama |
|-----------|-----|-------|----------|
| `custom.fiyat_metre` | Sayi | 280 | Metre basi kumas fiyati (TL) |
| `custom.kumas_tipi` | Metin | tul | Urun tipi: tul, fon, blackout, saten |
| `custom.pile_oranlari` | Metin | 1:2,1:2.5,1:3 | Mevcut pile oranlari |
| `custom.dikis_maliyeti` | Sayi | 25 | Dikis maliyeti (TL/metre veya sabit) |

---

## Hesaplama Formu -- Kullanici Arayuzu

### Tul Formu

```
+-----------------------------------------+
| Pencere Genisligi (cm):                 |
| [______] (min: 50, max: 1000)           |
|                                         |
| Pencere Yuksekligi (cm):                |
| [__260_] (varsayilan 260, bilgi: "260cm |
|           standart boy, fiyati          |
|           etkilemez")                   |
|                                         |
| Pile Orani:                             |
| [Dropdown: 1:2 / 1:2.5 / 1:3]          |
|                                         |
| [] Saten Ekle (+150 TL)                |
|   Saten Rengi: [Krem / Beyaz]          |
|                                         |
| -------- Hesaplama Sonucu --------     |
| Toplam Kumas: 9.00 metre               |
| Dikis Ucreti: 225 TL                   |
| Kumas Ucreti: 1.350 TL                 |
| Saten: +150 TL                          |
| TOPLAM: 1.725 TL                        |
+-----------------------------------------+
|                                         |
| Oda Etiketi: [Salon, Yatak Odasi vb.]  |
|                                         |
| [SEPETE EKLE]                           |
+-----------------------------------------+
```

### Fon Formu

```
+-----------------------------------------+
| Panel Genisligi (cm):                   |
| [______] (min: 50, max: 150)            |
|                                         |
| Pile Orani:                             |
| [Dropdown: 1:2 / 1:2.5 / 1:3]          |
|                                         |
| -------- Hesaplama Sonucu --------     |
| Toplam Kumas: 4.00 metre (2 panel)     |
| Dikis Ucreti: 500 TL (sabit)           |
| Kumas Ucreti: 800 TL                   |
| TOPLAM: 1.300 TL                        |
+-----------------------------------------+
|                                         |
| Oda Etiketi: [opsiyonel]               |
|                                         |
| [SEPETE EKLE]                           |
+-----------------------------------------+
```

### Saten Formu

```
+-----------------------------------------+
| Saten Rengi: [Krem / Beyaz]            |
|                                         |
| Fiyat: 150 TL                           |
|                                         |
| [SEPETE EKLE]                           |
+-----------------------------------------+
```

---

## Sepete Ekleme Verisi

Sepete eklenirken asagidaki bilgiler Shopify line item properties olarak saklanir:

| Property | Ornek | Aciklama |
|----------|-------|----------|
| `_pencere_eni` | 300 | Pencere genisligi (cm) |
| `_pencere_boyu` | 260 | Pencere yuksekligi (cm) |
| `_pile_orani` | 1:3 | Secilen pile orani |
| `_toplam_kumas` | 9.00 | Hesaplanan toplam kumas (metre) |
| `_oda_etiketi` | Salon | Musteri notu |
| `_saten` | Krem | Saten eklenip eklenmedigini ve rengini gosterir |

**Not:** Alt cizgi (_) ile baslayan property'ler Shopify sepet sayfasinda musteriye gosterilmez ama siparis detaylarinda gorunur.

---

## Dogrulama Kurallari

| Alan | Kural | Hata Mesaji |
|------|-------|-------------|
| Pencere eni (Tul) | 50-1000 cm, tam sayi | "Pencere genisligi 50-1000 cm arasi olmalidir" |
| Pencere boyu | 100-350 cm | "Pencere yuksekligi 100-350 cm arasi olmalidir" |
| Panel eni (Fon) | 50-150 cm | "Panel genisligi 50-150 cm arasi olmalidir" |
| Pile orani | Listeden secim | Secim zorunlu |
| Fiyat | > 0 TL | Hesaplama hatasi durumunda sepete ekleme engelle |

---

## Fiyat Guncelleme

Kumas fiyatlari degistiginde:

1. Shopify Admin > Urunler > ilgili urun
2. Metafield `custom.fiyat_metre` degerini guncelle
3. Kaydet

Dikis maliyetleri degistiginde:
- Tul: `custom.dikis_maliyeti` metafield'ini guncelle
- Fon: Sabit 500 TL (kod icinde guncelle)
- Saten: Sabit 150 TL (kod icinde guncelle)
