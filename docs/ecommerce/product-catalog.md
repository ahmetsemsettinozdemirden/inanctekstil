# Urun Katalogu -- Kumas Urunleri Ekleme Rehberi

## Genel Yaklasim

Her kumas secenegi bir WooCommerce "Simple Product" olarak eklenir. Musteri urun sayfasinda kumasin fotografini gorur, olcuelerini girer ve fiyat otomatik hesaplanir. ~20 kumas secenegi olacak.

---

## Urun Ekleme Adim Adim

### 1. Yeni Urun Olustur

```
WooCommerce > Urunler > Yeni Ekle
```

### 2. Zorunlu Alanlar

| Alan | Konum | Aciklama |
|---|---|---|
| Urun Adi | Baslik | Kumasin adi. Ornek: "Keten Dokulu Perde Kumasi - Bej" |
| Urun Aciklamasi | Ana editor | Detayli aciklama (asagida sablon var) |
| Kisa Aciklama | Kisa aciklama kutusu | 1-2 cumle ozet |
| Urun Gorseli | Sag kolon > Urun Gorseli | Ana fotograf |
| Urun Galerisi | Sag kolon > Urun Galerisi | Ek fotograflar (3-5 adet) |
| Fiyat (Regular Price) | Urun Verileri > Genel | 0.01 TL (placeholder, hesaplama eklentisi uzerine yazar) |
| Metrekare Fiyati | Urun Verileri > Genel > "Metrekare Fiyati (TL/m2)" | Gercek birim fiyat. Ornek: 450 |
| Kategori | Sag kolon > Urun Kategorileri | "Perde Kumaslari" |
| Etiketler | Sag kolon > Urun Etiketleri | "keten", "bej", "dogal", vb. |

### 3. Urun Verileri Ayarlari

```
Urun Verileri > Genel
  Normal Fiyat: 0.01 (placeholder -- hesaplama eklentisi override eder)
  Metrekare Fiyati (TL/m2): 450.00

Urun Verileri > Envanter
  SKU: PERDE-KETEN-BEJ-001
  Stok Yonetimi: Hayir (siparis uzerine uretim, stok takibi gerekmez)

Urun Verileri > Kargo
  Agirlik ve boyut: Bos birak (perde boyutlari degisken)
  Gonderim Sinifi: Bos (tek sinif)

Urun Verileri > Baglantili Urunler
  Ust Satis (Upsell): Benzer ama daha pahali kumaslar
  Carpraz Satis (Cross-sell): Perde aksesuarlari (ray, kopca)
```

### 4. SEO (Rank Math veya Yoast Kullaniliyorsa)

```
Odak Anahtar Kelime: "keten perde kumasi bej"
Meta Baslik: Keten Dokulu Perde Kumasi - Bej | Inanc Tekstil
Meta Aciklama: Dogal keten dokulu bej perde kumasi. Olcuye ozel dikim.
  Iskenderun, Hatay'dan ucretsiz teslimat.
```

---

## Urun Aciklama Sablonu

Her kumas urununde tutarli bilgi sunmak icin asagidaki sablonu kullan:

```html
<h3>Urun Ozellikleri</h3>
<table class="icc-product-specs">
  <tr>
    <th>Kumas Tipi</th>
    <td>Keten karisim</td>
  </tr>
  <tr>
    <th>Kompozisyon</th>
    <td>%70 Polyester, %30 Keten</td>
  </tr>
  <tr>
    <th>Kumas Genisligi</th>
    <td>280 cm (tercihen en-boy belirtin)</td>
  </tr>
  <tr>
    <th>Agirlik</th>
    <td>220 gr/m2</td>
  </tr>
  <tr>
    <th>Isik Gecirgenlik</th>
    <td>Yari seffaf (Sheer) / Karanlik (Blackout) / Orta</td>
  </tr>
  <tr>
    <th>Yikama</th>
    <td>30 derecede hassas yikama, dusuk sicaklikta utu</td>
  </tr>
  <tr>
    <th>Renk</th>
    <td>Bej / Krem</td>
  </tr>
</table>

<h3>Aciklama</h3>
<p>
  Dogal keten gorunumlu, modern ve sikbir perde kumasi. Yatak odasi, salon
  ve cocuk odalari icin uygundur. Yari seffaf yapisi sayesinde gun isigini
  yumusak bir sekilde icerige aktarir.
</p>

<h3>Dikim Bilgisi</h3>
<p>
  Perdeniz, belirttiginiz olculere gore dikilir. Pilili (krose) veya duz
  dikim secenekleri mevcuttur. Siparisiniz 5-7 is gunu icerisinde
  hazirlanir.
</p>
```

---

## Kumas Fotograf Standartlari

### Cekim Ortami

- **Isik:** Dogal gun isigi veya 5500K studyo isigi. Sari/tungsten lambadan kacin, renk tonunu bozar.
- **Arka Plan:** Beyaz veya acik gri, duz, dikkat dagitmayan. Kumas renginin dogru gorunmesi icin onemli.
- **Yuzey:** Kumasin ustune yatirarak cekmek yerine, asan/diken halini de goster.

### Zorunlu Fotograflar (Urun Basina)

| # | Cekim Tipi | Aciklama |
|---|---|---|
| 1 | Genel gorunum | Kumasin tamamini gosteren duz cekim (ana urun gorseli) |
| 2 | Yakin cekim (doku) | Kumas dokusunu, iplik yapisini gosteren makro cekim |
| 3 | Isik gecirgenlik | Kumasin arkasinda isik kaynagi ile seffaflik gosterimi |
| 4 | Drape/dokunum | Kumasin asildiginda nasil dokundugunu gosteren cekim |
| 5 | Mekan icinde (opsiyonel) | Pencereye asilmis goruntu (gercek veya mockup) |

