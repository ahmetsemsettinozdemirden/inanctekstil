# PayTR Odeme Entegrasyonu

## Genel Bakis

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

### Kimlik Bilgilerini Alma

Hesap onaylandiktan sonra PayTR Magaza Paneli'ne giris yap:

```
PayTR Panel > Bilgi sayfasi (veya API Entegrasyon Bilgileri)
  Magaza No (Merchant ID): 123456
  Magaza Anahtari (Merchant Key): AbCdEfGhIjKlMn...
  Magaza Gizli Anahtar (Merchant Salt): XyZaBcDeFgHiJk...
```

**Bu bilgileri guvenli bir yerde sakla.** `.env` dosyasi veya WordPress'in `wp-config.php` dosyasinda sabit olarak tanimla:

```php
// wp-config.php -- DB sabitleri yakininda ekle
define('PAYTR_MERCHANT_ID', '123456');
define('PAYTR_MERCHANT_KEY', 'AbCdEfGhIjKlMn...');
define('PAYTR_MERCHANT_SALT', 'XyZaBcDeFgHiJk...');
```

**Dikkat:** Bu bilgileri Git'e commit etme. `wp-config.php` zaten `.gitignore` icinde olmali.

---

## 2. WooCommerce Eklentisini Kurma

PayTR'nin resmi WooCommerce eklentisi vardir.

### Indirme ve Kurulum

1. PayTR Magaza Paneli > Entegrasyon > WooCommerce bolumune git
2. En guncel eklenti ZIP dosyasini indir
3. WordPress Admin > Eklentiler > Yeni Ekle > Eklenti Yukle > ZIP sec > Yukle > Etkinlestir

### Ayarlar

```
WooCommerce > Ayarlar > Odemeler > PayTR

  Etkinlestir: Evet
  Baslik: "Kredi Karti / Banka Karti ile Ode"
  Aciklama: "Kredi karti veya banka kartiniz ile guvenli odeme yapin."

  Magaza No: wp-config.php'den al veya dogrudan gir
  Magaza Anahtari: wp-config.php'den al veya dogrudan gir
  Magaza Gizli Anahtar: wp-config.php'den al veya dogrudan gir

  Test Modu: Evet (baslangiicta)
  Odeme Tipi: iFrame (sayfa icerisinde) veya Yonlendirme
  Dil: Turkce
```

Eklenti `wp-config.php` sabitlerini destekliyorsa (resmi eklentinin surumine baglidir), ayar alanlarini bos birakip sabitlerden okutabilirsin. Desteklemiyorsa, ayar ekranina dogrudan gir.

---

## 3. Sandbox (Test) Modu

PayTR sandbox modu, gercek para hareketi olmadan entegrasyonu test etmeni saglar.

### Sandbox'i Etkinlestirme

```
WooCommerce > Ayarlar > Odemeler > PayTR
  Test Modu: Evet
```

### Test Kart Bilgileri

PayTR panelinden guncel test kart bilgilerini al. Genel olarak:

```
Kart Numarasi: 4355 0843 5508 4358 (veya PayTR'nin sundugu test kart)
Son Kullanma: 12/30
CVV: 000
3D Sifre: a]
```

**Not:** Test kart bilgileri degisebilir. Her zaman PayTR panelindeki guncel bilgileri kullan.

### Test Kontrol Listesi

