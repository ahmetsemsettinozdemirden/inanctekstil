# Kargo ve Teslimat Yapilandirmasi

## Genel Politika

- **Hizmet Bolgesi:** Yalnizca Hatay ili (baslangiicta)
- **Uretim Suresi:** 5-7 is gunu (siparis onayindan itibaren)
  - Kumas siparisi: 2-3 is gunu (stokta yoksa tedarikci siparis)
  - Kesim ve dikim: 3-5 is gunu (atölyede imalat)
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

Perde kargosunda sabit ucret kullanilir. Boyut degisken olsa da ambalaj standart.

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

MVP baslangiciniz icin varsayilan WooCommerce durumlari yeterlidir:

```
1. Beklemede (wc-pending)       -> Odeme bekleniyor
2. Isleniyor (wc-processing)    -> Odeme alindi, uretim basladi
3. Tamamlandi (wc-completed)    -> Musteriye teslim edildi
4. Iptal (wc-cancelled)         -> Siparis iptal
5. Iade (wc-refunded)           -> Para iade edildi
```

Basit is akisi:

```
Beklemede -> Isleniyor -> Tamamlandi
                |              |
                +-> Iptal      +-> Iade
```

### Gunluk Operasyon

1. **Sabah:** Yeni siparisleri kontrol et (WooCommerce > Siparisler, durum: "Beklemede")
2. **Odeme onayinda:** Durum -> "Isleniyor", kumas ve uretim planlama
3. **Kumas ve dikim:** Tedarik, kesim ve dikim asamalari (admin notlariyla takip)
4. **Dikim tamamlandi:** Musteriye telefon/e-posta ile teslimat planlama
5. **Teslimat planlama:** Ev adresine mi, magaza teslim mi? Montaj isteniyor mu?
6. **Teslimattan sonra:** Durum -> "Tamamlandi"

### Admin Siparis Notlari

Her asamada siparis notu ekle:

```
WooCommerce > Siparisler > [Siparis No] > Siparis Notlari

"Musteri notu" secenegini kullanarak musteriye otomatik e-posta gonder:
- "Siparisiniz alindi. Kumas siparisi verildi."
- "Kumasiniz geldi, dikime aliniyor."
- "Perdeniz hazir. Teslimat icin iletisime gececegiz."
- "Perdeniz teslim edildi. Iyi gunlerde kullanin!"
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

Tahmini hazirlik suresi: 5-7 is gunu
(Kumas siparisi + kesim + dikim)

Sorulariniz icin bize ulasabilirsiniz:
WhatsApp: 0541 428 80 05
E-posta: info@inanctekstil.store

Inanc Tekstil
```


---

## Kontrol Listesi

- [ ] Hatay kargo bolgesi olusturuldu (TR31 veya 31000-31999)
- [ ] Duz ucret kargo yontemi eklendi (75 TL sabit)
- [ ] Ucretsiz kargo esigi belirlendi (ornek: 1000 TL)
- [ ] Yerel teslimat (Iskenderun) eklendi
- [ ] Diger bolgeler icin kargo yontemi YOK (satis engellendi)
- [ ] Odeme sayfasinda uretim suresi bildirimi var
- [ ] Siparis onay e-postasinda teslimat bilgisi var
- [ ] Varsayilan WooCommerce siparis durumlari kullaniliyor (Beklemede/Isleniyor/Tamamlandi)
