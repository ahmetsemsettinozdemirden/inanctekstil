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

### 5. **Balkon Perdesi**
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

### Pile (Kırışık) Oranları

**Tül Perdeler:**
- **1:2** — Pencere genişliği × 2 (ekonomik, hafif kırışık)
- **1:2.5** — Pencere genişliği × 2.5 (orta yoğunlukta kırışık)
- **1:3** — Pencere genişliği × 3 (yoğun kırışık, lüks görünüm)

**Fon Perdeler:**
- Panel genişliğine göre değişir
- Genellikle daha az pile oranı kullanılır (çünkü yan panel olarak kullanılır)

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