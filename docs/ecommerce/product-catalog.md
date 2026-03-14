# Ürün Kataloğu — Kartela Sistemi ve Kumaş Ürünleri Rehberi

## Genel Yapı

İnanç Tekstil'in e-ticaret sitesi, fiziksel kartela sistemini dijitale taşıyan bir yapıdadır. Her kumaş bir WooCommerce ürünü olarak listelenir ve kartela kodu ile tanımlanır.

---

## Ürün Kategorileri (WooCommerce Kategorileri)

Site şu ana kategorilere ayrılmıştır:

### 1. **Tül Perdeler**
- Gündüz kullanımı için yarı şeffaf perdeler
- İnce, hafif dokulu kumaşlar
- Işık geçirgenliği yüksek
- Genellikle gün boyu takılı kalır

### 2. **Fon Perdeler**
- Dekoratif yan paneller
- Tül perdenin üzerine gelen kalın kumaşlar
- Akşam kapatılır, gündüz yanlara toplanır
- Çeşitli desen ve dokular

### 3. **Blackout Perdeler**
- Işık geçirmeyen, karartma özellikli
- Yatak odası ve özel mekanlar için ideal
- Tam gizlilik ve karanlık sağlar
- Yoğun dokulu, ağır kumaşlar

### 4. **Saten**
- Basit, sabit fiyatlı astar kumaşı
- **Fiyat:** 150 TL
- **Renkler:** Krem (cream), Beyaz (white)
- Hesaplama gerektirmez, direkt ürün
- Blackout'a yükseltme seçeneği sunulabilir

### 5. **Havuz Kumaşlar**
- Sezondan çıkmış, artık kumaşlar
- İndirimli fiyatlarla satılır
- Kartela'da bulunmaz
- Stok ile sınırlı — devamı yoktur
- Biten tükenene kadar

### 6. **Hazır Fonlar**
- Bütçe dostu, önceden dikilmiş fon perdeler
- Standart boyutlarda
- Hızlı teslimat
- Özel dikim gerektirmez

### 7. **Balkon Perdesi**
- Balkon ve teras mekanları için özel tip
- Dış mekan koşullarına dayanıklı
- Farklı hesaplama sistemi olabilir

---

## Kartela Sistemi

**Kartela Nedir?**
- Kartela, İnanç Tekstil'in müşterilere gösterdiği fiziksel kumaş numune kitabıdır
- Her kumaşın küçük bir örneği kartela'da mevcuttur
- Online sistemde: her kumaş fotoğraflanır ve kartela kodu ile listelenir

**Kartela Kodu:**
- Her kumaşın benzersiz bir kartela kodu vardır (SKU görevi görür)
- Format örneği: `TUL-2024-A15`, `FON-2025-B23`, `BLK-2024-C07`
- Bu kod WooCommerce'te SKU alanına yazılır

**Kartela İçeriği:**
- En güncel sezon kumaşları
- Yeni koleksiyonlar
- Müşteri beğenisine göre sürekli güncellenir

**Kumaş Rotasyonu:**
- Sezon sonu: bazı kumaşlar üretimden kaldırılır
- Kaldırılan kumaşlar "Havuz" kategorisine taşınır
- Havuz'da indirimli fiyatlarla satılır
- Bitince listeden çıkarılır

---

## Tekil Kumaş Ürünü (WooCommerce Product)

Her kumaş ürünü aşağıdaki bilgileri içermelidir:

### Zorunlu Alanlar

| Alan | Açıklama | Örnek |
|------|----------|-------|
| **Kartela Kodu (SKU)** | Benzersiz ürün tanımlayıcı | `TUL-2024-A15` |
| **Ürün Adı** | Açıklayıcı kumaş ismi | "Krem Desenli Tül - A15" |
| **Kategori** | Tül / Fon / Blackout / Havuz | "Tül Perdeler" |
| **Fiyat (Metre Başı)** | Custom field: `fiyat_metre` | 280 TL/metre |
| **Açıklama** | Materyal, doku, ağırlık, bakım | Aşağıda detay var |
| **Fotoğraflar** | En az 3-5 fotoğraf | Aşağıda standart var |
| **Mevcut Pile Oranları** | Tül için: 1:2, 1:2.5, 1:3 | Dropdown seçenek |
| **Stok Durumu** | Stokta / Sınırlı / Havuz | Badge olarak göster |

