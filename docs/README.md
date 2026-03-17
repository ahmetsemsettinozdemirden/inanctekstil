# Inanc Tekstil — E-Ticaret Dokumantasyonu

Iskenderun, Hatay merkezli ozel dikim perde e-ticaret projesi.

**Web Sitesi:** inanctekstil.store
**Teknoloji:** Shopify (Horizon tema) + PayTR + Google Workspace
**Pazarlama:** Google Ads + Meta Ads + TikTok (gelecek)

---

## Klasor Yapisi

```
docs/
├── superpowers/
│   ├── specs/               # Tasarim spesifikasyonlari (arsiv)
│   └── plans/               # Uygulama planlari (arsiv)
├── benchmark/               # Rakip analizi (TAC)
├── infrastructure/          # DNS, e-posta (Shopify yonetimli altyapi)
├── ecommerce/               # Shopify, PayTR, fiyat hesaplama, urunler
├── marketing/               # Dijital pazarlama stratejisi
│   ├── google-ads/          # Google Ads kampanyalari ve raporlari
│   ├── meta-ads/            # Meta/Instagram Ads kampanyalari ve raporlari
│   ├── tiktok-ads/          # TikTok stratejisi (Ay 3+)
│   └── content/             # Icerik plani, fotograf/video rehberi
├── legal/                   # Yasal gereksinimler ve taslak sablonlar
└── brand/                   # Marka kimligi ve gorsel kurallar
```

---

## Arsiv: Tasarim Spesifikasyonlari (superpowers/)

WooCommerce donemi planlama dokumanlari. Arsiv olarak saklanmaktadir.

| Dosya | Icerik |
|-------|--------|
| [E-Ticaret Tasarimi](superpowers/specs/2026-03-14-inanc-tekstil-ecommerce-design.md) | Projenin ilk mimari tasarimi (WooCommerce donemi) |
| [Marka Kimligi Yenileme](superpowers/specs/2026-03-14-brand-identity-redesign-design.md) | Beyaz/navy minimal marka kimligi tasarimi |
| [Perde Hesaplayici Test Suiti](superpowers/specs/2026-03-14-curtain-calculator-test-suite-design.md) | Hesap makinesi test altyapisi tasarimi |

## Benchmark Analizi (benchmark/)

| Dosya | Icerik |
|-------|--------|
| [TAC Analiz](benchmark/tac/README.md) | TAC rakip analizi genel bakis |
| [TAC Detayli Analiz](benchmark/tac/analysis.md) | TAC web sitesi detayli benchmark analizi |

---

## Altyapi (infrastructure/)

Shopify tamamen yonetilen bir platformdur — sunucu, guvenlik ve yedekleme Shopify tarafindan saglanir.

| Dosya | Icerik |
|-------|--------|
| [README](infrastructure/README.md) | Altyapi genel bakis, eski vs yeni karsilastirma |
| [DNS Yapilandirmasi](infrastructure/dns-configuration.md) | Shopify A/CNAME kayitlari, Google Workspace MX, SPF/DKIM/DMARC |
| [E-posta Kurulumu](infrastructure/email-setup.md) | Google Workspace yapilandirmasi, Shopify bildirim e-postalari |

---

## E-Ticaret (ecommerce/)

| Dosya | Icerik |
|-------|--------|
| [README](ecommerce/README.md) | E-ticaret genel bakis, fiyatlandirma formulu, hizli baslangic |
| [Shopify Kurulumu](ecommerce/shopify-setup.md) | Shopify yapilandirmasi, Horizon tema, uygulamalar, KDV ayarlari |
| [PayTR Entegrasyonu](ecommerce/paytr-integration.md) | PayTR odeme entegrasyonu, sandbox, taksit |
| [Fiyat Hesaplama](ecommerce/pricing-calculator.md) | Perde fiyat hesaplama spesifikasyonu (Shopify icin gelistiriliyor) |
| [Urun Katalogu](ecommerce/product-catalog.md) | Urun ekleme rehberi, Shopify metafield tanimlari |
| [Kargo ve Teslimat](ecommerce/shipping-delivery.md) | Kargo bolgeleri, teslimat sureci, siparis is akisi |
| [Frontend Yapilandirma](ecommerce/frontend-configuration.md) | Horizon tema ozellestirme, navigasyon, renk, SEO |
| [PostHog Analytics](ecommerce/posthog-analytics.md) | PostHog entegrasyonu (referans, henuz aktif degil) |
| [Aninda Perde Analizi](ecommerce/aninda-perde-feature-analysis.md) | TAC "Aninda Perde" ozellik analizi ve oneriler |

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
| [Cerez Politikasi](legal/cerez-politikasi.md) | Cerez turleri, Shopify cerez banner yapilandirmasi ve Turkce taslak politika |
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

1. DNS yapilandir → [dns-configuration.md](infrastructure/dns-configuration.md)
2. E-posta kur → [email-setup.md](infrastructure/email-setup.md)
3. Shopify yapilandir → [shopify-setup.md](ecommerce/shopify-setup.md)
4. PayTR entegre et → [paytr-integration.md](ecommerce/paytr-integration.md)
5. Urunleri ekle → [product-catalog.md](ecommerce/product-catalog.md)
6. Kargo ayarla → [shipping-delivery.md](ecommerce/shipping-delivery.md)
7. Yasal sayfalari olustur → [legal/README.md](legal/README.md)
8. Pazarlama hesaplarini kur → [marketing/README.md](marketing/README.md)
9. Icerik uretmeye basla → [content/README.md](marketing/content/README.md)
10. Reklamlari baslat → [google-ads/campaign-strategy.md](marketing/google-ads/campaign-strategy.md)
