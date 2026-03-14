# Inanc Tekstil -- E-Ticaret Dokumantasyonu

Bu dokumantasyon, Inanc Tekstil'in online perde satis platformunun teknik altyapisini ve isleyisini kapsar.

## Genel Bakis

**Is Modeli:** Musteri kumas secer, olcu girer (en x boy cm), fiyat otomatik hesaplanir ve siparis verilir. Uretim siparisten sonra baslar.

**Konum:** Iskenderun, Hatay, Turkiye

**Teknoloji Yigini:**

| Katman | Teknoloji |
|---|---|
| CMS | WordPress (en guncel surum) |
| E-Ticaret | WooCommerce |
| Tema | Astra (hafif, hizli, WooCommerce uyumlu) |
| Odeme | PayTR (kredi karti, banka karti, taksit) |
| Fiyat Hesaplama | Ozel WordPress eklentisi (`inanc-curtain-calculator/`) |
| Teslimat | Hatay ili -- duz ucret veya ucretsiz yerel teslimat |

## Dokuman Indeksi

| Dosya | Icerik |
|---|---|
| [woocommerce-setup.md](woocommerce-setup.md) | WooCommerce yapilandirmasi, tema, eklentiler, KDV ayarlari |
| [paytr-integration.md](paytr-integration.md) | PayTR odeme entegrasyonu, sandbox, taksit, webhook |
| [pricing-calculator.md](pricing-calculator.md) | Ozel perde fiyat hesaplama eklentisinin teknik spesifikasyonu |
| [product-catalog.md](product-catalog.md) | Urun ekleme rehberi, kumas fotograf standartlari, sayfa duzeni |
| [shipping-delivery.md](shipping-delivery.md) | Kargo bolgeleri, teslimat sureci, siparis is akisi |

## Fiyatlandirma Formulu

Perde tipleri icin farkli fiyatlandirma modelleri:

**Tul:**
```
fiyat = (pencere_eni_cm / 100) × pile_orani × kumas_metre_fiyati + dikis_maliyeti
```

**Saten:**
```
fiyat = 150 TL (sabit fiyat, pencere basina)
```

**Fon:**
```
fiyat = (panel_eni_cm / 100) × pile_orani × 2 × kumas_metre_fiyati + 500 TL dikis
```

- Kumas secenegi: ~20 adet
- Metre fiyati her urunde WooCommerce custom field olarak saklanir

## Hizli Baslangiic

1. WordPress + WooCommerce kur -> [woocommerce-setup.md](woocommerce-setup.md)
2. Astra temayi yukle ve yapilandir -> [woocommerce-setup.md](woocommerce-setup.md)
3. PayTR entegrasyonunu yap -> [paytr-integration.md](paytr-integration.md)
4. Fiyat hesaplama eklentisini yukle -> [pricing-calculator.md](pricing-calculator.md)
5. Urunleri (kumaslari) ekle -> [product-catalog.md](product-catalog.md)
6. Kargo bolgelerini ayarla -> [shipping-delivery.md](shipping-delivery.md)