### Ürün Açıklaması Şablonu

Her kumaş ürününde tutarlı bilgi sunmak için:

```html
<h3>Kumaş Özellikleri</h3>
<table class="icc-product-specs">
  <tr>
    <th>Kartela Kodu</th>
    <td>TUL-2024-A15</td>
  </tr>
  <tr>
    <th>Kumaş Tipi</th>
    <td>Tül / Fon / Blackout</td>
  </tr>
  <tr>
    <th>Kompozisyon</th>
    <td>%100 Polyester / %70 Polyester %30 Keten</td>
  </tr>
  <tr>
    <th>Kumaş Genişliği</th>
    <td>280 cm / 300 cm</td>
  </tr>
  <tr>
    <th>Ağırlık</th>
    <td>180 gr/m² (tül için), 280 gr/m² (fon için)</td>
  </tr>
  <tr>
    <th>Işık Geçirgenlik</th>
    <td>Yüksek (tül) / Orta (fon) / Yok (blackout)</td>
  </tr>
  <tr>
    <th>Yıkama Talimatı</th>
    <td>30°C hassas yıkama, düşük ısıda ütü</td>
  </tr>
  <tr>
    <th>Renk</th>
    <td>Krem, Bej, Beyaz (gerçek renk)</td>
  </tr>
  <tr>
    <th>Doku/Özellik</th>
    <td>Desenli / Düz / Jakarlı / Nakışlı</td>
  </tr>
</table>

<h3>Ürün Açıklaması</h3>
<p>
  [Kumaşın görsel özelliklerini, hangi mekanlara uygun olduğunu,
  ışık geçirgenliğini ve kullanım senaryosunu açıklayan 2-3 paragraf.]
</p>

<h3>Pile (Kırışık) Oranları</h3>
<p>
  <strong>Tül perdeler için:</strong> 1:2, 1:2.5 veya 1:3 pile oranı seçebilirsiniz.<br>
  Örneğin 200 cm genişliğindeki pencere için 1:2.5 pile ile 500 cm kumaş kullanılır.
</p>
<p>
  <strong>Fon perdeler için:</strong> Panel genişliğine göre pile oranı değişir.
</p>

<h3>Dikim ve Teslimat</h3>
<p>
  Perdeniz ölçülerinize göre özel olarak dikilir. Sipariş sonrası 5-7 iş günü
  içinde hazırlanır ve kargoya verilir.
</p>
```

### Pile (Kırışık) Oranları

**Tül Perdeler:**
- **1:2** — Pencere genişliği × 2 (ekonomik, hafif kırışık)
- **1:2.5** — Pencere genişliği × 2.5 (orta yoğunlukta kırışık)
- **1:3** — Pencere genişliği × 3 (yoğun kırışık, lüks görünüm)

**Fon Perdeler:**
- Panel genişliğine göre değişir
- Genellikle daha az pile oranı kullanılır (çünkü yan panel olarak kullanılır)

---

## Fotoğraf Standartları

Kumaş fotoğrafları tutarlı ve profesyonel olmalıdır.

### Çekim Gereksinimleri

| Özellik | Gereksinim |
|---------|-----------|
| **Arka Plan** | Beyaz veya açık gri, düz, dikkati dağıtmayan |
| **Işık** | Doğal gün ışığı veya 5500K stüdyo ışığı (sarı ışıktan kaçın) |
| **Çözünürlük** | Minimum 1200x1200px |
| **Format** | JPEG (web için), sRGB renk profili |
| **Dosya Boyutu** | 1-3 MB (optimize edilmeden önce) |
| **En-Boy Oranı** | 1:1 (kare) tercih edilir |

### Zorunlu Fotoğraf Tipleri (Her Kumaş İçin)

1. **Kartela Fotoğrafı (Yakın Çekim)**
   - Kumaş numunesinin yakın çekim fotoğrafı
   - Doku ve renk net görünmeli
   - Ana ürün görseli olarak kullanılır

2. **Asılı/Dökümlü Fotoğraf**
   - Kumaşın asıldığında nasıl döküldüğünü gösterir
   - Kumaşın hareketini ve akışkanlığını sergiler
   - Müşteriye kumaşın canlılığı hakkında fikir verir

