# Frontend Yapilandirmasi

Bu dokuman site on yuzunun teknik yapilandirmasini kapsar: header, navigasyon, hero bolumu, footer, WhatsApp butonu ve ozel CSS.

---

## 1. Header (Astra Header Builder)

### Ust Cubuk (Above Header)
Duyuru cubugu, #F8F8F8 arka plan, ortalanmis metin:

```
Kendi Atölyemizde Özel Dikim | Hatay İçi Ücretsiz Kargo (1.000 TL+) | WhatsApp: 0541 428 80 05
```

### Ana Header (Primary Header)
- **Sol:** Logo SVG (docs/brand/assets/logo/inanc-tekstil-logo.svg, maks 200px genis)
- **Orta:** FiboSearch arama cubugu (maks 600px)
- **Sag:** Hesap ikonu + WooCommerce sepet ikonu (badge ile)

### Alt Header (Below Header)
- Arka plan: #1B2A4A (Navy)
- Menu yazilar: #FFFFFF
- Navigasyon menusu: `Ana Menu` (ID 20)

### Sticky Header
Desktop ve mobilde etkin.

### Mobil Header
- Logo + arama + sepet + hamburger menu
- Hamburger menu `Ana Menu`yu acar (off-canvas)

---

## 2. Navigasyon Menusu

### ONEMLI KURAL
Navigasyon cubugu YALNIZCA urun kategori butonlarini icerir:

```
Tul Perdeler | Fon Perdeler | Blackout Perdeler | Saten
```

Ana Sayfa, Urunler, Hakkimizda, Iletisim **ASLA** navigasyon menusune EKLENMEZ. Bu sayfalar yalnizca footer "Hizli Linkler" bolumunde yer alir.

### Aktif Sayfa Gostergesi
Aktif kategori sayfasinda ilgili menu ogesi vurgulanir:
- Yazi rengi: #FFFFFF
- Alt kenarlık: 4px solid #FFFFFF

