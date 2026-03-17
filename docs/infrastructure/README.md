# Inanc Tekstil -- Altyapi Dokumantasyonu

Bu dokumantasyon, **inanctekstil.store** e-ticaret sitesinin altyapi yapilandirmasini kapsar.

## Teknoloji Yigini

| Katman | Teknoloji |
|---|---|
| E-Ticaret Platformu | Shopify |
| Tema | Horizon |
| Alan Adi | inanctekstil.store |
| Kurumsal E-posta | Google Workspace Starter ($7/ay) |
| DNS | Hetzner DNS (nameserver'lar) |
| SSL | Shopify (otomatik) |
| CDN | Shopify (otomatik) |
| Yedekleme | Shopify (otomatik) |

## Dokuman Dizini

| # | Dosya | Konu |
|---|---|---|
| 1 | [dns-configuration.md](dns-configuration.md) | DNS kayitlari, Shopify baglantisi, Google Workspace MX, SPF/DKIM/DMARC |
| 2 | [email-setup.md](email-setup.md) | Google Workspace kurulumu, e-posta alias'lari |

## Hizli Referans

- **Shopify Admin:** `https://inanctekstil.store/admin`
- **Google Workspace Admin:** `https://admin.google.com`
- **Hetzner DNS:** `https://dns.hetzner.com`

## Shopify Altyapi Avantajlari

Shopify'a gecisle asagidaki altyapi bilesenlerini Shopify otomatik olarak yonetir:

| Bilesne | Eski (WordPress) | Yeni (Shopify) |
|---------|-------------------|-----------------|
| Sunucu | Hetzner CX23, manuel yonetim | Shopify hostingi, yonetim yok |
| SSL | Let's Encrypt + Traefik | Otomatik |
| CDN | Yok | Shopify CDN (global) |
| Guvenlik | UFW, Traefik, WordPress sertlestirme | Shopify platform guvenligi |
| Yedekleme | Manuel scriptler + cron | Shopify otomatik yedekleme |
| Veritabani | MariaDB Docker konteyner | Shopify yonetimli |
| Onbellek | Redis Docker konteyner | Shopify yonetimli |
| Guncellemeler | Manuel WP/eklenti guncellemeleri | Shopify otomatik |

## Bakim Takvimi

| Gorev | Siklik | Yontem |
|---|---|---|
| DNS kayitlarini dogrula | Aylik | `dig` komutlari veya MXToolbox |
| Google Workspace faturalama | Aylik | Google Admin Console |
| SSL sertifika kontrolu | Gereksiz | Shopify otomatik yonetir |
| Yedekleme | Gereksiz | Shopify otomatik yonetir |
