# PostHog Analitik Entegrasyonu (Referans)

**Durum:** Henuz aktif degil. Bu dokuman gelecekte PostHog entegrasyonu yapildiginda referans olarak kullanilacaktir.

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

**Not:** API key herkese acik (public) bir anahtardir. Gizli bilgi degildir.

---

## 2. Shopify Entegrasyon Yontemi

PostHog Shopify'a su yontemlerle entegre edilebilir:

### Secenek A: Shopify Custom Pixel

```
Shopify Admin > Ayarlar > Musteri olaylari > Ozel pikseller
  Piksel adi: PostHog
  Piksel kodu: PostHog init snippet'i
```

### Secenek B: Tema Koduna Ekleme

```
Shopify Admin > Online Magaza > Temalar > Kod Duzenle
  Layout > theme.liquid > <head> icine PostHog snippet ekle
```

### Init Yapilandirmasi

```javascript
posthog.init('phc_knhZGJSkRM7w0MmIssVXa7U6QzDiGipYDXu4xwyflQp', {
    api_host: 'https://eu.i.posthog.com',
    capture_pageview: true,
    capture_pageleave: true,
    capture_performance: {
        web_vitals: true,
        web_vitals_allowed_metrics: ['CLS', 'FCP', 'INP', 'LCP']
    },
    session_recording: {
        maskAllInputs: true,
        maskTextSelector: '.sensitive'
    },
    persistence: 'localStorage+cookie',
    enable_heatmaps: true
})
```

---

## 3. Izlenmesi Gereken E-Ticaret Olaylari

| Olay | Tetikleme | Ozellikler |
|------|-----------|------------|
| `product_viewed` | Urun sayfasi goruntulendiginde | `product_id`, `product_name`, `price`, `category` |
| `category_viewed` | Koleksiyon sayfasi goruntulendiginde | `category_name`, `product_count` |
| `add_to_cart` | Sepete ekleme | `product_name`, `price`, `quantity` |
| `cart_viewed` | Sepet sayfasi goruntulendiginde | `cart_total`, `item_count` |
| `checkout_started` | Odeme sayfasina gecis | `cart_total`, `item_count` |
| `order_completed` | Siparis tamamlama | `order_id`, `order_total`, `currency`, `payment_method`, `items[]` |
| `whatsapp_click` | WhatsApp butonuna tiklama | `source`, `page` |
| `calculator_completed` | Fiyat hesaplama yapildiginda | `product_id`, `width`, `height`, `calculated_price` |

---

## 4. Satin Alma Hunisi

```
$pageview (herhangi bir sayfa)
  -> product_viewed
    -> calculator_completed (olcu girildi, fiyat hesaplandi)
      -> add_to_cart
        -> cart_viewed
          -> checkout_started
            -> order_completed
```

Her adimda kayip oranini izle. Hunideki en buyuk kayip noktasi iyilestirme onceligi olmalidir.

---

## 5. Dashboard Onerileri

### Genel Bakis
- Gunluk/haftalik benzersiz ziyaretci sayisi
- En cok ziyaret edilen sayfalar
- Cihaz dagilimi (Desktop vs Mobil)
- Referans kaynaklari (Google, Instagram, direkt)

### E-Ticaret Hunisi
- Satin alma hunisi (5 adim)
- Adim bazinda kayip orani
- WhatsApp donusum hunisi

### Urun Performansi
- En cok goruntulenlen urunler
- En cok sepete eklenen urunler
- Kategori bazli performans

---

## 6. KVKK / Cerez Uyumu

PostHog cerez bilgisi cerez politikasina eklenmeli:

| Cerez | Saglayici | Amac | Sure |
|-------|-----------|------|------|
| `ph_phc_*` | PostHog | Analitik — ziyaretci kimliklendirme | 1 yil |

Kullanici onay yonetimi icin PostHog'un `opt_out_capturing_by_default` ayari kullanilabilir:

```javascript
posthog.init('phc_...', {
    opt_out_capturing_by_default: true
});
// Kullanici onay verdikten sonra:
posthog.opt_in_capturing();
```