- [ ] Basarili odeme: Test karti ile siparis tamamla, WooCommerce'te siparis durumu "Isleniyor" olmali
- [ ] Basarisiz odeme: Yanlis CVV gir, hata mesaji goruntulenmeli
- [ ] 3D Secure: 3D dogrulama ekrani gorunmeli ve tamamlanmali
- [ ] Callback: Odeme sonrasi WooCommerce siparis durumu otomatik guncellenmeli
- [ ] E-posta: Siparis onay e-postasi gitmeli (WP Mail SMTP'nin calistigini dogrula)
- [ ] Taksit: Taksit secenekleri gorunmeli (taksit etkinse)

---

## 4. Production (Canli) Gecis

Tum testler basariliysa:

```
WooCommerce > Ayarlar > Odemeler > PayTR
  Test Modu: Hayir
```

Canli modda kucuk tutarli (ornegin 1 TL) gercek bir siparis ver ve kontrol et:
1. Odeme basarili mi?
2. PayTR panelinde islem gorunuyor mu?
3. WooCommerce'te siparis durumu dogru guncellendi mi?
4. Musteri ve magaza e-postalari gitti mi?

---

## 5. Taksit (Installment) Yapilandirmasi

Taksit, Turkiye'de yaygin kullanilan bir odeme yontemidir. PayTR panelinden taksit seceneklerini yapilandir.

### PayTR Panelinde Taksit Ayarlari

```
PayTR Panel > Taksit Ayarlari

  Taksit seceneklerini etkinlestir: Evet
  Desteklenen taksit sayilari: 2, 3, 6, 9, 12 (ihtiyaca gore)
  Minimum taksitli islem tutari: 100 TL (veya istedigin tutar)
```

Her banka icin farkli taksit oranlari olabilir. PayTR panelinden banka bazinda taksit oranlarini gor ve ayarla.

### WooCommerce Tarafinda

PayTR WooCommerce eklentisi genellikle taksit seceneklerini otomatik olarak odeme formuna yansitir. Eklenti ayarlarinda:

```
WooCommerce > Ayarlar > Odemeler > PayTR
  Taksit Goster: Evet
  Taksit Tablosu Goster: Evet (odeme sayfasinda taksit tablosu)
```

### Taksit Maliyeti

Taksitli islemlerde PayTR ek komisyon alir. Bu maliyet:
- Sana yansitilir (musteri ayni tutari oder, sen daha az alirsin)
- VEYA musteriye yansitilabilir (taksitli fiyat daha yuksek gosterilir)

Piyasa pratigin: Cogu magaza 2-3 taksiti komisyonsuz sunar, 6+ taksitte komisyonu musteriye yansitiyor. Bu stratejiyi PayTR panelinden ayarla.

---

## 6. Callback / Webhook Yapilandirmasi

PayTR, odeme sonucunu sunucuna bildirimde bulunarak (callback/webhook) iletir. Bu, siparis durumunun otomatik guncellenmesi icin kritiktir.

### Callback URL

PayTR eklentisi callback URL'yi otomatik olarak ayarlar. Genellikle:

```
https://inanctekstil.store/?wc-api=paytr_callback
```

veya

```
https://inanctekstil.store/paytr-callback
```

(Eklenti surumune gore degisir.)

### PayTR Panelinde Ayar

```
PayTR Panel > Magaza Ayarlari > Bildirim URL
  URL: https://inanctekstil.store/?wc-api=paytr_callback
```

### Callback Dogrulama

PayTR callback'i sunucudan sunucuya (server-to-server) gonderir. Callback icerigi hash ile dogrulanir. Eklenti bunu otomatik yapar, ama sorun giderme icin sureic:

1. PayTR, POST istegi ile siparis bilgilerini gonderir
2. Eklenti `merchant_key` ve `merchant_salt` ile hash dogrular
3. Dogruysa siparis durumunu gunceller:
   - Basarili odeme -> "Isleniyor" (processing)
   - Basarisiz odeme -> "Basarisiz" (failed)
4. PayTR'ye "OK" yaniti doner

### Callback Sorunlari

Callback calismiyorsa kontrol et:

1. **SSL:** Site HTTPS olmali. PayTR callback'i HTTP'ye gondermiyor olabilir.
2. **Firewall:** Sunucu guvenlik duvari PayTR IP'lerini engellemiyor olmali. PayTR'den guncel IP listesini al ve whitelist'e ekle.
3. **WordPress cron:** `wp-cron.php` calisabilir durumda olmali.
4. **PHP hata loglari:** `/wp-content/debug.log` dosyasini kontrol et (WP_DEBUG aciksa).

Test etmek icin:

```php
// wp-config.php'ye ekle (gecici olarak, sorun giderme icin)
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false); // Hatalari ekranda gosterme
```

PayTR panelinde "Bildirim Loglari" bolumunden callback durumlarini izle.

---

## 7. Sik Karsilasilan Sorunlar

### "Hash degeri hatali" Hatasi

- Merchant Key, Merchant ID veya Merchant Salt yanlis girilmis.
- Bosluk veya gorsel olmayan karakter kopyalanmis olabilir. PayTR panelinden tekrar kopyala.
- `wp-config.php` sabitlerinde tirnak isareti sorunu olabilir (akilli tirnak vs duz tirnak).

### Odeme Sonrasi Siparis "Beklemede" Kaliyor

- Callback URL yanlis veya erisilemez durumda.
- SSL sertifikasi gecersiz (Let's Encrypt yenilenmemis olabilir).
- Sunucu PayTR'nin POST istegini engelliyor (ModSecurity, Cloudflare kurallari, vb.).

### 3D Secure Hatalari

- Test modunda 3D sifre olarak PayTR'nin belirttigi degeri kullan.
- Canli modda 3D hatasi bankadan kaynaklanir, musteriye "Bankanizla iletisime gecin" mesaji goster.

### iFrame Gorunmuyor

- Baska bir eklenti (guvenlik eklentisi, onbellek eklentisi) iFrame'i engelliyor olabilir.
- Tarayici konsol hatalarini kontrol et (F12 > Console).
- `X-Frame-Options` veya `Content-Security-Policy` header'larini kontrol et.

### Taksit Secenekleri Gorunmuyor

- PayTR panelinde taksit etkinlestirilmemis olabilir.
- Minimum tutar esiginin altindaysan taksit gosterilmez.
- Eklenti ayarlarinda "Taksit Goster" secenegini kontrol et.

---

## 8. Guvenlik Kontrol Listesi

- [ ] Merchant Key ve Salt `wp-config.php` icinde, veritabaninda degil
- [ ] `wp-config.php` dosyasi Git'e dahil degil
- [ ] SSL sertifikasi aktif ve gecerli
- [ ] PayTR callback URL'si HTTPS
- [ ] Test modu canli siteye geciste kapatildi
- [ ] Callback hash dogrulamasi aktif (eklenti varsayilan olarak yapar)
- [ ] WP_DEBUG canli sitede kapali (veya sadece log'a yaziyor, ekranda gostermiyor)
