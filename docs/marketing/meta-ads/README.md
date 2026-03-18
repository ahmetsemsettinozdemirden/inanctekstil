# Meta Ads (Facebook + Instagram) - Inanc Tekstil

## Genel Bakis

Meta Ads, Facebook ve Instagram uzerinden Iskenderun/Hatay bolgesindeki potansiyel musterilere gorsel ve video reklamlarla ulasmayi hedefler. Aylik 1.500 TL butce ile trafik ve retargeting kampanyalari yonetilecektir.

Meta'nin avantaji **gorsel odakli reklam formatlari**dir. Perde gibi gorsel bir urun icin kumas dokusu, oda ici gorunum ve oncesi-sonrasi karsilastirmalari cok etkilidir. Ayrica, henuz perde aramayan ama ilgilenebilecek kitlelere ulasma imkani saglar.

---

## Dokumanlar

| Dokuman | Aciklama |
|---------|----------|
| [Hesap Kurulumu](account-setup.md) | Business Manager, Facebook Page, Instagram baglama, Pixel kurulumu, isletme dogrulamasi |
| [Kampanya Stratejisi](campaign-strategy.md) | Trafik ve retargeting kampanyalari, hedef kitle, reklam formatlari, butce, reklam ornekleri |
| [Haftalik Rapor Sablonu](weekly-report-template.md) | Performans izleme sablonu, hedef metrikler |

---

## Hizli Referans

- **Butce:** 45 TL/gun (~1.350 TL/ay)
- **Kampanya 1:** Reels — Farkindalik (soguk kitle) — AKTIF
- **Kampanya 2:** Retargeting (siteyi ziyaret edip siparis vermeyenler - 500+ ziyaretci sonrasi) — HENUZ BASLATILMADI
- **Hedef Bolge:** Iskenderun + 30 km
- **Hedef Kitle:** 25-50 yas, kadinlar, ev dekorasyonu ilgi alanlari
- **Reklam Formatlari:** Reels (gorsel), Stories, Carousel
- **Hedef CPC:** 1-3 TL
- **Hedef CTR:** >%1
- **Hedef Donusum Orani:** >%1

---

## Meta Varlik ID'leri

| Varlik | Aciklama | ID |
|--------|----------|----|
| Business Portfolio | Inanc Tekstil | `928098610079416` |
| Ad Account | Inanc Tekstil | `act_1460297365542314` |
| Facebook Page | Inanc Tekstil | `1064624423394553` |
| Instagram Hesabi | @inanc_tekstil | `1074486572406385` |
| Meta Pixel / Dataset | inanctekstil.store | `1754778638989489` |
| Shopify Urun Katalogu | Shopify Product Catalog | `25593862530291556` |
| Meta App (MCP) | inanc-tekstil-ads | `1475535244215512` |

---

## Aktif Kampanya Yapisi (2026-03-17)

```
Kampanya 1: Reels — Farkindalik (Soguk Kitle) [ID: 6933660244056] ACTIVE
  └── Ad Set: Kadinlar 25-50 | Iskenderun +30km | Ev Dekorasyonu [ID: 6933660347256] ACTIVE
        Butce: 45 TL/gun | Hedef: REACH | Placement: Instagram Reels
        └── Ad: Tul Perde — Terracotta Oda (UTM) [ID: 6933661911256] ACTIVE
              Creative: 924276740569932
              URL: ...?utm_source=instagram&utm_medium=reels&utm_campaign=farkindalik_soguk_kitle

Kampanya 2: Katalog — Urun Satislari (Dinamik) [ID: 6933662901256] ACTIVE
  └── Ad Set: Kadinlar 25-50 | Iskenderun +30km | Katalog Urunleri [ID: 6933663283856] ACTIVE
        Butce: 45 TL/gun | Hedef: LINK_CLICKS | Placement: Instagram + Facebook (Feed/Story/Reels)
        ├── Ad: Blackout Perde — 750 TL/m [ID: 6933663381456] ACTIVE
        │     Creative: 1246721590772046 | URL: .../collections/blackout-perdeler?...&utm_content=blackout
        ├── Ad: Saten Perde — 150 TL/m [ID: 6933663385456] ACTIVE
        │     Creative: 1296426125684464 | URL: .../collections/saten-perdeler?...&utm_content=saten
        └── Ad: Tul Perde — 230 TL/m [BEKLIYOR — creative IN_PROCESS]
              Creative: 2483772795409933
```

**Not — Gercek Dynamic Product Ads:** `promoted_object` parametresi MCP'de desteklenmiyor.
Bunun yerine her urun kategorisi icin ayri single-image ad olusturuldu.
Gercek katalog reklamlari icin Ads Manager UI kullanilmali.

**Toplam aktif butce:** ~90 TL/gun (iki kampanya)

---

## Baslangic Kontrol Listesi

- [x] Meta Business Manager hesabi olustur
- [x] Facebook Business Page olustur
- [x] Instagram hesabini Business'a cevir ve Facebook Page'e bagla
- [x] Business Manager icinde reklam hesabi olustur
- [x] Meta Pixel olustur ve web sitesine ekle (Conversions API + Meta Pixel)
- [x] Shopify urun katalogu bagla
- [x] Meta App'i Live moda al (privacy policy + ToS URL eklendi)
- [x] Trafik/farkindalik kampanyasini olustur ve aktif et
- [x] Katalog/urun kampanyasi olustur (3 urun kategorisi, her biri ayri ad)
- [ ] Vergi levhasi ile isletme dogrulamasi yap
- [ ] Tul Perde adini ekle (creative IN_PROCESS — sonradan ekle)
- [ ] Gercek Dynamic Product Ads kurulumu (Ads Manager UI ile — MCP desteklemiyor)
- [ ] Retargeting kampanyasi olustur (500+ ziyaretci sonrasi)
- [ ] Ilk haftalik raporu hazirla
