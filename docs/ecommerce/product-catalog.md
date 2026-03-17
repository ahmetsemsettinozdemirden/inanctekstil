# Urun Katalogu -- Kartela Sistemi ve Kumas Urunleri Rehberi

## Genel Yapi

Inanc Tekstil'in e-ticaret sitesi, fiziksel kartela sistemini dijitale tasiyan bir yapidadir. Her kumas bir Shopify urunu olarak listelenir ve kartela kodu ile tanimlanir.

---

## Urun Kategorileri (Shopify Koleksiyonlari)

Site su ana kategorilere ayrilmistir:

### 1. Tul Perdeler
- Gunduz kullanimi icin yari seffaf perdeler
- Ince, hafif dokulu kumaslar
- Isik gecirgenligi yuksek
- Genellikle gun boyu takili kalir

### 2. Fon Perdeler
- Dekoratif yan paneller
- Tul perdenin uzerine gelen kalin kumaslar
- Aksam kapatilir, gunduz yanlara toplanir
- Cesitli desen ve dokular

### 3. Blackout Perdeler
- Isik gecirmeyen, karartma ozellikli
- Yatak odasi ve ozel mekanlar icin ideal
- Tam gizlilik ve karanlik saglar
- Yogun dokulu, agir kumaslar

### 4. Saten
- Basit, sabit fiyatli astar kumasi
- **Fiyat:** 150 TL
- **Renkler:** Krem (cream), Beyaz (white)
- Hesaplama gerektirmez, direkt urun

### 5. Balkon Perdesi
- Balkon ve teras mekanlari icin ozel tip
- Dis mekan kosullarina dayanikli
- Farkli hesaplama sistemi olabilir

---

## Kartela Sistemi

**Kartela Nedir?**
- Kartela, Inanc Tekstil'in musterilere gosterdigi fiziksel kumas numune kitabidir
- Her kumasin kucuk bir ornegi kartela'da mevcuttur
- Online sistemde: her kumas fotograflanir ve kartela kodu ile listelenir

**Kartela Kodu:**
- Her kumasin benzersiz bir kartela kodu vardir (SKU gorevi gorur)
- Format ornegi: `TUL-2024-A15`, `FON-2025-B23`, `BLK-2024-C07`
- Bu kod Shopify'da SKU alanina yazilir

**Kumas Rotasyonu:**
- Sezon sonu: bazi kumaslar uretimden kaldirilir
- Kaldirilan kumaslar "Havuz" koleksiyonuna tasinir
- Havuz'da indirimli fiyatlarla satilir
- Bitince listeden cikarilir

---

## Tekil Kumas Urunu (Shopify Product)

Her kumas urunu asagidaki bilgileri icermelidir:

### Zorunlu Alanlar

| Alan | Shopify Karsiligi | Ornek |
|------|-------------------|-------|
| **Kartela Kodu (SKU)** | SKU | `TUL-2024-A15` |
| **Urun Adi** | Title | "Krem Desenli Tul - A15" |
| **Koleksiyon** | Collections | "Tul Perdeler" |
| **Fiyat (Metre Basi)** | Metafield: `custom.fiyat_metre` | 280 |
| **Aciklama** | Description (HTML) | Materyal, doku, agirlik, bakim |
| **Fotograflar** | Media | En az 3-5 fotograf |
| **Pile Oranlari** | Metafield: `custom.pile_oranlari` | 1:2, 1:2.5, 1:3 |
| **Stok Durumu** | Inventory tracking | Stokta / Sinirli / Havuz |

### Pile (Kirisik) Oranlari

**Tul Perdeler:**
- **1:2** -- Pencere genisligi x 2 (ekonomik, hafif kirisik)
- **1:2.5** -- Pencere genisligi x 2.5 (orta yogunlukta kirisik)
- **1:3** -- Pencere genisligi x 3 (yogun kirisik, luks gorunum)

**Fon Perdeler:**
- Panel genisligine gore degisir
- Genellikle daha az pile orani kullanilir

---

## Shopify Metafield Tanimlari

Fiyat hesaplama eklentisinin ihtiyac duydugu ozel alanlar Shopify metafield olarak tanimlanir:

```
Shopify Admin > Ayarlar > Ozel veriler > Urunler

Metafield tanimlari:
  custom.fiyat_metre     | Tip: Sayi (ondalikli) | Aciklama: Metre basi fiyat (TL)
  custom.pile_oranlari   | Tip: Metin           | Aciklama: Virgullu pile oranlari (1:2,1:2.5,1:3)
  custom.kumas_tipi      | Tip: Metin           | Aciklama: tul / fon / blackout
  custom.dikis_maliyeti  | Tip: Sayi (ondalikli) | Aciklama: Dikis maliyeti (TL)
```

---

## Urun Sayfasi Duzeni

