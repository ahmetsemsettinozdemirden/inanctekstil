# Kargo ve Teslimat Yapilandirmasi

## Genel Politika

- **Hizmet Bolgesi:** Yalnizca Hatay ili (baslangiicta)
- **Uretim Suresi:** 5-7 is gunu (siparis onayindan itibaren)
- **Teslimat Yontemleri:**
  - Duz ucretli kargo (Hatay ili geneli)
  - Ucretsiz teslimat (belirli tutar uzerinde veya Iskenderun merkez)
  - Elden teslim (Iskenderun ve yakin cevre)

---

## WooCommerce Kargo Bolgeleri

### 1. Tum Diger Bolgeleri Devre Disi Birakma

WooCommerce'te yalnizca tanimli bolgelere gonderim yapilir. Tanimli olmayan bolgeler icin kargo yontemi eklenmezse, o bolgelerden siparis verilemez.

```
WooCommerce > Ayarlar > Kargo > Kargo Bolgeleri
```

### 2. Hatay Bolgesi Olusturma

```
Bolge Ekle:
  Bolge Adi: Hatay
  Bolge Bolgesi: Turkiye > Hatay (il kodu: TR31)
```

WooCommerce, Turkiye illeri icin posta kodu veya il secimi sunar. "Turkiye" ulkesini sectikten sonra "Hatay" ilini ekle.

Eger WooCommerce Turkiye illerini listelemiyorsa, posta kodu araligi ile tanimla:

```
Bolge Bolgesi: Turkiye
Posta Kodu Kisitlamasi: 31000-31999 (Hatay ili posta kodlari)
```

### 3. Kargo Yontemlerini Ekleme

Hatay bolgesi icine asagidaki yontemleri ekle:

#### a) Duz Ucret (Flat Rate)

```
Kargo Yontemi Ekle > Duz Ucret
  Baslik: "Kargo ile Teslimat"
  Maliyet: 75 (veya guncel kargo maliyeti)
  Vergi Durumu: Vergilenebilir
```

Maliyet alaninda WooCommerce formulleri kullanilabilir:

```
Sabit maliyet:                75
Urun sayisina gore:           50 + (10 * [qty])
Siparis tutarina gore sabit:  75
```

Perde kargosunda genellikle sabit ucret yeterli. Boyut degisken olsa da ambalaj standart.

#### b) Ucretsiz Kargo

```
Kargo Yontemi Ekle > Ucretsiz Kargo
  Baslik: "Ucretsiz Kargo"
  Gereklilik: Minimum siparis tutari
  Minimum Tutar: 1000 (veya istedigin esik)
```

Bu ayar, 1000 TL ve uzeri siparislerde ucretsiz kargo secenegi sunar. Duz ucret secenegi de gorunur, musteri secer.

#### c) Yerel Teslimat (Elden Teslim)

```
Kargo Yontemi Ekle > Yerel Teslimat
  Baslik: "Elden Teslim (Iskenderun)"
  Maliyet: 0 (ucretsiz) veya kucuk bir ucret
```

Yerel teslimati belirli posta kodlariyla sinirlamak icin ayri bir bolge olusturabilirsin:

```
Bolge Ekle:
  Bolge Adi: Iskenderun Merkez
  Bolge Bolgesi: Turkiye
  Posta Kodu: 31200, 31201, 31202, ... (Iskenderun merkez posta kodlari)

  Kargo Yontemi: Yerel Teslimat
    Baslik: "Elden Teslim (Ucretsiz)"
    Maliyet: 0
```

### 4. Diger Bolgeler (Kargo Yok)

"Kargo Bolgeleri" sayfasinin en altinda "Bu bolgelerin kapsaminda olmayan konumlar" ayari vardir. Buraya **hicbir kargo yontemi ekleme**. Boylece Hatay disindaki musteriler odeme sayfasinda "Bu bolgeye gonderim yapilmiyor" mesajini gorur.

---

## Siparis Sayfasinda Bilgilendirme

Musteriye uretim ve teslimat suresi hakkinda bilgi ver. Odeme sayfasinda ve siparis onay e-postasinda bu bilgi gorunmeli.

