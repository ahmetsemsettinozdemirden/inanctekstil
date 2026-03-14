# WooCommerce Yapilandirmasi

## WordPress Temel Kurulum

WordPress kurulduktan sonra asagidaki ayarlari yap:

```
Ayarlar > Genel
  Site Dili: Turkce
  Saat Dilimi: UTC+3 (Istanbul)
  Tarih Formati: d/m/Y
  Saat Formati: H:i
```

Permalink yapisini SEO-uyumlu yap:

```
Ayarlar > Kalici Baglantilar > Yazi adi
  /%postname%/
```

---

## WooCommerce Kurulumu

### Temel Ayarlar

```
WooCommerce > Ayarlar > Genel
  Magaza Adresi: Iskenderun, Hatay, Turkiye
  Satis Yapilan Konumlar: "Belirli ulkelere sat" > Turkiye
  Gonderim Yapilan Konumlar: "Belirli ulkelere gonder" > Turkiye
  Para Birimi: Turk Lirasi (TL)
  Para Birimi Konumu: Sag (1.250,00 TL)
  Binlik Ayirici: .
  Ondalik Ayirici: ,
  Ondalik Basamak: 2
```

### Urun Ayarlari

```
WooCommerce > Ayarlar > Urunler
  Agirlik Birimi: kg
  Boyut Birimi: cm
  Yorumlari etkinlestir: Evet (sosyal kanit icin)
  Degerlendirme: Yalnizca "dogrulanmis sahipler" yorum yapabilsin
```

### Hesap ve Gizlilik

```
WooCommerce > Ayarlar > Hesaplar ve Gizlilik
  Misafir odemesine izin ver: Evet
  Odeme sirasinda hesap olusturmayi etkinlestir: Evet
  Hesabim sayfasinda hesap olusturmayi etkinlestir: Evet
```

---

## KDV (Vergi) Ayarlari

Turkiye'de ev tekstili urunleri icin KDV orani %20'dir (2024 itibariyle guncel orani kontrol et).

### Vergiyi Etkinlestirme

```
WooCommerce > Ayarlar > Genel
  [x] Vergileri ve vergi hesaplamasini etkinlestir
```

### Vergi Secenekleri

```
WooCommerce > Ayarlar > Vergi
  Fiyatlar vergi dahil girildi: Evet
  Vergiyi su sekilde hesapla: Magaza taban adresi
  Gonderim vergisi sinifi: Standart
  Fiyat gorunumu: Vergi dahil
  Fiyat gorunum soneki: "KDV dahil" veya bos birak
```

### Vergi Orani Tanimlama

```
WooCommerce > Ayarlar > Vergi > Standart Oranlar

Ulke Kodu | Eyalet | Posta Kodu | Sehir | Oran   | Vergi Adi | Oncelik | Bilesik | Kargo
TR        | *      | *          | *     | 20.0000 | KDV      | 1       | Hayir   | Evet
```

**Not:** Fiyatlari vergi dahil girmek, musteri acisindan daha sade bir deneyim sunar. Urun fiyatlarini girerken dogrudan KDV dahil fiyat gir.

---

## Astra Tema Kurulumu

### Neden Astra?

- Hafif: ~50KB frontend yuklemesi
- WooCommerce ile tam uyumlu
- Starter Templates ile hizli baslangic
- Ucretsiz surum cogu ihtiyaci karsilar

### Kurulum

```
Gorunum > Temalar > Yeni Ekle > "Astra" ara > Yukle > Etkinlestir
```

### Starter Templates Eklentisi

```
Eklentiler > Yeni Ekle > "Starter Templates" ara > Yukle > Etkinlestir
```

Starter Templates'tan WooCommerce uyumlu bir sablon sec. "Flavor" olarak Starter Templates (Starter Templates kendi sayfa olusturucusu) veya Elementor secebilirsin. Basitlik icin varsayilan block editor yeterlidir.

### Astra Ozellestirme

```
Gorunum > Ozellestir > Genel > Tipografi
  Govde fontu: Inter veya system-ui (performans icin)
  Baslik fontu: Ayni veya bir serif font (Playfair Display ev tekstili icin iyi durur)

Gorunum > Ozellestir > Genel > Renkler
  Ana renk: Marka rengi (ornek: koyu lacivert #1a237e veya bordo #800020)
  Baglanti rengi: Ana renkle uyumlu

Gorunum > Ozellestir > Ust Bilgi Olusturucu (Header Builder)
  Logo: SVG veya PNG (maks 200px genislik)
  Menu: Ana sayfa, Urunler, Hakkimizda, Iletisim

Gorunum > Ozellestir > WooCommerce
  Magaza sayfasi: Grid gorunum, satir basina 3 urun
  Tek urun sayfasi: Galeri + ozet + fiyat hesaplama alani
```

### Astra Pro (Opsiyonel)

Ucretsiz surum yeterli olmadigi durumlarda Astra Pro sunlari ekler:
- Gelismis header/footer builder
- WooCommerce icin ek duzen secenekleri
- Mega menu destegi
- Sayfa basina farkli header/footer

Baslangiicta ucretsiz surum yeterli. Ihtiyac duydukca Pro'ya gecis yap.

---

## Zorunlu Eklentiler

### 1. Redis Object Cache

Docker stack'te Redis container zaten calisir. WordPress'e Redis baglantisi icin:

```
Eklentiler > Yeni Ekle > "Redis Object Cache" (by Till Krüss) > Yukle > Etkinlestir
```

wp-config.php'ye asagidaki satirlari ekle (Docker Compose'da environment variable olarak da ayarlanabilir):