3. **Mekan İçinde Mockup (Opsiyonel ama Önerilen)**
   - Kumaşın pencereye asılmış halini gösterir
   - Gerçek mekan fotoğrafı veya dijital mockup olabilir
   - Müşteriye görsel bağlam sağlar
   - Satış oranını artırır

### Renk Doğruluğu Uyarısı

Kumaş fotoğraflarında renk doğruluğu kritiktir. Müşteriler gördükleri renkle gelen ürünün farklı olması halinde iade talep eder.

**Önlemler:**
- Monitor kalibrasyonu yapın (DisplayCAL veya işletim sistemi dahili)
- Fotoğrafları birden fazla cihazda kontrol edin (telefon, tablet, masaüstü)
- Ürün sayfasına uyarı ekleyin:

```html
<div class="renk-uyarisi">
  <strong>Önemli:</strong> Ekran ayarlarınıza bağlı olarak renk tonunda
  küçük farklılıklar olabilir. Gerçek rengi görmek için kartela örneği
  talep edebilirsiniz.
</div>
```

---

## Ürün Sayfası Düzeni

### Sayfa Yapısı

```
+-------------------------------------------------------------+
| [Breadcrumb: Ana Sayfa > Tül Perdeler > Krem Desenli Tül]   |
+-------------------------------------------------------------+
| [Fotoğraf Galerisi]       |  Krem Desenli Tül - A15         |
| (sol, %50)                |  Kartela: TUL-2024-A15          |
|                           |  [Tül Perdeler] badge           |
| - Kartela fotoğrafı       |                                  |
| - Asılı fotoğraf          |  280 TL/metre                   |
| - Mekan mockup            |                                  |
|                           |  Kısa açıklama: 2-3 cümle kumaş |
|                           |  hakkında özet bilgi.            |
|                           |                                  |
|                           |  +-- Hesaplama Bölümü --------+ |
|                           |  | Pencere Genişliği (cm):     | |
|                           |  | [______]                    | |
|                           |  |                             | |
|                           |  | Pile Oranı:                 | |
|                           |  | [Dropdown: 1:2/1:2.5/1:3]   | |
|                           |  |                             | |
|                           |  | □ Saten Ekle (+150 TL)      | |
|                           |  |                             | |
|                           |  | Toplam Kumaş: 5.00 metre    | |
|                           |  | Fiyat: 1.400,00 TL          | |
|                           |  +-----------------------------+ |
|                           |                                  |
|                           |  Oda Etiketi (opsiyonel):       |
|                           |  [Örn: Salon, Yatak Odası]      |
|                           |                                  |
|                           |  [Sepete Ekle]                  |
|                           |                                  |
|                           |  SKU: TUL-2024-A15              |
|                           |  Kategori: Tül Perdeler         |
|                           |  Stok: Mevcut / Sınırlı         |
+-------------------------------------------------------------+
| [Tab: Açıklama] [Tab: Özellikler] [Tab: Bakım Talimatları] |
|   Kumaş özellikleri tablosu                                 |
|   Detaylı açıklama                                          |
|   Pile oranları bilgisi                                     |
|   Dikim ve teslimat bilgisi                                 |
+-------------------------------------------------------------+
| Benzer Kumaşlar (4-6 ürün grid)                            |
+-------------------------------------------------------------+
```

### Hesaplama Bölümü

Ürün sayfasında dinamik fiyat hesaplama:

**Girdiler:**
- Pencere genişliği (cm)
- Pile oranı (dropdown: 1:2, 1:2.5, 1:3)
- Saten ekleme (checkbox, +150 TL)
- Oda etiketi (text input, opsiyonel)

**Çıktılar:**
- Toplam kumaş miktarı (metre)
- Hesaplanan fiyat (TL)
- Canlı güncelleme (JavaScript ile)

**Örnek Hesaplama:**
```
Pencere genişliği: 200 cm = 2 metre
Pile oranı: 1:2.5
Toplam kumaş: 2 × 2.5 = 5 metre
Fiyat: 5 × 280 TL = 1.400 TL
Saten ekle: +150 TL
Toplam: 1.550 TL
```

---

## Saten Ürünü

Saten, ayrı bir basit ürün olarak eklenir:

### Ürün Detayları

- **Ürün Tipi:** Simple Product (hesaplama yok)
- **Fiyat:** 150 TL (sabit)
- **Renkler:** Ürün varyasyonları olarak
  - Krem (Cream)
  - Beyaz (White)
