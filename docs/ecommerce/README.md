# Inanc Tekstil -- E-Ticaret Dokumantasyonu

Bu dokumantasyon, Inanc Tekstil'in online perde satis platformunun teknik altyapisini ve isleyisini kapsar.

## Genel Bakis

**Is Modeli:** Musteri kumas secer, olcu girer (en x boy cm), fiyat otomatik hesaplanir ve siparis verilir. Uretim siparisten sonra baslar.

**Konum:** Iskenderun, Hatay, Turkiye

**Teknoloji Yigini:**

| Katman | Teknoloji |
|---|---|
| Platform | Shopify |
| Tema | Horizon |
| Odeme | PayTR (kredi karti, banka karti, taksit) |
| Fiyat Hesaplama | Ozel Shopify entegrasyonu (gelistirme asamasinda) |
| Teslimat | Hatay ili (mevcut), Turkiye geneli (planli) |
| Analitik | PostHog (referans, henuz aktif degil) |

## Dokuman Indeksi

| Dosya | Icerik |
|---|---|
| [shopify-setup.md](shopify-setup.md) | Shopify magaza yapilandirmasi, Horizon tema, uygulamalar |
| [paytr-integration.md](paytr-integration.md) | PayTR odeme entegrasyonu ve alternatif odeme yontemleri |
| [pricing-calculator.md](pricing-calculator.md) | Perde fiyat hesaplama formulleri ve teknik spesifikasyon |
| [product-catalog.md](product-catalog.md) | Urun ekleme rehberi, kartela sistemi, fotograf standartlari |
| [shipping-delivery.md](shipping-delivery.md) | Kargo bolgeleri, teslimat sureci, siparis is akisi |
| [frontend-configuration.md](frontend-configuration.md) | Horizon tema ozellestirmesi, header, footer, site ozellikleri |
| [posthog-analytics.md](posthog-analytics.md) | PostHog analitik entegrasyonu (referans dokuman) |
| [aninda-perde-feature-analysis.md](aninda-perde-feature-analysis.md) | TAC "Aninda Perde" ozellik analizi ve oneriler |

## Fiyatlandirma Formulu

Perde tipleri icin farkli fiyatlandirma modelleri:

**Tul:**
```
gerekli_kumas_metre = (pencere_eni_cm / 100) x pile_orani
toplam_fiyat = (gerekli_kumas_metre x kumas_metre_fiyati) + (gerekli_kumas_metre x dikis_maliyeti_metre)
```
- Dikis maliyeti: 25 TL/metre
- Standart boy: 260 cm (boy fiyati etkilemez)

**Saten:**
```
fiyat = 150 TL (sabit fiyat, pencere basina)
```

**Fon:**
```
kumas_panel_basina = (panel_eni_cm / 100) x pile_orani
toplam_kumas = kumas_panel_basina x 2 (cift panel)
toplam_fiyat = (toplam_kumas x kumas_metre_fiyati) + dikis_maliyeti_cift
```
- Dikis maliyeti (cift panel): 500 TL

- Kumas secenegi: ~20 adet
- Metre fiyati her urunde Shopify metafield olarak saklanir

## Hizli Baslangic

1. Shopify magazayi yapilandir -> [shopify-setup.md](shopify-setup.md)
2. Horizon temayi ozellestir -> [frontend-configuration.md](frontend-configuration.md)
3. PayTR entegrasyonunu yap -> [paytr-integration.md](paytr-integration.md)
4. Fiyat hesaplama sistemini kur -> [pricing-calculator.md](pricing-calculator.md)
5. Urunleri (kumaslari) ekle -> [product-catalog.md](product-catalog.md)
6. Kargo bolgelerini ayarla -> [shipping-delivery.md](shipping-delivery.md)