```php
define('WP_REDIS_HOST', 'redis');  // Docker service adi
define('WP_REDIS_PORT', 6379);
```

Ardindan:

```
Ayarlar > Redis > "Enable Object Cache" butonuna tikla
Status: "Connected" oldugundan emin ol
```

**WooCommerce uyumu:** Redis Object Cache, WooCommerce oturum verilerini ve gecici verileri (transients) hizlandirir. Sepet ve odeme sayfalari zaten dinamik oldugu icin nesne onbellegi guvenlidir.

Ek olarak sayfa onbellegi icin:

```
Eklentiler > Yeni Ekle > "WP Super Cache" > Yukle > Etkinlestir

WP Super Cache > Ayarlar
  Onbellekleme: Acik
  Bilinen kullanicilar icin sayfalari onbellekleme: Acik (WooCommerce uyumu)
```

### 2. WP Mail SMTP

WordPress'in varsayilan `wp_mail()` fonksiyonu cogu sunucuda guvenilir degildir. SMTP zorunludur, aksi halde siparis bildirimleri gitmez.

```
Eklentiler > Yeni Ekle > "WP Mail SMTP" > Yukle > Etkinlestir

WP Mail SMTP > Ayarlar
  Gonderen E-posta: info@inanctekstil.com (veya domain e-postasi)
  Gonderen Ad: Inanc Tekstil
  E-posta Servisi: "Diger SMTP" veya "Google / Gmail"

  SMTP Sunucusu: smtp.gmail.com (Gmail icin) veya hosting SMTP
  SMTP Portu: 587 (TLS) veya 465 (SSL)
  Sifreleme: TLS
  Kimlik Dogrulama: Acik
  Kullanici Adi: SMTP kullanici adi
  Sifre: SMTP sifresi veya uygulama sifresi
```

Kurulumdan sonra "E-posta Testi" sekmesinden test gonder.

### 3. Complianz (KVKK / Cerez Uyumu)

Turkiye'de KVKK (Kisisel Verilerin Korunmasi Kanunu) gereklilikleri vardir. Complianz cerez bildirimi ve gizlilik politikasi icin kullanilir.

```
Eklentiler > Yeni Ekle > "Complianz" > Yukle > Etkinlestir

Complianz sihirbazini takip et:
  Bolge: Turkiye / Avrupa
  Cerez banner'i: Acik
  Gizlilik politikasi sayfasi: Otomatik olustur veya mevcut sayfayi sec
```

WooCommerce odeme sayfasina KVKK onay kutucugu eklemeyi unutma. Complianz bunu otomatik yapabilir veya su snippet ile manuel ekle:

```php
// functions.php veya ozel eklentiye ekle
add_action('woocommerce_review_order_before_submit', function() {
    woocommerce_form_field('kvkk_consent', [
        'type'     => 'checkbox',
        'class'    => ['form-row kvkk-consent'],
        'label'    => 'Kisisel verilerimin islendigini ve <a href="/gizlilik-politikasi" target="_blank">KVKK Aydinlatma Metni</a>\'ni okudum, kabul ediyorum.',
        'required' => true,
    ]);
});

add_action('woocommerce_checkout_process', function() {
    if (!isset($_POST['kvkk_consent'])) {
        wc_add_notice('KVKK onayini kabul etmeniz gerekmektedir.', 'error');
    }
});
```

### 4. ShortPixel veya Smush (Gorsel Optimizasyonu)

Kumas fotograflari buyuk dosyalar olabilir. Otomatik sikistirma zorunlu.

```
Eklentiler > Yeni Ekle > "ShortPixel" > Yukle > Etkinlestir

ShortPixel > Ayarlar
  API Anahtari: shortpixel.com'dan al (aylik 100 gorsel ucretsiz)
  Sikistirma tipi: Lossy (en iyi boyut/kalite dengesi)
  WebP olustur: Evet
  Mevcut gorselleri toplu optimize et: Evet
```

Alternatif: Imagify veya EWWW Image Optimizer da kullanilabilir.

### 5. Site Kit by Google

Analytics, Search Console ve PageSpeed Insights'i tek yerden yonet.

```
Eklentiler > Yeni Ekle > "Site Kit by Google" > Yukle > Etkinlestir

Site Kit > Baslangic sihirbazi
  Google Analytics 4: Bagla
  Google Search Console: Bagla
  PageSpeed Insights: Bagla
```

Google Analytics'te e-ticaret izlemeyi etkinlestir:

```
Site Kit > Ayarlar > Analytics
  Gelismis e-ticaret izleme: Acik
```

---

## Ek Onerilecek Eklentiler

| Eklenti | Amac | Oncelik |
|---|---|---|
| Wordfence veya Sucuri | Guvenlik, WAF, brute-force korumasi | Yuksek |
| UpdraftPlus | Otomatik yedekleme (gunluk) | Yuksek |
| Rank Math SEO | SEO meta, sitemap, schema markup | Orta |
| WooCommerce PDF Invoices | Fatura PDF olusturma (e-fatura degil) | Orta |

---

## Performans Kontrol Listesi

- [ ] Redis Object Cache aktif ve "Connected" durumda
- [ ] Gorseller optimize edilmis (WebP formatinda sunuluyor)
- [ ] Kullanilmayan eklentiler kaldirilmis
- [ ] PHP surumu 8.1+ (sunucu ayari)
- [ ] Veritabani duzenli optimize ediliyor (WP-Optimize ile)
- [ ] CDN aktif (Cloudflare ucretsiz plan yeterli)
- [ ] PageSpeed skoru mobilde 70+, masaustunde 90+