- **SKU:** `SATEN-KREM`, `SATEN-BEYAZ`
- **Kategori:** "Saten"

### Blackout Yükseltme

Opsiyonel olarak, müşteri blackout saten talep edebilir:
- Farklı fiyat (örneğin 220 TL)
- Ayrı ürün varyasyonu veya checkbox ile sunulabilir

### Ürün Sayfası

Basit bir ürün sayfası:
- Saten fotoğrafı
- Renk seçimi (dropdown veya swatch)
- Miktar seçimi (metre veya adet)
- Direkt sepete ekle
- Hesaplama formu yok

---

## Yeni Kumaş Ekleme — Adım Adım Rehber

İnanç Tekstil personeli için yeni kumaş ekleme:

### Adım 1: WooCommerce Ürün Sayfası

```
WordPress Admin > WooCommerce > Ürünler > Yeni Ekle
```

### Adım 2: Temel Bilgiler

| Alan | Değer |
|------|-------|
| **Ürün Adı** | Kumaşın açıklayıcı adı, örneğin: "Krem Desenli Tül - A15" |
| **SKU** | Kartela kodu: `TUL-2024-A15` |
| **Kategori** | Tül Perdeler / Fon Perdeler / Blackout / Havuz |
| **Kısa Açıklama** | 2-3 cümle özet |
| **Açıklama** | Yukarıdaki şablonu kullanarak detaylı açıklama |

### Adım 3: Fiyatlandırma

```
Ürün Verileri > Genel
  Normal Fiyat: 0 (calculator fiyatı override eder)

Custom Field Ekle:
  Alan Adı: fiyat_metre
  Değer: 280 (metre başı fiyat, TL cinsinden)
```

**Not:** Custom field eklenti tarafından okunur ve hesaplamada kullanılır.

### Adım 4: Fotoğraf Yükleme

```
Sağ kolon > Ürün Görseli: Ana kartela fotoğrafı
Sağ kolon > Ürün Galerisi:
  - Yakın çekim (doku)
  - Asılı/dökümlü fotoğraf
  - Mekan mockup (varsa)
```

**Fotoğraf Adlandırma:**
```
tul-2024-a15-kartela.jpg
tul-2024-a15-asili.jpg
tul-2024-a15-mekan.jpg
```

### Adım 5: Pile Oranları

Custom field veya ürün özniteliği olarak:

```
Custom Field:
  pile_oranlari: 1:2,1:2.5,1:3 (virgülle ayrılmış)
```

Veya:

```
Ürün Verileri > Öznitelikler
  Öznitelik: Pile Oranı
  Değerler: 1:2 | 1:2.5 | 1:3
```

### Adım 6: Yayınla

```
Sağ kolon > Yayınla butonu
```

---

## Havuz Kumaşları Ekleme

Sezondan çıkmış kumaşlar için:

### Adım 1: Kategori Değiştir

Mevcut kumaş ürününü "Havuz Kumaşlar" kategorisine taşı:

```
Ürünler > [Kumaş seç] > Düzenle
Kategori: Havuz Kumaşlar (işaretle)
```

### Adım 2: Fiyat İndirim

Metre başı fiyatı düşür:

```
Custom Field: fiyat_metre
Eski değer: 280
Yeni değer: 180 (örneğin %35 indirim)
```

### Adım 3: Stok Uyarısı Ekle

Ürün açıklamasının başına ekle:

```html
<div class="havuz-uyari">
  <strong>⚠️ Stokla Sınırlı — Devamı Yoktur</strong>
  <p>Bu kumaş sezondan çıkmıştır. Elimizdeki stok bittiğinde tekrar gelmeyecektir.</p>
</div>
```

### Adım 4: Badge Ekle

Ürün başlığına veya thumbnail'e badge ekle:

```
[HAVUZ] Krem Desenli Tül - A15
```

---

## Sezonluk Güncellemeler

### Yeni Sezon Başlangıcı

1. **Yeni Kartela Hazırla**
   - Yeni kumaş numunelerini fotoğrafla
   - Kartela kodlarını belirle (örneğin: TUL-2025-...)
   - Ürün olarak ekle (yukarıdaki adımları takip et)