### Odeme Sayfasinda Bilgi Notu

```php
// functions.php veya ozel eklentiye ekle
add_action('woocommerce_review_order_before_payment', function () {
    echo '<div class="icc-delivery-notice" style="
        background: #fff3e0;
        border-left: 4px solid #ff9800;
        padding: 12px 16px;
        margin-bottom: 20px;
        font-size: 0.95em;
    ">';
    echo '<strong>Teslimat Bilgisi:</strong> ';
    echo 'Perdeniz, siparis onayindan itibaren <strong>5-7 is gunu</strong> icerisinde ';
    echo 'dikilir ve teslimata hazir hale getirilir. ';
    echo 'Hatay ili icerisine kargo veya elden teslim yapilmaktadir.';
    echo '</div>';
});
```

### Siparis Onay E-postasinda

WooCommerce e-posta sablonlarini ozellestir:

```
WooCommerce > Ayarlar > E-postalar > Isleniyor (Processing) > Yonet

Ek Icerik alanina ekle:
  "Perdeniz dikime alindi. Tahmini hazirlik suresi 5-7 is gunudur.
   Teslimat oncesinde sizinle iletisime gececegiz."
```

Veya programatik olarak:

```php
add_action('woocommerce_email_before_order_table', function ($order, $sent_to_admin, $plain_text) {
    if ($sent_to_admin) return; // Admin e-postasina ekleme

    if ($order->get_status() === 'processing') {
        if ($plain_text) {
            echo "\nPerdeniz dikime alindi. Tahmini hazirlik suresi 5-7 is gunudur.\n";
            echo "Teslimat oncesinde sizinle iletisime gececegiz.\n\n";
        } else {
            echo '<div style="background:#e8f5e9; padding:12px 16px; margin:12px 0; border-radius:4px;">';
            echo '<p><strong>Perdeniz dikime alindi.</strong></p>';
            echo '<p>Tahmini hazirlik suresi <strong>5-7 is gunu</strong>dur. ';
            echo 'Teslimat oncesinde sizinle iletisime gececegiz.</p>';
            echo '</div>';
        }
    }
}, 10, 3);
```

---

## Siparis Is Akisi (Order Fulfillment Workflow)

### Siparis Durumlari

WooCommerce varsayilan durumlari kullanilir:

```
1. Beklemede (Pending)      -> Odeme bekleniyor
2. Isleniyor (Processing)   -> Odeme alindi, uretim basliyor
3. Beklemede (On-hold)      -> Ozel durum (musteri ile iletisim gerekli)
4. Tamamlandi (Completed)   -> Urun teslim edildi
5. Iptal (Cancelled)        -> Siparis iptal edildi
6. Iade (Refunded)          -> Para iade edildi
```

### Ozel Siparis Durumu: "Dikimde" (Opsiyonel)

WooCommerce'e ozel siparis durumu eklemek, uretim surecini izlemeyi kolaylastirir:

```php
// Ozel siparis durumu: Dikimde
add_action('init', function () {
    register_post_status('wc-sewing', [
        'label'                     => 'Dikimde',
        'public'                    => true,
        'exclude_from_search'       => false,
        'show_in_admin_all_list'    => true,
        'show_in_admin_status_list' => true,
        'label_count'               => _n_noop('Dikimde (%s)', 'Dikimde (%s)'),
    ]);
});

add_filter('wc_order_statuses', function (array $statuses): array {
    $new = [];
    foreach ($statuses as $key => $label) {
        $new[$key] = $label;
        if ($key === 'wc-processing') {
            $new['wc-sewing'] = 'Dikimde';
        }
    }
    return $new;
});
```

Bu durumda is akisi:

```
Beklemede -> Isleniyor -> Dikimde -> Tamamlandi
               |                        |
               +-> Iptal           +-> Iade
```

### Gunluk Operasyon

