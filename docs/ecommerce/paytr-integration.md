# Odeme Entegrasyonu

## Aktif Odeme Yontemi: PayTR

PayTR, Turkiye'de yaygin kullanilan bir sanal POS cozumudur. Kredi karti, banka karti ve taksitli odeme destegi sunar.

**Ucretler:**
- Komisyon: %2.49 + 0.29 TL (islem basina)
- Taksitli islemlerde ek komisyon uygulanabilir (taksit sayisina gore degisir)
- Haftalik veya aylik hesap ozeti ile odeme

**Onay Sureci:** Basvuru sonrasi 3-5 is gunu icerisinde hesap aktif edilir.

---

## 1. PayTR Hesabi Olusturma

1. [https://www.paytr.com](https://www.paytr.com) adresine git
2. "Basvuru" veya "Kayit Ol" butonuna tikla
3. Gerekli belgeler:
   - Vergi levhasi
   - Imza sirkuleri veya beyannamesi
   - Kimlik fotokopisi
   - Banka hesap bilgileri (IBAN)
   - Web sitesi adresi (site canli olmali veya demo sayfasi gosterilmeli)
4. Basvuruyu tamamla ve 3-5 is gunu bekle

### Kimlik Bilgileri

Hesap onaylandiktan sonra PayTR Magaza Paneli'ne giris yap:

```
PayTR Panel > Bilgi sayfasi (veya API Entegrasyon Bilgileri)
  Magaza No (Merchant ID): 123456
  Magaza Anahtari (Merchant Key): AbCdEfGhIjKlMn...
  Magaza Gizli Anahtar (Merchant Salt): XyZaBcDeFgHiJk...
```

---

## 2. Shopify Entegrasyonu

PayTR'nin Shopify entegrasyonu icin:

### Secenek A: PayTR Shopify Uygulamasi

PayTR'nin resmi Shopify uygulamasi varsa:

```
Shopify Admin > Ayarlar > Odemeler > Alternatif odeme yontemleri
  PayTR uygulamasini bul ve etkinlestir
  Merchant ID, Key ve Salt bilgilerini gir
```

### Secenek B: Ozel Odeme Entegrasyonu

PayTR'nin Shopify uygulamasi yoksa, Shopify'in "Alternative payment methods" veya "Manual payment methods" uzerinden entegrasyon yapilabilir. PayTR destek ekibiyle iletisime gec.

### Callback URL

Shopify entegrasyonunda PayTR callback URL'si farkli olacaktir:

```
PayTR Panel > Magaza Ayarlari > Bildirim URL
  URL: Shopify uygulamasinin saglayacagi callback URL'si
```

---

## 3. Test (Sandbox) Modu

PayTR sandbox modu, gercek para hareketi olmadan entegrasyonu test etmeni saglar.

### Test Kart Bilgileri

PayTR panelinden guncel test kart bilgilerini al. Genel olarak:

```
Kart Numarasi: 4355 0843 5508 4358 (veya PayTR'nin sundugu test kart)
Son Kullanma: 12/30
CVV: 000
3D Sifre: a
```

**Not:** Test kart bilgileri degisebilir. Her zaman PayTR panelindeki guncel bilgileri kullan.

### Test Kontrol Listesi

- [ ] Basarili odeme: Test karti ile siparis tamamla
- [ ] Basarisiz odeme: Yanlis CVV gir, hata mesaji goruntulenmeli
- [ ] 3D Secure: 3D dogrulama ekrani gorunmeli
- [ ] Taksit: Taksit secenekleri gorunmeli (taksit etkinse)
- [ ] Siparis durumu: Odeme sonrasi Shopify'da siparis durumu guncellenmeli

---

## 4. Taksit Yapilandirmasi

### PayTR Panelinde

```
PayTR Panel > Taksit Ayarlari
  Taksit seceneklerini etkinlestir: Evet
  Desteklenen taksit sayilari: 2, 3, 6, 9, 12
  Minimum taksitli islem tutari: 100 TL
```

### Taksit Maliyeti

- 2-3 taksit: Cogu magaza komisyonsuz sunar
- 6+ taksit: Komisyon genellikle musteriye yansitilir
- Bu stratejiyi PayTR panelinden ayarla

---

## 5. Canli Gecis

Tum testler basariliysa sandbox modunu kapat:

1. PayTR panelinde test modunu devre disi birak
2. Kucuk tutarli (ornegin 1 TL) gercek siparis ver
3. Kontroller:
   - Odeme basarili mi?
   - PayTR panelinde islem gorunuyor mu?
   - Shopify'da siparis durumu dogru guncellendi mi?

---

## 6. Sik Karsilasilan Sorunlar

### "Hash degeri hatali" Hatasi
- Merchant Key, ID veya Salt yanlis girilmis
- Bosluk veya gorunmeyen karakter kopyalanmis olabilir

### Odeme Sonrasi Siparis Guncellenmiyor
- Callback URL yanlis veya erisilemez
- PayTR panelinden bildirim loglarini kontrol et

### 3D Secure Hatalari
- Test modunda PayTR'nin belirttigi 3D sifresini kullan
- Canli modda 3D hatasi bankadan kaynaklanir

### Taksit Secenekleri Gorunmuyor
- PayTR panelinde taksit etkinlestirilmemis olabilir
- Minimum tutar esiginin altindaysan taksit gosterilmez

---

## 7. Alternatif Odeme Yontemleri (Referans)

Gelecekte degerlendirilecek alternatifler:

| Yontem | Aciklama | Not |
|---|---|---|
| Shopify Payments | Shopify'in kendi odeme altyapisi | Turkiye'de sinirli destek |
| iyzico | Turkiye odakli sanal POS | Shopify uygulamasi mevcut |
| Stripe | Uluslararasi odeme altyapisi | Turkiye destegi sinirli |
| Banka Havalesi | Manuel odeme yontemi | Shopify "Manual payments" ile eklenebilir |

### Banka Havalesi Ekleme

```
Shopify Admin > Ayarlar > Odemeler > Manuel odeme yontemleri
  "Banka havalesi/EFT" ekle
  Talimatlar: IBAN ve hesap bilgilerini yaz
```

---

## 8. Guvenlik Kontrol Listesi

- [ ] Merchant Key ve Salt guvenli saklanir
- [ ] SSL sertifikasi aktif (Shopify varsayilan olarak saglar)
- [ ] Test modu canli siteye geciste kapatildi
- [ ] Callback dogrulama aktif