2. **Eski Kumaşları Taşı**
   - Önceki sezon kumaşlarını "Havuz" kategorisine al
   - Fiyatları indir
   - Stok uyarısı ekle

3. **Satış Kampanyası**
   - Havuz kumaşlar için kampanya duyurusu yap
   - "Sezon Sonu İndirimi" başlığı ile
   - E-posta, sosyal medya, site banner'ı

### Sezon Sonu

1. **Stok Kontrolü**
   - Havuz kumaşlardan bitenleri tespit et
   - Stokta olmayanları "Taslak" yap (yayından kaldır)

2. **Raporlama**
   - Hangi kumaşlar satılmadı?
   - Hangi renkler/desenler popüler?
   - Gelecek sezon için not al

---

## Kategori Sayfaları

### Tül Perdeler Kategori Sayfası

```
URL: /kategori/tul-perdeler/

Grid Görünüm:
  - 3-4 sütun (masaüstü)
  - 2 sütun (tablet)
  - 1 sütun (mobil)

Her Ürün Kartı:
  - Kartela fotoğrafı (kare)
  - Ürün adı
  - Kartela kodu
  - Fiyat: "280 TL/metre"
  - [İncele] butonu
  - Hover'da: hızlı görünüm veya ikinci fotoğraf
```

### Kategori Banner

Her kategori için özel banner:

```html
<div class="kategori-banner tul-perdeler">
  <h1>Tül Perdeler</h1>
  <p>Gündüz kullanımı için şeffaf ve zarif tül perdelerimizi keşfedin.</p>
</div>
```

### Filtreleme

```
Sol Sidebar (veya üstte):
  Fiyat Aralığı: [Slider: 100 TL - 500 TL]
  Renk: [Beyaz] [Krem] [Bej] [Gri] ...
  Doku: [Düz] [Desenli] [Jakarlı] ...
  Sırala: [Popüler] [Yeni] [Ucuz → Pahalı] [Pahalı → Ucuz]
```

---

## Toplu Ürün Ekleme (CSV Import)

20-30 kumaşı tek tek eklemek yerine CSV ile toplu yükleme:

### Adım 1: CSV Hazırla

```csv
Type,SKU,Name,Published,Categories,Images,Meta: fiyat_metre,Short description,Description
simple,TUL-2024-A15,"Krem Desenli Tül - A15",1,"Tül Perdeler",tul-2024-a15-kartela.jpg|tul-2024-a15-asili.jpg,280,"Zarif krem desenli tül perde.","<h3>Kumaş Özellikleri</h3>..."
simple,FON-2024-B08,"Lacivert Jakarlı Fon - B08",1,"Fon Perdeler",fon-2024-b08-kartela.jpg,320,"Lacivert jakarlı fon perde.","<h3>Kumaş Özellikleri</h3>..."
simple,BLK-2024-C12,"Gri Blackout - C12",1,"Blackout Perdeler",blk-2024-c12-kartela.jpg,380,"Gri blackout perde.","<h3>Kumaş Özellikleri</h3>..."
```

### Adım 2: Fotoğrafları Yükle

CSV import öncesi:

```
Medya > Yeni Ekle
Tüm kumaş fotoğraflarını toplu yükle
```

Veya FTP ile:

```
/wp-content/uploads/2024/01/
  tul-2024-a15-kartela.jpg
  tul-2024-a15-asili.jpg
  ...
```

### Adım 3: CSV Import

```
WooCommerce > Ürünler > İçe Aktar (Import)
CSV dosyasını seç
Alan eşleştirmelerini kontrol et
İçe aktar
```

### Adım 4: Kontrol

Import sonrası:
- Her ürünü aç, fotoğrafları kontrol et
- Fiyatların doğru geldiğini onayla
- Kategorilerin atandığını kontrol et

---

## Kontrol Listesi: Yeni Kumaş Ekleme

Her yeni kumaş eklerken aşağıdakileri kontrol edin:

- [ ] Kartela kodu (SKU) benzersiz ve doğru formatta
- [ ] Ürün adı açık ve aranabilir
- [ ] Kategori seçildi (Tül/Fon/Blackout/Havuz)
- [ ] `fiyat_metre` custom field girildi
- [ ] En az 3 fotoğraf yüklendi (kartela, asılı, mekan)
- [ ] Fotoğraflar sRGB, en az 1200x1200px
- [ ] Açıklama şablona uygun, tüm özellikler dolu
- [ ] Pile oranları belirtildi
- [ ] Stok durumu işaretlendi
- [ ] Ürün sayfasında hesaplama formu görünüyor mu?
- [ ] Hesaplama doğru çalışıyor mu? (test et)
- [ ] Mobilde görünüm düzgün mü?
- [ ] Sepete ekleme başarılı mı?
- [ ] İlgili/benzer ürünler bağlandı mı?