1. **Sabah:** Yeni siparisleri kontrol et (WooCommerce > Siparisler, durum: "Isleniyor")
2. **Uretim planlama:** Siparis detayindan olculeri al (Perde Eni, Perde Boyu, Alan)
3. **Dikim baslagicinda:** Durum -> "Dikimde" (ozel durum eklendiyse) veya musteri notu ekle
4. **Dikim tamamlandiginda:** Musteriye bildir (telefon/WhatsApp), teslimat planla
5. **Teslimattan sonra:** Durum -> "Tamamlandi"

### Admin Siparis Notlari

Her asamada siparis notu ekle:

```
WooCommerce > Siparisler > [Siparis No] > Siparis Notlari

"Musteri notu" secenegini kullanarak musteriye otomatik e-posta gonder:
- "Perdeniz dikime alindi."
- "Perdeniz hazir. Teslimat icin sizinle iletisime gececegiz."
- "Perdeniz teslim edilmistir. Iyi gunlerde kullanin!"
```

---

## Bolge Disina Satis Genislemesi (Gelecek)

Hatay disina genislemek istendiginde:

### 1. Turkiye Geneli Kargo

```
Kargo Bolgeleri:
  Bolge: Turkiye (tum iller)
  Yontem: Duz Ucret
    Baslik: "Kargo ile Gonderim"
    Maliyet: [kargo firmasi ucretine gore]
```

Kargo firmasi entegrasyonu:
- Yurtici Kargo, Aras Kargo, MNG Kargo WooCommerce eklentileri mevcut
- Otomatik takip numarasi gondermek icin "WooCommerce Shipment Tracking" eklentisi kullanilabilir

### 2. Bolgeye Gore Degisken Ucret

```
Bolge 1: Hatay          -> 0 TL (ucretsiz)
Bolge 2: Komsu iller    -> 50 TL
Bolge 3: Turkiye geneli -> 100 TL
```

---

## Musteri Iletisim Sablonlari

### Siparis Onay (Otomatik E-posta)

```
Konu: Siparisiniz Alindi - Inanc Tekstil #{siparis_no}

Sayin {isim},

Siparisiniz basariyla alindi. Perdeniz en kisa surede dikime alinacaktir.

Siparis Ozeti:
- Urun: {urun_adi}
- Olculer: {en} x {boy} cm
- Tutar: {toplam} TL

Tahmini hazirlik suresi: 5-7 is gunu

Sorulariniz icin bize ulasabilirsiniz:
Telefon: 0326 XXX XX XX
WhatsApp: 05XX XXX XX XX

Inanc Tekstil
```

### Dikime Alindi (Manuel Gonderim)

```
Konu: Perdeniz Dikime Alindi - #{siparis_no}

Sayin {isim},

{urun_adi} perdeniz dikime alindi. Tahmini tamamlanma suresi 3-4 gun icindedir.

Hazir oldugunda sizinle iletisime gececegiz.

Inanc Tekstil
```

### Teslimata Hazir (Manuel Gonderim)

```
Konu: Perdeniz Hazir - #{siparis_no}

Sayin {isim},

Perdeniz dikildi ve teslimata hazir.

[Elden teslim icin:]
Size uygun bir zamanda teslim etmek istiyoruz. Lutfen uygun oldugunuz
gun ve saat araligini bize bildirin.

[Kargo icin:]
Perdeniz bugun kargoya verildi. Takip numaraniz: {takip_no}
Tahmini teslimat: 1-2 is gunu

Inanc Tekstil
```

---

## Kontrol Listesi

- [ ] Hatay kargo bolgesi olusturuldu (TR31 veya 31000-31999)
- [ ] Duz ucret kargo yontemi eklendi
- [ ] Ucretsiz kargo esigi belirlendi (ornek: 1000 TL)
- [ ] Yerel teslimat (Iskenderun) eklendi
- [ ] Diger bolgeler icin kargo yontemi YOK (satis engellendi)
- [ ] Odeme sayfasinda uretim suresi bildirimi var
- [ ] Siparis onay e-postasinda teslimat bilgisi var
- [ ] "Dikimde" ozel durumu eklendi (opsiyonel)
- [ ] WhatsApp iletisim numarasi site footer'inda ve urun sayfasinda mevcut
