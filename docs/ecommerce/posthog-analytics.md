# PostHog Analytics

**Durum:** Aktif — 2026-03-19 tarihinde canlıya alındı.

---

## Hesap Bilgileri

| Bilgi | Değer |
|-------|-------|
| Platform | PostHog Cloud (EU) |
| Dashboard | `https://eu.posthog.com` — Project ID: `141609` |
| Project API Key | `phc_knhZGJSkRM7w0MmIssVXa7U6QzDiGipYDXu4xwyflQp` |
| Veri Lokasyonu | EU (`eu.i.posthog.com`) |
| Managed Proxy | `svc.inanctekstil.store` → `4470bbf4e458b2332c54.cf-prod-eu-proxy.europehog.com.` |
| Plan | Free (1M event/ay) |

**Not:** Project API Key herkese açık (public) anahtardır — gizli değildir. Hem tema snippet'inde hem de analytics-forwarder servisinde kullanılır.

---

## Mimari

```
Tarayıcı (Shopify teması)
  theme.liquid → posthog-analytics.liquid
    ↓ tüm istekler first-party proxy üzerinden geçer
  svc.inanctekstil.store  (CNAME → PostHog managed proxy)
    ↓
  eu.i.posthog.com

Shopify (sunucu-sunucu)
  orders/paid webhook
    ↓
  hooks.inanctekstil.store
    ↓
  analytics-forwarder (Bun/Hono, Docker, Hetzner 5.75.165.158)
    ↓
  eu.i.posthog.com/capture/
```

---

## Tema Entegrasyonu

### Dosyalar

| Dosya | Değişiklik |
|-------|-----------|
| `technical/theme/snippets/posthog-analytics.liquid` | PostHog init + sayfa tipi olayları |
| `technical/theme/snippets/cookie-consent.liquid` | KVKK onay banner'ı |
| `technical/theme/layout/theme.liquid` | `<head>`'e posthog-analytics, `</body>` öncesi cookie-consent render tag |
| `technical/theme/sections/curtain-configurator.liquid` | `calculator_completed` + `add_to_cart` olayları |

### PostHog Init Konfigürasyonu

```javascript
posthog.init('phc_knhZGJSkRM7w0MmIssVXa7U6QzDiGipYDXu4xwyflQp', {
  api_host: 'https://svc.inanctekstil.store',  // managed proxy
  ui_host: 'https://eu.posthog.com',
  capture_pageview: true,
  capture_pageleave: true,
  session_recording: { maskAllInputs: true },
  persistence: 'localStorage+cookie',
  enable_heatmaps: true,
  opt_out_capturing_by_default: true  // KVKK: onay gerekli
});
```

**Not:** `capture_performance` / web vitals konfigürasyonu PostHog JS v2'de init'ten kaldırıldı. PostHog UI → Project Settings → Autocapture üzerinden etkinleştiriliyor.

---

## İzlenen Olaylar

### Otomatik (kod gerektirmez)
| Olay | Açıklama |
|------|----------|
| `$pageview` | Her sayfa yüklemesi |
| `$pageleave` | Sayfadan ayrılma |
| Web vitals (LCP, CLS, INP, FCP) | PostHog UI'dan etkinleştirilen |
| Session recordings | Tüm input'lar maskelendi |
| Heatmaps | Etkin |

### Sayfa tipi olayları (`posthog-analytics.liquid`)
| Olay | Tetikleyici | Özellikler |
|------|-------------|------------|
| `product_viewed` | Ürün sayfası | `product_id`, `product_name`, `price`, `category` |
| `category_viewed` | Koleksiyon sayfası | `category_name`, `category_handle` |

### JS olayları (`curtain-configurator.liquid`)
| Olay | Tetikleyici | Özellikler |
|------|-------------|------------|
| `calculator_completed` | Fiyat hesaplama görüntülendiğinde | `variant_id`, `width_cm`, `height_cm`, `calculated_price` |
| `add_to_cart` | Sepete ekleme başarılı | `variant_id`, `price`, `quantity` |

### Sunucu taraflı (`analytics-forwarder`)
| Olay | Tetikleyici | Özellikler |
|------|-------------|------------|
| `order_completed` | Shopify `orders/paid` webhook | `order_id`, `order_number`, `order_total`, `currency`, `item_count`, `items[]`, `$source: shopify_webhook` |

---

## analytics-forwarder Servisi

| Bilgi | Değer |
|-------|-------|
| Kaynak | `technical/analytics-forwarder/` |
| Sunucu | `/opt/analytics-forwarder/` (Hetzner) |
| URL | `https://hooks.inanctekstil.store` |
| Webhook endpoint | `POST /webhooks/shopify/orders-paid` |
| Health endpoint | `GET /health` |
| Port | 3000 |

**Shopify Webhook:**
```
Shopify Admin → Settings → Notifications → Webhooks
  Event: Order payment
  URL:   https://hooks.inanctekstil.store/webhooks/shopify/orders-paid
```

**Env vars** (`/opt/inanctekstil/.env`):
```
SHOPIFY_WEBHOOK_SECRET=<Shopify webhook imzalama sırrı>
POSTHOG_API_KEY=phc_knhZGJSkRM7w0MmIssVXa7U6QzDiGipYDXu4xwyflQp
```

---

## Satın Alma Hunisi

```
$pageview
  → product_viewed
    → calculator_completed   (ölçüler girildi, fiyat gösterildi)
      → add_to_cart
        → [checkout_started — kapsam dışı, draft order flow]
          → order_completed  (sunucu taraflı, %100 yakalanır)
```

**Bilinen sınırlama:** `checkout_started` yakalanmıyor — mağaza standart Shopify checkout yerine draft order invoice URL kullanıyor. Custom Pixel olayları bu akışta tetiklenmiyor.

**Funnel stitching sınırlama:** `order_completed` sunucu taraflında `email` veya `shopify_order_<id>` ile yakalanıyor. Tarayıcı oturumu olayları PostHog'un anonim cookie ID'sini kullanıyor. `posthog.identify(email)` çağrısı yapılmadıkça (kapsam dışı) bu iki kimlik birleşmiyor. `order_completed` bağımsız metrik olarak sorgulanabilir.

---

## KVKK Uyumu

- `opt_out_capturing_by_default: true` — kullanıcı "Kabul Et" demeden hiçbir olay gönderilmez
- `cookie-consent.liquid` — banner'da "Kabul Et" → `posthog.opt_in_capturing()`, "Reddet" → `posthog.opt_out_capturing()`
- Onay `localStorage` anahtarı `cookie_consent` altında saklanır
- Webhook (sunucu taraflı) için onay gerekmiyor — sözleşme ifası / meşru menfaat hukuki dayanağı
- Çerez politikası: `/pages/cerez-politikasi` — PostHog kaydı mevcut (EU host, 1 yıl saklama)

---

## DNS Kayıtları (Terraform — `technical/gitopsprod/dns.tf`)

| Kayıt | Tür | Değer |
|-------|-----|-------|
| `svc.inanctekstil.store` | CNAME | `4470bbf4e458b2332c54.cf-prod-eu-proxy.europehog.com.` |
| `hooks.inanctekstil.store` | A | `5.75.165.158` |
