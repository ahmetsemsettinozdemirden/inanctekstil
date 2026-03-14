# Inanc Tekstil — E-Ticaret Dokumantasyonu

Iskenderun, Hatay merkezli ozel dikim perde e-ticaret projesi.

**Web Sitesi:** inanctekstil.store
**Teknoloji:** Hetzner + Docker + Traefik + WordPress + WooCommerce + PayTR
**Pazarlama:** Google Ads + Meta Ads + TikTok (gelecek)

---

## Klasor Yapisi

```
docs/
├── superpowers/specs/       # Tasarim spesifikasyonlari
├── infrastructure/          # Sunucu, DNS, e-posta, guvenlik, yedekleme
├── ecommerce/               # WooCommerce, PayTR, fiyat hesaplama, urunler
├── marketing/               # Dijital pazarlama stratejisi
│   ├── google-ads/          # Google Ads kampanyalari ve raporlari
│   ├── meta-ads/            # Meta/Instagram Ads kampanyalari ve raporlari
│   ├── tiktok-ads/          # TikTok stratejisi (Ay 3+)
│   └── content/             # Icerik plani, fotograf/video rehberi
├── legal/                   # Yasal gereksinimler ve taslak sablonlar
└── brand/                   # Marka kimligi ve gorsel kurallar
```

---

## Tasarim Spesifikasyonu

| Dosya | Icerik |
|-------|--------|
| [Tasarim Spesifikasyonu](superpowers/specs/2026-03-14-inanc-tekstil-ecommerce-design.md) | Tum projenin mimari, teknik ve pazarlama tasarimi |

---

## Altyapi (infrastructure/)

| Dosya | Icerik |
|-------|--------|
| [README](infrastructure/README.md) | Altyapi genel bakis, teknoloji yigini, bakim takvimi |
| [Sunucu Kurulumu](infrastructure/server-setup.md) | Hetzner CX23, Ubuntu 24.04, Docker, Traefik, WordPress kurulumu |
| [DNS Yapilandirmasi](infrastructure/dns-configuration.md) | A kaydi, MX kayitlari, SPF/DKIM/DMARC yapilandirmasi |
| [E-posta Kurulumu](infrastructure/email-setup.md) | Google Workspace, Resend, WP Mail SMTP eklenti yapilandirmasi |
| [Guvenlik](infrastructure/security.md) | UFW guvenlik duvari, Docker network izolasyonu, WordPress sertlestirme |
| [Yedekleme ve Kurtarma](infrastructure/backup-recovery.md) | Hetzner snapshot, MySQL yedekleme, harici senkronizasyon, kurtarma proseduru |

---

## E-Ticaret (ecommerce/)

| Dosya | Icerik |
|-------|--------|
| [README](ecommerce/README.md) | E-ticaret genel bakis, fiyatlandirma formulu, hizli baslangic |
| [WooCommerce Kurulumu](ecommerce/woocommerce-setup.md) | WooCommerce yapilandirmasi, Astra tema, eklentiler, KDV ayarlari |
| [PayTR Entegrasyonu](ecommerce/paytr-integration.md) | PayTR odeme entegrasyonu, sandbox, taksit, webhook |
| [Fiyat Hesaplama Eklentisi](ecommerce/pricing-calculator.md) | Ozel perde fiyat hesaplama eklentisinin teknik spesifikasyonu (PHP + JS) |
| [Urun Katalogu](ecommerce/product-catalog.md) | Urun ekleme rehberi, kumas fotograf standartlari, sayfa duzeni |
| [Kargo ve Teslimat](ecommerce/shipping-delivery.md) | Kargo bolgeleri, teslimat sureci, siparis is akisi |

---

## Dijital Pazarlama (marketing/)

| Dosya | Icerik |
|-------|--------|
| [README](marketing/README.md) | Dijital pazarlama stratejisi, hesap yapilari, butce dagilimi, zaman plani |

### Google Ads

| Dosya | Icerik |
|-------|--------|
| [README](marketing/google-ads/README.md) | Google Ads genel bakis, hizli referans, baslangic kontrol listesi |
| [Hesap Kurulumu](marketing/google-ads/account-setup.md) | MCC olusturma, reklam hesabi, GA4 baglama, donusum izleme, Google Business Profile |
| [Kampanya Stratejisi](marketing/google-ads/campaign-strategy.md) | Kampanya yapisi, anahtar kelimeler, hedefleme, butce, teklif stratejisi, reklam metni ornekleri |
| [Haftalik Rapor Sablonu](marketing/google-ads/weekly-report-template.md) | Performans izleme sablonu, hedef metrikler, anahtar kelime analizi |