---

## SEO ve Arama Optimizasyonu

### Ürün Başlığı SEO

```
Kötü: "A15"
İyi: "Krem Desenli Tül - A15"
Daha İyi: "Krem Desenli Tül Perde Kumaşı - A15 | İnanç Tekstil"
```

### Meta Açıklama

```
Zarif krem desenli tül perde kumaşı. 280 cm genişlik, %100 polyester.
Ölçüye özel dikim, İskenderun'dan ücretsiz kargo. Kartela kodu: TUL-2024-A15
```

### Odak Anahtar Kelimeler

- "tül perde kumaşı"
- "fon perde kumaşı"
- "blackout perde"
- "perde kumaşı iskenderun"
- "özel dikim perde"

### Alt Text (Görsel SEO)

```html
<img src="tul-2024-a15-kartela.jpg"
     alt="Krem desenli tül perde kumaşı yakın çekim - TUL-2024-A15">

<img src="tul-2024-a15-asili.jpg"
     alt="Krem desenli tül perde asılı görünüm">
```

---

## Bakım ve Güncelleme

### Haftalık

- [ ] Yeni siparişleri kontrol et
- [ ] Stok durumunu güncelle (havuz için özellikle)
- [ ] Müşteri yorumlarına yanıt ver

### Aylık

- [ ] Fiyatları gözden geçir (hammadde maliyetine göre)
- [ ] Popüler/popüler olmayan kumaşları analiz et
- [ ] Fotoğraf kalitesini kontrol et, gerekirse yeniden çek

### Mevsimlik

- [ ] Yeni sezon kartela hazırla
- [ ] Eski kumaşları havuz'a taşı
- [ ] Fiyat güncellemeleri yap
- [ ] Kampanya planla (sezon başı/sonu)

---

## Teknik Notlar

### Custom Fields

Eklenti tarafından kullanılan custom field'ler:

```
fiyat_metre: 280 (metre başı fiyat, TL)
pile_oranlari: 1:2,1:2.5,1:3 (virgülle ayrılmış)
kumas_tipi: tul / fon / blackout
stok_durumu: mevcut / sinirli / havuz
```

### WooCommerce Hooks

Fiyat görünümünü özelleştirmek için:

```php
add_filter('woocommerce_get_price_html', 'custom_price_display', 10, 2);
```

Detaylar `pricing-calculator.md` dosyasında.

---

## Sık Sorulan Sorular (Personel İçin)

**S: Kartela kodu nasıl belirlenir?**
C: Format: `[KATEGORİ]-[YIL]-[SIRA]`
Örnek: `TUL-2024-A15`, `FON-2025-B23`

**S: Havuz'a hangi kumaşlar gider?**
C: Sezondan çıkan, artık üretilmeyen kumaşlar. Genellikle eski sezon sonu.

**S: Fotoğraflarda renk doğru çıkmıyor, ne yapmalı?**
C: Monitor kalibrasyonu yap, doğal ışıkta çek, sRGB profili kullan.

**S: Pile oranı nedir?**
C: Perdenin pencere genişliğine göre ne kadar kırışık/dalgalı olacağını belirler. 1:2.5 demek, 100 cm pencere için 250 cm kumaş.

**S: Saten her zaman aynı fiyat mı?**
C: Evet, 150 TL sabit. Sadece blackout saten farklı fiyatta olabilir.

**S: Hazır fon nedir?**
C: Önceden dikilmiş, standart boyutlarda fon perdeler. Hızlı teslimat, uygun fiyat.

---

## Sonuç

Bu rehber, İnanç Tekstil'in kartela sistemini dijitale taşıyan e-ticaret yapısını tanımlar. Her kumaş bir ürün, her ürün bir kartela kodu ile tanımlanır. Sistemli fotoğraflama, tutarlı açıklamalar ve dinamik hesaplama ile müşteriye profesyonel bir online alışveriş deneyimi sunulur.