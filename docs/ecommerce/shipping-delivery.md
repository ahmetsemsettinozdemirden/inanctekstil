# Kargo ve Teslimat Yapilandirmasi

## Genel Politika

- **Hizmet Bolgesi:** Yalnizca Hatay ili (baslangiicta)
- **Uretim Suresi:** 5-10 is gunu (siparis onayindan itibaren)
  - Kumas siparisi: 2-3 is gunu (stokta yoksa tedarikci siparis)
  - Kesim ve dikim: 3-7 is gunu (atölyede imalat)
- **Teslimat Yontemleri:**
  - Ev adresine teslimat (Iskenderun/Hatay bolgesi)
  - Magazadan teslim alma (musteri kendisi alir)
- **Montaj Hizmeti:** Isteyen musteriler icin perde asma hizmeti sunulur (opsiyonel)

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

### Uretim Sureci

1. **Musteri olcu alir** (kendi olcerse) veya Inanc Tekstil olcum hizmeti verir (musteri satin almaya karar verirse)
2. **Kartela'dan kumas secer** + olculeri girer
3. **Odeme:** Pesin odeme (PayTR ile kredi karti + taksit) veya banka havalesi (IBAN)
4. **Kumas siparisi:** Tedarikciden siparis edilir VEYA stok rulolardan kesilir
5. **Atölyede dikim:** Evde/magazada imalat
6. **Teslimat:** Ev adresine teslimat (Iskenderun/Hatay) veya magazadan teslim alma
7. **Montaj (opsiyonel):** Perdelerin pencereye asılması hizmeti

### WooCommerce Siparis Durumlari

Inanc Tekstil icin ozel durum tasarimi:

```
1. Siparis Alindi (wc-pending/processing)     -> Odeme alindi, onay bekleniyor
2. Kumas Siparişi (wc-fabric-order)           -> Kumas tedarikci'den siparis edildi
3. Imalatta (wc-sewing)                       -> Kesim ve dikim devam ediyor
4. Hazir (wc-ready)                           -> Urun hazir, teslimat planlaniyor
5. Teslim Edildi (wc-completed)               -> Musteriye teslim edildi
6. Iptal (wc-cancelled)                       -> Siparis iptal
7. Iade (wc-refunded)                         -> Para iade edildi
```

### Ozel Siparis Durumlari Kodu

```php
// Ozel siparis durumlari: Kumas Siparisi, Imalatta, Hazir
add_action('init', function () {
    register_post_status('wc-fabric-order', [
        'label'                     => 'Kumas Siparişi',
        'public'                    => true,
        'exclude_from_search'       => false,
        'show_in_admin_all_list'    => true,
        'show_in_admin_status_list' => true,
        'label_count'               => _n_noop('Kumas Siparişi (%s)', 'Kumas Siparişi (%s)'),
    ]);

    register_post_status('wc-sewing', [
        'label'                     => 'Imalatta',
        'public'                    => true,
        'exclude_from_search'       => false,
        'show_in_admin_all_list'    => true,
        'show_in_admin_status_list' => true,
        'label_count'               => _n_noop('Imalatta (%s)', 'Imalatta (%s)'),
    ]);

    register_post_status('wc-ready', [
        'label'                     => 'Hazir',
        'public'                    => true,
        'exclude_from_search'       => false,
        'show_in_admin_all_list'    => true,
        'show_in_admin_status_list' => true,
        'label_count'               => _n_noop('Hazir (%s)', 'Hazir (%s)'),
    ]);
});

add_filter('wc_order_statuses', function (array $statuses): array {
    $new = [];
    foreach ($statuses as $key => $label) {
        $new[$key] = $label;
        if ($key === 'wc-processing') {
            $new['wc-fabric-order'] = 'Kumas Siparişi';
            $new['wc-sewing'] = 'Imalatta';
            $new['wc-ready'] = 'Hazir';
        }
    }
    return $new;
});
```

Bu durumda is akisi:

```
Siparis Alindi -> Kumas Siparişi -> Imalatta -> Hazir -> Teslim Edildi
                       |                                       |
                       +-> Iptal                          +-> Iade
```

### Gunluk Operasyon

1. **Sabah:** Yeni siparisleri kontrol et (WooCommerce > Siparisler, durum: "Siparis Alindi")
2. **Kumas kontrolu:** Stokta var mi? Yoksa tedarikci siparis -> Durum: "Kumas Siparişi"
3. **Kumas geldi:** Kesim ve dikime basla -> Durum: "Imalatta"
4. **Dikim tamamlandi:** Durum -> "Hazir", musteriye WhatsApp ile bildir
5. **Teslimat planlama:** Ev adresine mi, magaza teslim mi? Montaj isteniyor mu?
6. **Teslimattan sonra:** Durum -> "Teslim Edildi"

### WhatsApp ile Siparis Takibi

Musteri ile surekli WhatsApp iletisimi onemli:
- Olculerde degisiklik olabilir (siparis sonrasi)
- Montajdan sonra duzeltme gerekebilir
- Guclu musteri iliskisi yonetimi gereklidir

### Admin Siparis Notlari

Her asamada siparis notu ekle:

```
WooCommerce > Siparisler > [Siparis No] > Siparis Notlari

"Musteri notu" secenegini kullanarak musteriye otomatik e-posta/WhatsApp gonder:
- "Siparisiniz alindi. Kumas siparisi verildi."
- "Kumasiniz geldi, dikime aliniyor."
- "Perdeniz hazir. Teslimat icin WhatsApp'tan iletisime gececegiz."
- "Perdeniz teslim edildi. Iyi gunlerde kullanin!"
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

Siparisiniz basariyla alindi. Perdeniz en kisa surede uretime alinacaktir.

Siparis Ozeti:
- Urun: {urun_adi}
- Olculer: {en} x {boy} cm
- Tutar: {toplam} TL

Tahmini hazirlik suresi: 5-10 is gunu
(Kumas siparisi + kesim + dikim)

WhatsApp uzerinden siparis durumunuzu takip edebilirsiniz.

Sorulariniz icin bize ulasabilirsiniz:
Telefon: 0326 XXX XX XX
WhatsApp: 05XX XXX XX XX

Inanc Tekstil
```

### Kumas Siparisi Verildi (WhatsApp)

```
Merhaba {isim},

#{siparis_no} numarali siparisiniz icin kumas siparisi verildi.
Kumas geldiginde dikime alinacak, sizi bilgilendirececegiz.

Inanc Tekstil
```

### Dikime Alindi (WhatsApp)

```
Merhaba {isim},

{urun_adi} perdeniz dikime alindi.
Tahmini tamamlanma suresi 3-5 gun icindedir.

Hazir oldugunda sizinle iletisime gececegiz.

Inanc Tekstil
```

### Teslimata Hazir (WhatsApp)

```
Merhaba {isim},

Perdeniz hazir! Teslim secenekleriniz:

1. Ev adresinize teslimat (Iskenderun/Hatay)
2. Magazadan teslim alma

Montaj hizmeti isterseniz perdeleri asma hizmeti de sunuyoruz.

Size uygun olan gunu bize bildirin.

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
