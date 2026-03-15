# PostHog Analitik Entegrasyonu

Bu dokuman inanctekstil.store icin PostHog analitik altyapisinin kurulumunu, event yapisini ve kullanim rehberini kapsar.

---

## 1. Hesap Bilgileri

| Bilgi | Deger |
|-------|-------|
| Platform | PostHog Cloud (EU) |
| API Host | `https://eu.i.posthog.com` |
| Project API Key | `phc_knhZGJSkRM7w0MmIssVXa7U6QzDiGipYDXu4xwyflQp` |
| Dashboard | [https://eu.posthog.com](https://eu.posthog.com) |
| Veri Lokasyonu | EU (GDPR uyumlu) |
| Plan | Ucretsiz katman (1 milyon olay/ay) |

**Not:** API key herkese acik (public) bir anahtardir — tarayici tarafinda kullanilmak uzeredir. Gizli bilgi degildir.

---

## 2. Entegrasyon Yontemi

PostHog, `inanc-site-features` eklentisi uzerinden WordPress hook'larina eklenir:

| Hook | Priority | Islem |
|------|----------|-------|
| `wp_head` | 5 | PostHog snippet + init (erken yukleme) |
| `wp_footer` | 2 | Giris yapmis musteri kimliklendirme (`posthog.identify`) |
| `wp_footer` | 20 | E-ticaret olaylari + WhatsApp/add-to-cart izleme |

### Init Yapilandirmasi

```javascript
posthog.init('phc_knhZGJSkRM7w0MmIssVXa7U6QzDiGipYDXu4xwyflQp', {
    api_host: 'https://eu.i.posthog.com',
    defaults: '2026-01-30',
    capture_pageview: true,          // Otomatik sayfa goruntulenme
    capture_pageleave: true,         // Sayfadan ayrilma izleme
    capture_performance: {
        web_vitals: true,            // Core Web Vitals
        web_vitals_allowed_metrics: ['CLS', 'FCP', 'INP', 'LCP']
    },
    session_recording: {
        maskAllInputs: true,         // Tum inputlar maskelenir (gizlilik)
        maskTextSelector: '.sensitive'
    },
    persistence: 'localStorage+cookie',  // Capraz oturum izleme
    autocapture: {
        dom_event_allowlist: ['click', 'change', 'submit'],
        element_allowlist: ['button', 'a', 'input']
    },
    enable_heatmaps: true            // Tiklama isi haritalari
})
```

### Yapilandirma Detaylari

| Ozellik | Deger | Aciklama |
|---------|-------|----------|
| Web Vitals | CLS, FCP, INP, LCP | Google Core Web Vitals metrikleri |
| Session Replay | `maskAllInputs: true` | Odeme/adres/telefon alanlari otomatik maskelenir |
| Persistence | `localStorage+cookie` | Oturum arasi daha iyi izleme |
| Autocapture | button, a, input | Yalnizca buton, link ve input olaylari yakalanir |
| Heatmaps | Etkin | Tiklama isi haritalari |

---

## 3. Otomatik Yakalanan Olaylar

PostHog asagidakileri otomatik yakalar:

| Olay | Aciklama |
|------|----------|
| `$pageview` | Her sayfa goruntulemesi |
| `$pageleave` | Sayfadan ayrilma |
| `$autocapture` | Buton/link tiklamalari, form gonderimleri, input degisiklikleri |
| `$rageclick` | Ayni noktaya tekrarlanan hizli tiklamalar (UX sorunu gostergesi) |
| `$web_vitals` | CLS, FCP, INP, LCP performans metrikleri |

### Otomatik Ozellikler (Properties)

Her olayla birlikte:

- `$current_url`, `$referrer` — Sayfa ve kaynak URL
- `$browser`, `$device_type`, `$os` — Cihaz bilgileri
- `$screen_height` / `$screen_width` — Ekran boyutu
- `$geoip_city` / `$geoip_country_code` — Konum (IP bazli)
- UTM parametreleri (`utm_source`, `utm_medium`, `utm_campaign`)

---

## 4. Ozel E-Ticaret Olaylari (Aktif)

Asagidaki olaylar `inanc-site-features` eklentisinde uygulanmistir ve canli sitede aktiftir:

### Sayfa Bazli Olaylar (PHP ile tetiklenir)

| Olay | Tetikleme Kosulu | Ozellikler |
|------|------------------|------------|
| `product_viewed` | `is_product()` | `product_id`, `product_name`, `price`, `currency`, `category` |
| `category_viewed` | `is_product_category()` | `category_name`, `category_slug`, `product_count` |
| `cart_viewed` | `is_cart()` | `cart_total`, `item_count` (MutationObserver ile block cart render sonrasi yakalanir) |
| `checkout_started` | `is_checkout()` (order-received haric) | — |
| `order_completed` | `is_wc_endpoint_url('order-received')` | `order_id`, `order_total`, `currency`, `payment_method`, `item_count`, `items[]` |

### JS ile Tetiklenen Olaylar

| Olay | Tetikleme | Ozellikler |
|------|-----------|------------|
| `whatsapp_click` | WhatsApp butonuna tiklama | `source` (floating_button / trust_signal), `page` |
| `add_to_cart` | WooCommerce `added_to_cart` jQuery olayi | `product_name`, `price`, `page` |

### Olay Uygulama Detaylari

Sayfa bazli olaylar PHP tarafindan WooCommerce kosul fonksiyonlari ile tespit edilir. Urun/siparis verileri `$product` ve `$order` nesnelerinden alinip `wp_json_encode()` ile inline `<script>` olarak sayfaya yazilir.

`cart_viewed` olayi WooCommerce block-based cart kullandigi icin MutationObserver ile cart ogelerinin DOM'a yuklenmesini bekler, ardindan verileri yakalar. Block cart selektorleri: `.wc-block-cart-items__row` (ogeler), `.wc-block-components-totals-footer-item .wc-block-components-totals-item__value` (toplam).

WhatsApp ve add-to-cart olaylari DOMContentLoaded ve jQuery event listener'lari ile client-side yakalanir. `add_to_cart` olayi jQuery `added_to_cart` olayini dinler ve jQuery `.find()` metodu ile urun adi ve fiyati yakalar.

---

## 5. Siparis Tamamlama Izleme (order_completed)

WooCommerce "tesekkur" sayfasinda PHP tarafindan `$order` nesnesinden veriler alinir:

```javascript
// Ornek cikti (PHP tarafindan olusturulur)
posthog.capture('order_completed', {
    order_id: 12345,
    order_total: 1250.00,
    currency: 'TRY',
    payment_method: 'paytr',
    item_count: 2,
    items: [
        { name: 'Krem Tul Perde', quantity: 1, price: 750.00 },
        { name: 'Antrasit Fon Perde', quantity: 1, price: 500.00 }
    ]
})
```

**Onemli:** Siparis verisi sunucu tarafinda (PHP `wc_get_order()`) alinip sayfaya yazilir. JavaScript tarafinda ek API cagrisi yapilmaz.

---

## 6. Kullanici Kimliklendirme (Identify)

### Misafir Ziyaretciler
PostHog otomatik olarak anonim bir `distinct_id` atar. Cerez + localStorage bazlidir.

### Giris Yapmis Musteriler
`wp_footer` hook'unda (priority 2) giris yapmis kullanicilar icin `posthog.identify()` cagirilir:

```javascript
// PHP tarafindan olusturulur
posthog.identify('customer_42', {
    email: 'musteri@example.com',
    name: 'Ali Yilmaz'
})
```

Bu, anonim ve giris yapmis oturumlari birlestirerek musterinin tam yolculugunu gosterir (urun inceleme -> sepet -> satin alma).

**Not:** Misafir kullanicilar icin `identify` cagirilmaz. Yalnizca `is_user_logged_in()` true oldugunda aktiftir.

---

## 7. PostHog Dashboard Onerileri

### Olusturulacak Dashboard'lar

**1. Genel Bakis (Overview)**
- Gunluk/haftalik benzersiz ziyaretci sayisi
- Sayfa goruntulenmeleri (toplam ve benzersiz)
- Cihaz dagilimi (Desktop vs Mobil)
- Referans kaynaklari (Google, Instagram, direkt, vb.)
- En cok ziyaret edilen sayfalar

**2. E-Ticaret Hunisi (Funnel)**
- `$pageview` -> `product_viewed` -> `add_to_cart` -> `checkout_started` -> `order_completed`
- Her adimda kayip orani
- Ortalama donusum suresi

**3. Urun Performansi**
- En cok goruntulenlen urunler (`product_viewed` -> `product_name` breakdown)
- En cok sepete eklenen urunler (`add_to_cart` -> `product_name` breakdown)
- Goruntulenme/sepete ekleme orani
- Kategori bazli performans (`category_viewed` -> `category_name` breakdown)

**4. WhatsApp & Iletisim**
- WhatsApp butonu tiklama sayisi (`whatsapp_click`)
- Hangi sayfalardan tiklaniyor (`page` property breakdown)
- `source` breakdown: `floating_button` vs `trust_signal`

**5. Web Vitals & Performans**
- LCP, FCP, INP, CLS ortalama degerleri
- Cihaz tipine gore performans farklari
- Sayfa bazli performans

### Onerilen Funnel Tanimlari

```
Funnel: Satin Alma Hunisi
Step 1: $pageview (any page)
Step 2: product_viewed
Step 3: add_to_cart
Step 4: checkout_started
Step 5: order_completed
Window: 7 gun
```

```
Funnel: WhatsApp Donusum
Step 1: $pageview
Step 2: product_viewed
Step 3: whatsapp_click
Window: 1 gun
```

---

## 8. Session Replay (Oturum Tekrari)

PostHog Cloud ucretsiz planda aylik 5.000 oturum kaydi saglar.

### Gizlilik Ayarlari (Init'te tanimli)

```javascript
session_recording: {
    maskAllInputs: true,         // Tum input alanlari otomatik maskelenir
    maskTextSelector: '.sensitive' // Ek hassas icerik maskeleme
}
```

- Odeme formu, adres, telefon alanlari otomatik maskelenir
- Ek hassas icerik icin elemente `sensitive` class'i ekle
- PostHog Dashboard'da da global maskeleme ayarlanabilir:
  Project Settings > Session Replay > Privacy > "Mask all inputs" : ON

### Etkinlestirme

1. PostHog Dashboard > Project Settings > Session Replay
2. "Enable Session Replay" sec
3. Sampling rate: %100 (dusuk trafik icin yeterli)

---

## 9. KVKK / Cerez Uyumu

### Cerez Bilgilendirmesi

`docs/legal/cerez-politikasi.md` dosyasina PostHog cerezi eklenmeli:

| Cerez | Saglayici | Amac | Sure |
|-------|-----------|------|------|
| `ph_phc_*` | PostHog | Analitik — ziyaretci kimliklendirme | 1 yil |

### Complianz Entegrasyonu

Sitede Complianz GDPR eklentisi zaten aktif. PostHog'u Complianz ile entegre etmek icin:

1. WP Admin > Complianz > Integrations
2. PostHog'u ekle veya "Statistics" kategorisine ata
3. Kullanici onay vermeden PostHog baslatilmasin:

```javascript
// Gelecekte Complianz entegrasyonu icin:
posthog.init('phc_...', {
    opt_out_capturing_by_default: true
});
// Complianz onay callback'inde:
posthog.opt_in_capturing();
```

**Mevcut durum:** PostHog varsayilan olarak aktif. Complianz entegrasyonu MVP sonrasi yapilandirilacak.

---

## 10. Deploy ve Test

### Deploy

```bash
scp -i ~/.ssh/inanctekstil plugin/inanc-site-features/inanc-site-features.php root@5.75.165.158:/opt/inanc-site-features/
```

### Test Adimlari

1. **Snippet Dogrulama:**
   - Siteyi ziyaret et
   - F12 > Console > `posthog` yaz — PostHog nesnesi gorulmeli
   - `posthog.get_distinct_id()` — anonim ID donmeli

2. **Network Dogrulama:**
   - F12 > Network > `posthog` filtrele
   - `eu-assets.i.posthog.com/static/array.js` — 200
   - `eu.i.posthog.com/e/` — 200 (olay POST'u)

3. **Olay Testi:**
   - Urun sayfasini ac — PostHog Live Events'te `product_viewed` gorulmeli
   - Sepete ekle — `add_to_cart` gorulmeli
   - Sepet sayfasi — `cart_viewed` gorulmeli
   - Odeme sayfasi — `checkout_started` gorulmeli
   - WhatsApp butonu tikla — `whatsapp_click` gorulmeli

4. **Manuel Test:**
   ```javascript
   // Tarayici konsolunda:
   posthog.capture('test_event', { source: 'manual_test' })
   // PostHog Dashboard > Activity > Live Events'te gorulmeli
   ```

5. **Web Vitals:**
   - PostHog Dashboard > Web Analytics > Web Vitals
   - LCP, FCP, INP, CLS degerleri gorulmeli

6. **Session Replay:**
   - Sitede 30+ saniye gezin
   - PostHog Dashboard > Session Replay > Son kayit gorulmeli

---

## 11. Sorun Giderme

### PostHog olaylari gelmiyor

1. **Snippet yuklenmiyor:** Sayfa kaynagini incele (Ctrl+U), `posthog.init` satirini ara
2. **Ad blocker:** uBlock Origin / AdBlock PostHog'u engelleyebilir. Farkli tarayicide dene
3. **Cache:** Redis/tarayici cache temizle. Sunucuda: `docker exec wordpress wp cache flush --allow-root`
4. **CSP header:** Traefik'te Content-Security-Policy header'i varsa `eu.i.posthog.com` ve `eu-assets.i.posthog.com` domainlerini izin ver

### Session Replay calismiyor

1. PostHog Dashboard'da Session Replay etkin mi kontrol et
2. Tarayici konsolunda hata var mi bak
3. Minimum oturum suresi (varsayilan 2 saniye) altinda kalan oturumlar kaydedilmez

### Olaylar gecikmeli gorunuyor

PostHog olaylari batch halinde gonderir (varsayilan 30 sn veya sayfa kapanisinda). Live Events'te 1-2 dakika gecikme normaldir.

### order_completed tetiklenmiyor

1. WooCommerce "tesekkur" sayfasinin URL'sinde `order-received` var mi kontrol et
2. PayTR callback sonrasi redirect dogru mu kontrol et
3. `is_wc_endpoint_url('order-received')` false donuyorsa permalink ayarlarini kontrol et

---

## 12. Gelecek Iyilestirmeler

- [ ] Complianz GDPR eklentisi ile PostHog onay entegrasyonu
- [ ] `search_performed` olayi (FiboSearch entegrasyonu)
- [ ] `calculator_used` olayi (perde hesaplayici icin)
- [ ] Feature flags — A/B test icin (ornegin farkli hero metinleri)
- [ ] Google Ads / Meta Ads UTM parametreleri ile korelasyon analizi
- [ ] Retention analizi — tekrar gelen musteriler