### Sayfa Yapisi

```
+-------------------------------------------------------------+
| [Breadcrumb: Ana Sayfa > Tul Perdeler > Krem Desenli Tul]   |
+-------------------------------------------------------------+
| [Fotograf Galerisi]       |  Krem Desenli Tul - A15         |
| (sol, %50)                |  Kartela: TUL-2024-A15          |
|                           |  [Tul Perdeler] badge           |
| - Kartela fotografi       |                                  |
| - Asili fotograf          |  280 TL/metre                   |
| - Mekan mockup            |                                  |
|                           |  Kisa aciklama: 2-3 cumle       |
|                           |                                  |
|                           |  +-- Hesaplama Bolumu --------+ |
|                           |  | Pencere Genisligi (cm):     | |
|                           |  | [______]                    | |
|                           |  |                             | |
|                           |  | Pile Orani:                 | |
|                           |  | [Dropdown: 1:2/1:2.5/1:3]   | |
|                           |  |                             | |
|                           |  | Saten Ekle (+150 TL)        | |
|                           |  |                             | |
|                           |  | Toplam Kumas: 5.00 metre    | |
|                           |  | Fiyat: 1.400,00 TL          | |
|                           |  +-----------------------------+ |
|                           |                                  |
|                           |  Oda Etiketi (opsiyonel):       |
|                           |  [Orn: Salon, Yatak Odasi]      |
|                           |                                  |
|                           |  [Sepete Ekle]                  |
+-------------------------------------------------------------+
| Benzer Kumaslar (4-6 urun grid)                            |
+-------------------------------------------------------------+
```

---

## Yeni Kumas Ekleme -- Adim Adim Rehber

### Adim 1: Shopify Urun Sayfasi

```
Shopify Admin > Urunler > Urun ekle
```

### Adim 2: Temel Bilgiler

| Alan | Deger |
|------|-------|
| **Urun Adi** | Kumasin aciklayici adi: "Krem Desenli Tul - A15" |
| **Aciklama** | HTML formatinda detayli aciklama |
| **Koleksiyonlar** | Tul Perdeler / Fon Perdeler / Blackout / Havuz |

### Adim 3: Medya

```
Medya bolumune yukle:
  - Ana kartela fotografi (ana gorsel)
  - Yakin cekim (doku)
  - Asili/dokumlu fotograf
  - Mekan mockup (varsa)
```

**Fotograf Adlandirma:**
```
tul-2024-a15-kartela.jpg
tul-2024-a15-asili.jpg
tul-2024-a15-mekan.jpg
```

### Adim 4: Fiyatlandirma ve SKU

```
Fiyatlandirma:
  Fiyat: 0 (hesaplayici fiyati belirler)

Envanter:
  SKU: TUL-2024-A15
  Stok takibi: Duruma gore
```

### Adim 5: Metafield Degerleri

```
Sayfa altindaki "Metafieldlar" bolumunde:
  custom.fiyat_metre: 280
  custom.pile_oranlari: 1:2,1:2.5,1:3
  custom.kumas_tipi: tul
  custom.dikis_maliyeti: 25
```

### Adim 6: Kaydet

```
Sag ustteki "Kaydet" butonuna tikla
Durumu: Aktif (yayinla)
```

---

## Saten Urunu

Saten, ayri bir basit urun olarak eklenir:

- **Fiyat:** 150 TL (sabit)
- **Varyantlar:** Krem, Beyaz
- **SKU:** `SATEN-KREM`, `SATEN-BEYAZ`
- **Koleksiyon:** "Saten"
- Hesaplama formu yok, direkt sepete ekle

---

## SEO

### Urun Basligi SEO

```
Kotu: "A15"
Iyi: "Krem Desenli Tul - A15"
Daha Iyi: "Krem Desenli Tul Perde Kumasi - A15 | Inanc Tekstil"
```

### Meta Aciklama

Shopify Admin > Urunler > [Urun] > Arama motoru listesi onizlemesi:

```
Sayfa basligi: Krem Desenli Tul Perde Kumasi - A15 | Inanc Tekstil
Meta aciklama: Zarif krem desenli tul perde kumasi. 280 cm genislik, %100 polyester.
Olcuye ozel dikim, Iskenderun'dan kargo. Kartela kodu: TUL-2024-A15
URL: /products/krem-desenli-tul-a15
```

### Odak Anahtar Kelimeler

- "tul perde kumasi"
- "fon perde kumasi"
- "blackout perde"
- "perde kumasi iskenderun"
- "ozel dikim perde"

### Alt Text (Gorsel SEO)

Shopify Admin'de her gorsel icin alt text girilebilir:

```
Kartela fotografi: "Krem desenli tul perde kumasi yakin cekim - TUL-2024-A15"
Asili fotograf: "Krem desenli tul perde asili gorunum"
```
