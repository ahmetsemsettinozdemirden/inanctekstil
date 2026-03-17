# Kargo ve Teslimat Yapilandirmasi

## Genel Politika

- **Mevcut Hizmet Bolgesi:** Hatay ili
- **Planli Genisleme:** Turkiye geneli kargo
- **Uretim Suresi:** 5-7 is gunu (siparis onayindan itibaren)
  - Kumas siparisi: 2-3 is gunu (stokta yoksa tedarikci siparis)
  - Kesim ve dikim: 3-5 is gunu (atolyede imalat)
- **Teslimat Yontemleri:**
  - Kargo ile teslimat
  - Magazadan teslim alma (musteri kendisi alir)
- **Montaj Hizmeti:** Isteyen musteriler icin perde asma hizmeti sunulur (opsiyonel)

---

## Shopify Kargo Bolgeleri

### Ayarlar

```
Shopify Admin > Ayarlar > Kargo ve teslimat > Kargo
```

### Mevcut Yapilandirma: Hatay Bolgesi

#### Genel kargo profili

```
Kargo bolgeleri:
  Bolge: Turkiye
  Sartlar: Hatay ili (posta kodu: 31000-31999)
```

#### Kargo Yontemleri

**a) Duz Ucret (Flat Rate)**
```
Kargo ucreti adi: "Kargo ile Teslimat"
Fiyat: 75 TL (veya guncel kargo maliyeti)
```

**b) Ucretsiz Kargo**
```
Kargo ucreti adi: "Ucretsiz Kargo"
Kosul: Minimum siparis tutari 1000 TL+
```

**c) Magazadan Teslim Alma**
```
Shopify Admin > Ayarlar > Kargo ve teslimat > Magazadan teslim alma
  Konum: Iskenderun, Hatay
  Hazirlik suresi: 5-7 is gunu
  Ucret: Ucretsiz
```

### Gelecek: Turkiye Geneli Kargo

Turkiye geneline acildiginda:

```
Ek kargo bolgeleri:
  Bolge: Turkiye (tum iller)
  Kargo ucreti: Duz ucret veya agirliga gore hesaplama
  Ucretsiz kargo esigi: Belirlenecek (ornek: 1500 TL+)
```

Hatay bolgesi icin ayri (daha dusuk) kargo ucreti veya ucretsiz kargo korunabilir.

---

## Siparis Is Akisi

### Uretim Sureci

1. **Musteri olcu alir** (kendi olcerse) veya Inanc Tekstil olcum hizmeti verir
2. **Kartela'dan kumas secer** + olculeri girer
3. **Odeme:** PayTR ile kredi karti + taksit veya banka havalesi
4. **Kumas siparisi:** Tedarikciden siparis edilir veya stok rulolardan kesilir
5. **Atolyede dikim:** Evde/magazada imalat
6. **Teslimat:** Kargo veya magazadan teslim alma
7. **Montaj (opsiyonel):** Perdelerin pencereye asilmasi hizmeti

### Shopify Siparis Durumlari

```
1. Odeme bekliyor (Payment pending)    -> Odeme bekleniyor
2. Karsilanmamis (Unfulfilled)         -> Odeme alindi, uretim basladi
3. Karsilandi (Fulfilled)              -> Musteriye teslim edildi
4. Iptal (Cancelled)                   -> Siparis iptal
5. Iade (Refunded)                     -> Para iade edildi
```

Basit is akisi:

```
Odeme bekliyor -> Karsilanmamis -> Karsilandi
                       |                |
                       +-> Iptal        +-> Iade
```

### Gunluk Operasyon

1. **Sabah:** Yeni siparisleri kontrol et (Shopify Admin > Siparisler)
2. **Odeme onayinda:** Kumas ve uretim planlama
3. **Kumas ve dikim:** Tedarik, kesim ve dikim asamalari (siparis notlariyla takip)
4. **Dikim tamamlandi:** Musteriye telefon/e-posta ile teslimat planlama
5. **Teslimat planlama:** Kargo mi, magaza teslim mi? Montaj isteniyor mu?
6. **Teslimattan sonra:** Durum -> "Karsilandi" olarak isaretle

### Siparis Notlari

Shopify Admin > Siparisler > [Siparis No] > Zaman cizelgesi

Her asamada siparis notu ekle:
- "Siparis alindi. Kumas siparisi verildi."
- "Kumasiniz geldi, dikime aliniyor."
- "Perdeniz hazir. Teslimat icin iletisime gececegiz."
- "Perdeniz teslim edildi."

---

## Siparis Sayfasinda Bilgilendirme

Musteriye uretim ve teslimat suresi hakkinda bilgi ver.

### Odeme Sayfasinda

Shopify checkout sayfasina bilgi notu ekle:

```
Shopify Admin > Ayarlar > Odeme > Odeme islemi ozellestirmesi
  veya
Shopify Admin > Online Magaza > Temalar > Ozellestir > Odeme

Teslimat Bilgisi notu:
  "Perdeniz, siparis onayindan itibaren 5-7 is gunu icerisinde
   dikilir ve teslimata hazir hale getirilir."
```

---

## Musteri Iletisim Sablonlari

### Siparis Onay (Otomatik E-posta)

Shopify bildirim sablonlarini Turkce olarak duzenle:

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

- [ ] Hatay kargo bolgesi olusturuldu (31000-31999)
- [ ] Duz ucret kargo yontemi eklendi
- [ ] Ucretsiz kargo esigi belirlendi (1000 TL)
- [ ] Magazadan teslim alma ayarlandi
- [ ] Odeme sayfasinda uretim suresi bildirimi var
- [ ] Siparis onay e-postasi Turkce'ye cevirildi
- [ ] Turkiye geneli kargo planlandiginda yeni bolge eklendi