Bu, `inanc-site-features` eklentisindeki JS ile saglanir (`isf-active-nav` class'i eklenir). WordPress custom link menu ogeleri taxonomy sayfalarinda `current-menu-item` class'i almadigi icin JS gereklidir.

---

## 3. Hero Bolumu (Ana Sayfa)

Smart Slider 3 yerine ozel HTML/CSS hero bolumu kullanilir (Smart Slider DB-inserted slaytlari gecerli degildi).

### HTML Yapisi
```html
<div class="inanc-hero">
  <h1>30 Yildir Iskenderun'un Perde Uzmani</h1>
  <p>Olcunuze ozel dikim perde — kendi atolyemizde, kendi elimizle dikiyoruz.</p>
  <a href="/shop/" class="inanc-hero-btn">Urunleri Inceleyin</a>
  <a href="/hakkimizda/" class="inanc-hero-btn outline">Hikayemiz</a>
</div>
```

### CSS
- Arka plan: `linear-gradient(135deg, #1B2A4A 0%, #2A3D5F 100%)`
- Tam genislik: `width: 100vw; max-width: none; margin: 0 calc(-50vw + 50%)`
- Baslik: Playfair Display, 42px, #FFFFFF (mobilde 28px)
- Alt yazi: Inter, 18px, #C5CDD8
- Butonlar: 14px 36px padding, 4px border-radius
  - Dolu buton: beyaz arka plan, #1B2A4A yazi
  - Outline buton: seffaf arka plan, 2px beyaz kenarlık

---

## 4. Ana Sayfa Bolumleri

Hero'dan sonra sirasiyla:

1. **Perde Koleksiyonumuz** (h2, padding-top: 48px)
2. **Kategori Kartlari** (.inanc-categories): 4 kolon, beyaz arka plan, #E5E5E5 kenarlık, hover efekti
3. **Neden Inanc Tekstil?** (.inanc-trust-badges): 4 trust badge (30 Yillik Tecrube, Kendi Atolyemizde Imalat, Olcuye Ozel Dikim, 1000 TL Uzeri Ucretsiz Kargo)
4. **Hikayemiz** (.inanc-about-teaser): #F8F8F8 arka plan, "Hikayemizi Okuyun" butonu
5. **One Cikan Urunler**: `[products limit="8" columns="4"]` shortcode
6. **Tum Urunleri Gor**: /shop/ linkli buton

---

## 5. Footer (Astra Footer Builder)

### Ust Footer (Primary Footer) — 4 Kolon
Astra Free sinirlamasi nedeniyle html-1, html-2, widget-1, widget-2 kullanilir (html-3+ desteklenmez).

| Kolon | Bicari | Icerik |
|-------|--------|--------|
| 1 (html-1) | Inanc Tekstil | Marka adi + "Iskenderun'da 30 yildir olcuye ozel perde dikimi" |
| 2 (html-2) | Hizli Linkler | Ana Sayfa, Urunler, Hakkimizda, Iletisim |
| 3 (widget-1) | Musteri Hizmetleri | Iade Politikasi, KVKK/Gizlilik, Mesafeli Satis Sozlesmesi, Cerez Politikasi |
| 4 (widget-2) | Iletisim | Iskenderun Hatay, 0541 428 80 05, WhatsApp, Pzt-Cmt 09:00-19:00 |

### Alt Footer (Below Footer)
Ortalanmis copyright + inline SVG odeme ikonlari:

```
© [current_year] Inanc Tekstil — Tum haklari saklidir. [Visa SVG] [Mastercard SVG] [Troy SVG]
```

SVG dosyalari: `/wp-content/uploads/2026/03/visa.svg`, `mastercard.svg`, `troy.svg`

### Stil
- Arka plan: #1B2A4A (Navy)
- Basliklar: #FFFFFF, Inter, 16px, 700, uppercase
- Metin/Linkler: #C5CDD8
- Link hover: #FFFFFF

---

## 6. WhatsApp Butonu

Join.chat (creame-whatsapp-me) eklentisi devre disi birakildi. Yerine `inanc-site-features` eklentisinde ozel WhatsApp butonu kullanilir.

### Yapilandirma
- **Numara:** 905414288005
- **Varsayilan mesaj:** "Merhaba, perde siparisi hakkinda bilgi almak istiyorum."
- **Konum:** Sabit, sag alt (bottom: 24px, right: 24px)
- **Stil:** Yesil (#25D366), yuvarlak, SVG ikon + "Bize Yazin" metni
- **Mobil:** Sadece ikon (metin gizlenir), border-radius: 50%

---

## 7. Urun Sayfasi Trust Sinyalleri

`inanc-site-features` eklentisi ile urun detay sayfasina eklenir (woocommerce_single_product_summary hook, priority 35):

| Ikon | Metin |
|------|-------|
| ✂️ | Kendi Atölyemizde Dikilir |
| 📦 | 5-7 İş Günü Teslimat |
| 🔄 | İade Politikası (link) |
| 💬 | WhatsApp Destek (link) |

---

## 8. SEO Meta Aciklamalari

`inanc-site-features` eklentisi, SEO eklentisi yoksa temel meta description'lar ekler:

- Ana Sayfa: "30 yildir Iskenderun'da hizmet veren Inanc Tekstil..."
- Hakkimizda, Iletisim, kategori sayfalari icin ayri aciklamalar

---

## 9. Ozel CSS (WordPress Customizer Additional CSS)

Tum ozel stiller `tmp/custom-styles.css` dosyasinda yerel olarak tutulur ve WordPress Customizer Additional CSS'e deploy edilir:

```bash
# Deploy komutu
scp -i ~/.ssh/inanctekstil tmp/custom-styles.css root@5.75.165.158:/tmp/
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 'docker cp /tmp/custom-styles.css wordpress:/tmp/ && docker exec wordpress wp eval "wp_update_custom_css_post(file_get_contents(\"/tmp/custom-styles.css\"));" --allow-root'
```

### CSS Bolumleri
- Hero bolumu (.inanc-hero)
- Bolum basliklari (padding-top)
- Kategori kartlari (.inanc-categories)
- Trust badge'lari (.inanc-trust-badges)
- Hakkimizda teaser (.inanc-about-teaser)
- WooCommerce butonlari (marka renkleri)
- Magaza/urun sayfasi fiyat stili
- Sepet ve odeme butonlari
- Header arama cubugu
- Footer stili (renk, hizalama, odeme ikonlari)
- Aktif navigasyon ogesi (.isf-active-nav)
- Responsive kurallar (768px breakpoint)

---

## 10. Eklenti: inanc-site-features

Ozel eklenti, bind mount ile sunucuya baglanir:

```
Yerel: plugin/inanc-site-features/
Sunucu: /opt/inanc-site-features/ -> container /var/www/html/wp-content/plugins/inanc-site-features/
```

### Deploy
```bash
scp -i ~/.ssh/inanctekstil plugin/inanc-site-features/inanc-site-features.php root@5.75.165.158:/opt/inanc-site-features/
```

### Ozellikler
1. WhatsApp floating butonu (wp_footer hook)
2. Urun sayfasi trust sinyalleri (woocommerce_single_product_summary hook)
3. SEO meta description'lari (wp_head hook)
4. Aktif navigasyon vurgulama JS (wp_footer hook)

---

## 11. Teknik Notlar

- **DB tablo on eki:** `inct_` (varsayilan `wp_` degil)
- **Veritabani adi:** `inanctekstil_db`
- **MariaDB istemcisi:** `mariadb` binary (MySQL degil)
- **wp db query:** WordPress konteynerinde mysql istemcisi yok, MariaDB konteynerini kullan
- **Astra Free sinirlamalari:** Footer'da html-1/html-2 + widget-1/widget-2 desteklenir (html-3+ yalnizca Pro)
- **WooCommerce adres formati:** TR:31 (Turkiye, Hatay ili), posta kodu 31200