### Teknik Gereksinimler

```
Format: JPEG (web icin) -- ShortPixel/Smush otomatik optimize edecek
Cozunurluk: En az 1200 x 1200 px (WooCommerce varsayilan galeri boyutu)
En boy orani: 1:1 (kare) onerilen, tutarli gorunum icin
Dosya boyutu: Orijinal 1-3 MB arasi (eklenti sikistirma sonrasi ~200KB olacak)
Renk profili: sRGB (web icin standart)
Isimlendirme: kumas-tipi-renk-numara.jpg (ornek: keten-bej-001.jpg)
```

### Renk Dogrulugu

Kumas fotograflarinda renk dogrulugu kritiktir. Musteriler gordugu renkle gelen urunun farkli olmasi halinde iade talep eder.

- Monitor kalibrasyonu yap (yazilim tabanli bile olsa: DisplayCAL veya isletim sistemi dahili)
- Fotograflari birden fazla cihazda kontrol et (telefon, tablet, masaustu)
- Urun sayfasina uyari ekle:

```
"Ekran ayarlariniza bagli olarak renk tonunda kucuk farkliliklar olabilir."
```

---

## Urun Sayfasi Duzeni

Astra + WooCommerce varsayilan tekil urun sayfasi yeterli bir baslangic sunar. Ozellestirme:

### Sayfa Yapisi

```
+---------------------------------------------------+
| [Breadcrumb: Ana Sayfa > Perde Kumaslari > Urun]  |
+---------------------------------------------------+
| [Gorsel Galerisi]    |  Urun Adi                  |
| (sol, %50)           |  "450,00 TL / m2" (birim)  |
|                      |  Kisa aciklama              |
|                      |                             |
|                      |  +-- Perde Olculerinizi --+ |
|                      |  | En (cm):  [____]       | |
|                      |  | Boy (cm): [____]       | |
|                      |  |                        | |
|                      |  | Alan: 3.75 m2          | |
|                      |  | Tahmini Fiyat:         | |
|                      |  | 1.687,50 TL            | |
|                      |  +------------------------+ |
|                      |                             |
|                      |  [Sepete Ekle] butonu       |
|                      |  Kategori: Perde Kumaslari  |
|                      |  SKU: PERDE-KETEN-BEJ-001   |
+---------------------------------------------------+
| [Tab: Aciklama] [Tab: Ek Bilgi] [Tab: Yorumlar]   |
|   Urun Ozellikleri tablosu                         |
|   Detayli aciklama                                 |
+---------------------------------------------------+
| Benzer Urunler (4 urun grid)                      |
+---------------------------------------------------+
```

### Astra ile Ozellestirme

```
Gorunum > Ozellestir > WooCommerce > Tek Urun
  Gorsel Genisligi: %50
  Galeri Tipi: Slider (veya thumbnails altta)

Gorunum > Ozellestir > WooCommerce > Genel
  Sepete Ekle Butonu Stili: Marka renginde, belirgin
```

### Fiyat Goruntuleme

Normal WooCommerce fiyat gorunumu yerine metrekare fiyati gosterilir. Bu, `pricing-calculator.md` dosyasindaki `woocommerce_get_price_html` filtresi ile saglanir:

```
450,00 TL / m2
```

---

## Kategori Yapisi

Baslangiicta basit bir yapida tut:

```
Urunler
  |-- Perde Kumaslari (ana kategori)
      |-- Blackout (karanlik)
      |-- Tul / Seffaf
      |-- Keten
      |-- Kadife
      |-- Jakar
```

Kategori sayfalarinda grid gorunum, her urunde:
- Kumas fotografinin kare gorunumu
- Urun adi
- Metrekare fiyati
- "Incele" veya "Sec" butonu

---

## Toplu Urun Ekleme

20 kumas eklemek icin WooCommerce CSV Import kullanilabilir:

```
WooCommerce > Urunler > Aktar (Import)
```

### CSV Format Ornegi

```csv
Type,SKU,Name,Short description,Description,Regular price,Categories,Images,Meta: _icc_price_per_sqm
simple,PERDE-KETEN-BEJ-001,"Keten Dokulu Perde Kumasi - Bej","Dogal keten gorunumlu, yari seffaf perde kumasi.","<h3>Urun Ozellikleri</h3>...",0.01,"Perde Kumaslari > Keten",keten-bej-001.jpg,450
simple,PERDE-BLACKOUT-LAC-002,"Blackout Perde Kumasi - Lacivert","Tam karanlik saglayan blackout perde kumasi.","<h3>Urun Ozellikleri</h3>...",0.01,"Perde Kumaslari > Blackout",blackout-lacivert-002.jpg,520
```

**Not:** CSV import sirasinda `Meta: _icc_price_per_sqm` sutunu otomatik olarak custom field'e yazilir. Gorsel dosyalarini onceden Medya Kutuphanesi'ne yukle veya gorselleri URL olarak belirt.

---

## Kontrol Listesi: Yeni Urun Ekleme

- [ ] Urun adi acik ve aranabilir
- [ ] SKU benzersiz ve tutarli format
- [ ] Metrekare fiyati (_icc_price_per_sqm) girildi
- [ ] Placeholder fiyat (0.01) girildi
- [ ] En az 3 fotograf yuklendi (genel, doku, isik)
- [ ] Fotograflar sRGB, en az 1200x1200px
- [ ] Aciklama sablona uygun, tum ozellikler dolu
- [ ] Kategori ve etiketler secildi
- [ ] Urun sayfasinda hesaplama formu calisiyor
- [ ] Mobilde hesaplama formu duzgun gorunuyor
- [ ] Sepete ekleme ve fiyat hesaplama dogru calisiyor