### Meta Ads (Facebook + Instagram)

| Dosya | Icerik |
|-------|--------|
| [README](marketing/meta-ads/README.md) | Meta Ads genel bakis, hizli referans, baslangic kontrol listesi |
| [Hesap Kurulumu](marketing/meta-ads/account-setup.md) | Business Manager, Facebook Page, Instagram baglama, Pixel kurulumu, isletme dogrulamasi |
| [Kampanya Stratejisi](marketing/meta-ads/campaign-strategy.md) | Trafik ve retargeting kampanyalari, hedef kitle, reklam formatlari, Turkce reklam ornekleri |
| [Haftalik Rapor Sablonu](marketing/meta-ads/weekly-report-template.md) | Performans izleme sablonu, hedef metrikler, kitle analizi |

### TikTok (Ay 3+)

| Dosya | Icerik |
|-------|--------|
| [TikTok Strateji ve Planlama](marketing/tiktok-ads/README.md) | Neden beklenmeli, hesap kurulumu, icerik stratejisi, Spark Ads, kampanya yapisi |

### Icerik

| Dosya | Icerik |
|-------|--------|
| [Icerik Plani ve Rehber](marketing/content/README.md) | Icerik turleri, fotograf/video cekim rehberi, haftalik takvim, varlik envanteri |

---

## Yasal Gereksinimler (legal/)

| Dosya | Icerik |
|-------|--------|
| [README](legal/README.md) | Yasal gereksinimler ozeti, mevzuat linkleri, uygulama kontrol listesi |
| [KVKK Gizlilik Politikasi](legal/kvkk-gizlilik-politikasi.md) | KVKK uyumluluk rehberi ve Turkce taslak gizlilik politikasi |
| [Mesafeli Satis Sozlesmesi](legal/mesafeli-satis-sozlesmesi.md) | 6502 sayili Kanun gereksinimleri ve Turkce taslak sozlesme |
| [Iade Politikasi](legal/iade-politikasi.md) | Ozel urun iade kurallari ve Turkce taslak iade politikasi |
| [Cerez Politikasi](legal/cerez-politikasi.md) | Cerez turleri, Complianz yapilandirmasi ve Turkce taslak politika |
| [On Bilgilendirme Formu](legal/on-bilgilendirme-formu.md) | Checkout oncesi yasal bilgilendirme ve Turkce taslak form |

---

## Marka (brand/)

| Dosya | Icerik |
|-------|--------|
| [README](brand/README.md) | Marka varliklari genel bakis, dokuman dizini |
| [Marka Kimligi](brand/marka-kimligi.md) | Marka hikayesi, ses ve tonu, hedef kitle, degerler, farklilasma |
| [Gorsel Kimlik](brand/gorsel-kimlik.md) | Logo kurallari, renk paleti (HEX kodlari), tipografi, fotograf stili |
| [Sosyal Medya Kilavuzu](brand/sosyal-medya-kilavuzu.md) | Platform boyutlari, bio sablonlari, hashtag stratejisi, gonderi ve yanit sablonlari |

---

## Hizli Baslangic

1. Sunucu kur → [server-setup.md](infrastructure/server-setup.md)
2. DNS yapilandir → [dns-configuration.md](infrastructure/dns-configuration.md)
3. E-posta kur → [email-setup.md](infrastructure/email-setup.md)
4. Guvenlik sertlestir → [security.md](infrastructure/security.md)
5. WooCommerce yapilandir → [woocommerce-setup.md](ecommerce/woocommerce-setup.md)
6. PayTR entegre et → [paytr-integration.md](ecommerce/paytr-integration.md)
7. Fiyat hesaplama eklentisini kur → [pricing-calculator.md](ecommerce/pricing-calculator.md)
8. Urunleri ekle → [product-catalog.md](ecommerce/product-catalog.md)
9. Kargo ayarla → [shipping-delivery.md](ecommerce/shipping-delivery.md)
10. Yasal sayfalari olustur → [legal/README.md](legal/README.md)
11. Pazarlama hesaplarini kur → [marketing/README.md](marketing/README.md)
12. Icerik uretmeye basla → [content/README.md](marketing/content/README.md)
13. Reklamlari baslat → [google-ads/campaign-strategy.md](marketing/google-ads/campaign-strategy.md)
