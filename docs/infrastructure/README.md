# Inanc Tekstil -- E-Ticaret Altyapi Dokumantasyonu

Bu dokumantasyon, **inanctekstil.store** e-ticaret sitesinin altyapi kurulumu, yapilandirmasi ve isletimi icin hazirlanmistir.

## Teknoloji Yigini

| Katman | Teknoloji |
|---|---|
| Sunucu | Hetzner Cloud CX23 (2 vCPU, 4 GB RAM, 40 GB SSD) -- nbg1 (Nuremberg) |
| Isletim Sistemi | Ubuntu 24.04 LTS |
| Konteyner Platformu | Docker + Docker Compose |
| Reverse Proxy | Traefik (otomatik Let's Encrypt SSL, Docker label-based routing) |
| CMS / E-Ticaret | WordPress (resmi Docker imaji) + WooCommerce |
| Veritabani | MariaDB (Docker konteyner) |
| Onbellek | Redis (Docker konteyner -- WooCommerce object cache) |
| SSL | Let's Encrypt (Traefik uzerinden otomatik) |
| Kurumsal E-posta | Google Workspace Starter ($7/ay) |
| Transactional E-posta | Resend (ucretsiz katman) + WP Mail SMTP |
| Alan Adi | inanctekstil.store |

## Dokuman Dizini

| # | Dosya | Konu |
|---|---|---|
| 1 | [server-setup.md](server-setup.md) | Hetzner CX23 sunucu tedariegi, Ubuntu 24.04 kurulumu, Docker + Docker Compose kurulumu, Traefik + WordPress + MariaDB + Redis docker-compose yapilandirmasi, wp-cli kullanimi |
| 2 | [dns-configuration.md](dns-configuration.md) | DNS A/CNAME kayitlari, Google Workspace MX kayitlari, SPF/DKIM/DMARC yapilandirmasi |
| 3 | [email-setup.md](email-setup.md) | Google Workspace kurulumu, Resend hesabi, WP Mail SMTP eklenti yapilandirmasi |
| 4 | [security.md](security.md) | UFW guvenlik duvari, Docker guvenlik izolasyonu, Traefik rate limiting ve guvenlik basliklari, WordPress sertlestirme, otomatik guncellemeler |
| 5 | [backup-recovery.md](backup-recovery.md) | Hetzner snapshot'lari, Docker konteyner uzerinden veritabani yedekleme, Docker volume yedekleme, harici depolamaya senkronizasyon, kurtarma prosedureri |

## Hizli Referans

- **Sunucu IP:** 5.75.165.158
- **SSH Baglantisi:** `ssh -i ~/.ssh/inanctekstil root@5.75.165.158`
- **WordPress Admin:** `https://inanctekstil.store/wp-admin`
- **Traefik Dashboard:** Guvenlik nedeniyle varsayilan olarak devre disi (gerektiginde docker-compose.yml'de etkinlestirilebilir)
- **Google Workspace Admin:** `https://admin.google.com`
- **Resend Dashboard:** `https://resend.com/overview`

## Yonetim Komutlari (Hizli Referans)

```bash
# Sunucuya baglan
ssh -i ~/.ssh/inanctekstil root@5.75.165.158

# Konteynerlerin durumunu gor
cd /opt/inanctekstil && docker compose ps

# WordPress wp-cli kullanimi
cd /opt/inanctekstil && docker compose exec wordpress wp --info --allow-root

# Loglari izle
cd /opt/inanctekstil && docker compose logs -f

# Servisleri yeniden baslat
cd /opt/inanctekstil && docker compose restart
```

## Bakim Takvimi

| Gorev | Siklik | Yontem |
|---|---|---|
| Hetzner Snapshot | Haftalik (Pazar 03:00) | Hetzner Cloud API / Konsol |
| MariaDB Yedekleme | Gunluk (02:00) | Cron + docker compose exec mariadb mysqldump |
| wp-content Volume Yedekleme | Gunluk (02:30) | Cron + Docker volume tar |
| Traefik Sertifika Yedekleme | Gunluk (02:45) | Cron + acme.json kopyalama |
| WordPress Cekirdek Guncellemesi | Haftalik kontrol | docker compose exec wordpress wp core update |
| Eklenti Guncellemeleri | Haftalik kontrol | wp-admin / docker compose exec wordpress wp plugin update --all |
| SSL Yenileme | Otomatik (Let's Encrypt) | Traefik otomatik yeniler |
| Docker Imaj Guncellemesi | Aylik kontrol | docker compose pull && docker compose up -d |
| Guvenlik Taramasi | Haftalik | Wordfence / Traefik erisim loglari |
