# E-posta Yapilandirmasi

Bu dokuman iki ayri e-posta sisteminin kurulumunu kapsar:

1. **Google Workspace Starter** -- Kurumsal e-posta (`info@inanctekstil.store`) icin. Musteri iletisimi, alinan e-postalar, manuel gonderim.
2. **Resend** -- Transactional e-postalar icin (siparis onaylari, kargo bildirimleri, sifre sifirlama vb.). WP Mail SMTP eklentisi uzerinden WordPress/WooCommerce ile entegre.

---

## 1. Google Workspace Starter Kurulumu

### 1.1 Google Workspace Hesabi Olusturma

1. [Google Workspace](https://workspace.google.com/pricing) sayfasina git
2. **Starter** planini sec ($7/kullanici/ay)
3. Kayit bilgilerini gir:
   - **Business name:** Inanc Tekstil
   - **Number of employees:** Just you
   - **Country:** Turkey
   - **Current email:** Kisisel e-posta adresini gir (dogrulama icin)
   - **Domain:** `inanctekstil.store` -- "I have a domain" sec
4. Ilk kullanici hesabini olustur:
   - **First name:** (Ad)
   - **Last name:** (Soyad)
   - **Username:** `info` (bu `info@inanctekstil.store` olacak)
   - **Password:** Guclu bir sifre sec

### 1.2 Domain Dogrulama

Google Workspace, domain'in sana ait oldugunu dogrulamak isteyecek. En kolay yontem TXT kaydi:

1. Google Admin Console'da domain dogrulama sayfasina git
2. Verilen TXT kaydini DNS'e ekle (bkz. [dns-configuration.md](dns-configuration.md))
3. Google'da **Verify** butonuna tikla

### 1.3 MX Kayitlarini Ekleme

Google Admin Console seni MX kayitlarini eklemeye yonlendirecek. Butun MX kayitlarini [dns-configuration.md](dns-configuration.md) dosyasindaki tabloya gore ekle.

### 1.4 DKIM Aktivasyonu

1. Google Admin Console > **Apps > Google Workspace > Gmail > Authenticate email**
2. `inanctekstil.store` domainini sec
3. **Generate new record** > DKIM key uzunlugu: **2048** > Prefix: **google**
4. Verilen TXT kaydini DNS'e ekle
5. DNS propagasyonunu bekle (genellikle 5-30 dakika)
6. **Start authentication** butonuna tikla

### 1.5 Gmail Ayarlari

Google Workspace'e giris yap: `https://mail.google.com` (info@inanctekstil.store ile)

**Imza ayari:**

```
--
Inanc Tekstil
Ev Tekstili & Dekorasyon
Iskenderun, Hatay
Tel: +90 XXX XXX XX XX
Web: https://inanctekstil.store
```

**Ek oneriler:**
- **Vacation responder** (tatil yaniti) sablonu hazirla
- **Send mail as** ayarinda display name'i `Inanc Tekstil` olarak ayarla
- **Labels** ile musteri mesajlarini kategorize et (Siparis, Iade, Genel Bilgi vb.)

### 1.6 Ek Alias Adresleri (Opsiyonel)

Google Workspace'te alias olusturarak birden fazla adresi tek hesaba yonlendirebilirsin:

- `info@inanctekstil.store` -- Ana adres
- `siparis@inanctekstil.store` -- Siparis bildirimleri
- `destek@inanctekstil.store` -- Musteri destegi
- `dmarc-reports@inanctekstil.store` -- DMARC raporlari

Google Admin Console > **Directory > Users > info > Account > Aliases > Add** ile alias ekle.

---

## 2. Resend Hesabi Kurulumu

### 2.1 Resend Kayit

1. [Resend](https://resend.com) sayfasina git
2. Hesap olustur (GitHub ile giris yapabilirsin)
3. Ucretsiz plan: 3000 e-posta/ay, 100 e-posta/gun -- Baslangic icin yeterli

### 2.2 Domain Ekleme

1. Resend Dashboard > **Domains > Add Domain**
2. Domain: `inanctekstil.store`
3. Region: `US East (N. Virginia)` -- Varsayilan, degistirmeye gerek yok
4. Resend sana DNS kayitlari verecek:
   - 3 adet DKIM CNAME kaydi
   - 1 adet SPF bilgisi (zaten birlesik SPF kaydinda `include:send.resend.com` olarak ekledik)
   - 1 adet MX kaydi (bounces subdomain icin)
5. Tum DNS kayitlarini ekle (bkz. [dns-configuration.md](dns-configuration.md))
6. Resend Dashboard'da **Verify DNS Records** butonuna tikla

### 2.3 API Key Olusturma

1. Resend Dashboard > **API Keys > Create API Key**
2. Ayarlar:
   - **Name:** `wp-mail-smtp-prod`
   - **Permission:** `Sending access`
   - **Domain:** `inanctekstil.store`
3. Olusturulan API key'i **hemen kopyala ve guvenli bir yerde sakla** -- tekrar goruntuleyemezsin
   - Format: `re_XXXXXXXXXX`

> **Guvenlik:** API key'i asla git reposuna commit etme, WordPress veritabaninda sifrelenmis olarak saklanacak (WP Mail SMTP bunu yapar).

---

## 3. WP Mail SMTP Eklentisi Yapilandirmasi

### 3.1 Eklenti Kurulumu

WordPress Admin > **Plugins > Add New**

`WP Mail SMTP by WPForms` eklentisini ara ve kur. Bu eklentinin ucretsiz surumu Resend destegiyle birlikte gelir.

Alternatif olarak wp-cli ile (Docker uzerinden):

```bash
cd /opt/inanctekstil
docker compose exec wordpress wp plugin install wp-mail-smtp --activate --allow-root
```

### 3.2 WP Mail SMTP Yapilandirmasi

WordPress Admin > **WP Mail SMTP > Settings**

**General Settings:**

| Ayar | Deger |
|---|---|
| From Email | `bildirim@inanctekstil.store` |
| Force From Email | Isaretli |
| From Name | `Inanc Tekstil` |
| Force From Name | Isaretli |
| Mailer | `Other SMTP` |

**Other SMTP Ayarlari:**

| Ayar | Deger |
|---|---|
| SMTP Host | `smtp.resend.com` |
| Encryption | `TLS` |
| SMTP Port | `587` |
| Auto TLS | ON |
| Authentication | ON |
| SMTP Username | `resend` |
| SMTP Password | `re_XXXXXXXXXX` (Resend API key) |

> **Alternatif: wp-config.php ile yapilandirma (Daha Guvenli)**
>
> SMTP bilgilerini WordPress veritabanindan degil, `wp-config.php` dosyasindan okumak daha guvenlidir. Bu yontem credential'larin veritabani dump'larinda gorunmesini onler.

WordPress konteynerinde `/var/www/html/wp-config.php` dosyasini duzenle:

```bash
cd /opt/inanctekstil
docker compose exec wordpress bash
```

`/var/www/html/wp-config.php` dosyasina ekle (`/* That's all, stop editing! */` satirindan once):

```php
// WP Mail SMTP - Resend SMTP Ayarlari
define( 'WPMS_ON', true );
define( 'WPMS_MAILER', 'smtp' );
define( 'WPMS_SMTP_HOST', 'smtp.resend.com' );
define( 'WPMS_SMTP_PORT', 587 );
define( 'WPMS_SSL', 'tls' );
define( 'WPMS_SMTP_AUTH', true );
define( 'WPMS_SMTP_USER', 'resend' );
define( 'WPMS_SMTP_PASS', 're_XXXXXXXXXX' );
define( 'WPMS_MAIL_FROM', 'bildirim@inanctekstil.store' );
define( 'WPMS_MAIL_FROM_FORCE', true );
define( 'WPMS_MAIL_FROM_NAME', 'Inanc Tekstil' );
define( 'WPMS_MAIL_FROM_NAME_FORCE', true );
```

wp-config.php dosya izinlerini kilitle:

```bash
# Docker konteyner icinde
docker compose exec wordpress chmod 600 /var/www/html/wp-config.php
docker compose exec wordpress chown www-data:www-data /var/www/html/wp-config.php
```

> **Not:** Docker ortaminda WordPress dosyalari konteyner icinde `/var/www/html/` konumundadir. wp-content dizini Docker volume olarak yonetilir. Dosya izinleri konteyner icindeki www-data (UID 33) kullanicisi uzerinden ayarlanir.

### 3.3 From Email Adresi Hakkinda Not

- **From Email** olarak `bildirim@inanctekstil.store` kullanmak iyi bir pratiktir.
- Bu adresin gercek bir posta kutusu olmasi gerekmez, cunku transactional e-postalardir ve yanit beklenmez.
- Ancak musterilerin yanit verebilmesi icin WooCommerce ayarlarinda **Reply-To** adresi olarak `info@inanctekstil.store` (Google Workspace) ayarla.

---

## 4. WooCommerce E-posta Ayarlari

WordPress Admin > **WooCommerce > Settings > Emails**

### 4.1 Genel E-posta Ayarlari

| Ayar | Deger |
|---|---|
| "From" name | `Inanc Tekstil` |
| "From" address | `bildirim@inanctekstil.store` |
| Header image | Magaza logosunun URL'si |
| Footer text | `Inanc Tekstil - Iskenderun, Hatay` |
| Base color | Marka renginiz (ornegin `#2C3E50`) |

### 4.2 E-posta Sablonlari

WooCommerce varsayilan e-posta sablonlari:

| E-posta | Alici | Aciklama |
|---|---|---|
| New order | Admin (info@) | Yeni siparis bildirimi |
| Cancelled order | Admin (info@) | Iptal edilen siparis |
| Failed order | Admin (info@) | Basarisiz siparis |
| Order on-hold | Musteri | Siparis beklemede |
| Processing order | Musteri | Siparis isleniyor |
| Completed order | Musteri | Siparis tamamlandi |
| Refunded order | Musteri | Iade yapildi |
| Customer invoice | Musteri | Fatura |
| Customer note | Musteri | Siparis notu |
| Reset password | Musteri | Sifre sifirlama |
| New account | Musteri | Yeni hesap olusturuldu |

Her sablonu ozellestirebilirsin: **WooCommerce > Settings > Emails > [Sablon] > Manage**

---

## 5. E-posta Testi

### 5.1 WP Mail SMTP Test E-postasi

WordPress Admin > **WP Mail SMTP > Tools > Email Test**

1. **Send To** alanina kisisel e-posta adresini gir
2. **Send Email** butonuna tikla
3. Basarili sonuc mesaji gormelisin
4. E-postanin inbox'a (spam degil) dusup dusmedigini kontrol et

### 5.2 WooCommerce Test Siparisi

1. Musteriye gorunen e-postalari test etmek icin test bir siparis olustur
2. **WooCommerce > Settings > Payments > Cash on delivery** (Kapida odeme) aktif et (test icin)
3. Siteye musteri olarak girip bir test siparisi ver
4. Siparis onay e-postasinin geldigini dogrula

### 5.3 Deliverability Testi

1. [Mail Tester](https://www.mail-tester.com/) sitesine git
2. Verilen e-posta adresine WordPress'ten test e-postasi gonder
3. Hedef skor: **9/10 veya ustu**

Dusuk skor alirsan kontrol et:
- SPF kaydinin dogru oldugunu (`dig +short inanctekstil.store TXT | grep spf`)
- DKIM'in aktif oldugunu
- DMARC kaydinin var oldugunu
- Sunucunun IP'sinin kara listede olmadugini ([MXToolbox Blacklist Check](https://mxtoolbox.com/blacklists.aspx))

### 5.4 E-posta Basliklarini Kontrol Etme

Gelen test e-postasinin basliklarini incele (Gmail'de "Show original" ile):

Beklenen basliklar:

```
From: Inanc Tekstil <bildirim@inanctekstil.store>
Reply-To: info@inanctekstil.store
Authentication-Results:
  spf=pass
  dkim=pass
  dmarc=pass
```

Uc "pass" goruyorsan e-posta altyapin dogru yapilandirilmis demektir.

---

## 6. Resend Ucretsiz Plan Limitleri ve Izleme

### Limitler

| Metrik | Limit |
|---|---|
| Aylik e-posta | 3.000 |
| Gunluk e-posta | 100 |
| Ozel domain | 1 |

### Izleme

- Resend Dashboard > **Emails** sayfasindan gonderilen e-postalarin durumunu takip et
- Bounce ve complaint oranlarini izle -- yuksek oranlar domain itibarini dusurur
- Aylik 3.000 sinirini asarsan Resend Pro ($20/ay, 50.000 e-posta) planina gecebilirsin

### Webhook Ayari (Opsiyonel)

Resend Dashboard > **Webhooks > Add Webhook**

- **URL:** `https://inanctekstil.store/wp-json/custom/v1/resend-webhook` (ozel endpoint gerektirir)
- **Events:** `email.bounced`, `email.complained`
- Bounce/complaint izleme icin faydalidir ancak baslangicta zorunlu degil

---

## 7. Sorun Giderme

### E-posta gonderilmiyor

1. WP Mail SMTP > Tools > Email Test ile test et
2. Hata mesajini oku
3. Yaygin sorunlar:
   - **Authentication failed:** Resend API key yanlis veya suresi dolmus
   - **Connection timed out:** UFW'de port 587 outbound engelliyor olabilir (genellikle sorun olmaz, UFW varsayilan olarak outbound'a izin verir)
   - **From address not verified:** Resend'de domain dogrulanmamis

### E-postalar spam'e dusuyor

1. SPF, DKIM, DMARC kayitlarini dogrula
2. [Mail Tester](https://www.mail-tester.com/) ile skor kontrol et
3. E-posta iceriginde asiri buyuk harfler, cok fazla link veya spam tetikleyici kelimelerden kacin
4. Sunucu IP'sinin kara listede olup olmadigini kontrol et

### Google Workspace e-postalar alinmiyor

1. MX kayitlarini dogrula: `dig +short inanctekstil.store MX`
2. DNS propagasyonu tamamlanmis mi kontrol et
3. Google Admin Console'da domain durumunu kontrol et

### Docker konteynerinden e-posta gonderilemiyor

WordPress konteyneri icerisinde SMTP baglantisini test et:

```bash
cd /opt/inanctekstil
docker compose exec wordpress bash -c "apt-get update && apt-get install -y telnet && echo 'QUIT' | telnet smtp.resend.com 587"
```

Baglanti basariliysa sorun WordPress/eklenti yapilandirmasindadir. Baglanamiyorsa Docker ag yapilandirmasini kontrol et -- WordPress konteyneri `web` aginda dis dunyaya erisimi olmalidir.
