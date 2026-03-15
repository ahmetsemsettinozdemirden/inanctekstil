# inanctekstil.store Guncelleme Plani
# TAC Benchmark Bulgularina Dayali Kapsamli Aksiyon Plani

> **Tarih:** 2026-03-14
> **Referans:** [TAC Benchmark Analizi](tac/analysis.md)
> **Durum:** ⚠️ Bu dokuman, benchmark analizi sirasindaki durumu yansitir. Guncel uygulama plani icin [MVP Lansman Plani](../superpowers/plans/2026-03-14-mvp-launch-plan.md) dokumanina bakiniz.
> **Yazildigi Siradaki Durum:** Site "Coming soon" modunda, Astra tema varsayilan, urun yok, icerik yok. O zamandan bu yana plugin v2.0.0 deploy edildi ve WooCommerce yapilandirildi.

---

## Mevcut Durum Ozeti

### Tespit Edilen Eksiklikler

inanctekstil.store su an esasen bos bir WordPress/WooCommerce kurulumu:

| Alan | Mevcut Durum | TAC Karsilastirmasi |
|------|-------------|---------------------|
| Ana Sayfa | Sadece "Ana Sayfa" basligi, icerik yok | Hero slider, kategori ikonlari, kampanya banerleri |
| Navigasyon | 5 item: Ana Sayfa, Urunler, Hakkimizda, Iletisim, Cookie Policy | Mega menu, kategori bazli navigasyon, kampanya linkleri |
| Urun Katalogu | Bos — "No products found" | 14+ urun, profesyonel fotograflar, renk/beden secenekleri |
| Urun Sayfasi | Yok | Renk swatchleri, beden butonlari, accordion detaylar, taksit bilgisi |
| Footer | Sadece copyright ve "Powered by Astra" | Iletisim, sosyal medya, guven rozetleri, odeme ikonlari |
| Logo | Yok | TAC: sol ustte belirgin logo |
| Arama | Yok | TAC: header'da arama cubugu |
| Cerez Banneri | Ingilizce "Cookie Policy (EU)" | Turkce olmali |
| Mobil Gorunum | Optimize degil | TAC: responsive tasarim |
| Guven Sinyalleri | Yok | TAC: taksit rozeti, kargo bilgisi, iade politikasi linkleri |

---

## BOLUM 1: TEMA OZELLESTIRME VE GORSEL KIMLIK

### 1.1 Astra Tema Ayarlari

**Oncelik:** Yuksek
**Referans:** [gorsel-kimlik.md](../brand/gorsel-kimlik.md)

Astra tema Customizer uzerinden yapilandirilacak:

**Renk Paleti Uygulamasi:** (guncel palet icin [gorsel-kimlik.md](../brand/gorsel-kimlik.md) bakiniz)
- Ana arka plan: Pure White `#FFFFFF`
- Birincil/Marka: Deep Navy `#1B2A4A`
- Govde metni: Charcoal `#333333`
- Kenarliklar: Light Gray `#E5E5E5`
- Hafif arka plan: Off-White `#F8F8F8`

**Tipografi:**
- Basliklar: Playfair Display (Google Fonts)
- Govde metni: Inter (Google Fonts)
- Boyutlar: gorsel-kimlik.md'deki spesifikasyonlara uygun

**Header Tasarimi:**
- Logo (tasarlaninca) sol tarafta
- Orta: arama cubugu (TAC benzeri)
- Sag: hesap ikonu + sepet ikonu (urun sayisi badge'i ile)
- Alt: ana navigasyon menusu

**Footer Tasarimi:**
- 4 sutunlu layout:
  - Sutun 1: Logo + kisa tanitim + sosyal medya ikonlari
  - Sutun 2: Hizli Linkler (Ana Sayfa, Urunler, Hakkimizda, Iletisim)
  - Sutun 3: Musteri Hizmetleri (Iade Politikasi, KVKK, Mesafeli Satis Sozlesmesi)
  - Sutun 4: Iletisim Bilgileri (adres, telefon, e-posta, calisma saatleri)
- Alt bar: Copyright + odeme yontemi ikonlari (Visa, Mastercard, Troy)

### 1.2 Logo Tasarimi

**Oncelik:** Yuksek

Logo henuz tasarlanmamis. gorsel-kimlik.md'deki ilkelere uygun tasarlanmali:
- Minimum 120px dijital, 25mm baski
- %25 bos alan her tarafta
- Koyu ve acik arka plan varyantlari
- Favicon versiyonu

**Gecici Cozum:** Logo hazirlanana kadar "Inanc Tekstil" yazisini Playfair Display fontu ile header'a yerlestir.

### 1.3 Cerez Banneri Duzeltmesi

**Oncelik:** Yuksek

Complianz eklentisi su an Ingilizce metin gosteriyor ("Cookie Policy (EU)"). Duzeltmeler:
- Complianz ayarlarindan dil Turkce'ye cekilecek
- Navigasyondaki "Cookie Policy (EU)" linki kaldirilacak veya "Cerez Politikasi" olarak degistirilecek
- Banner metni Turkce: "Bu site cerezleri kullanmaktadir" seklinde
- Referans: [cerez-politikasi.md](../legal/cerez-politikasi.md)

---

## BOLUM 2: ANA SAYFA TASARIMI

### 2.1 Hero Bolumu

**Oncelik:** Yuksek
**TAC Referansi:** 10 banner'lik hero carousel, 1440x520px

Inanc Tekstil icin basitlestirilmis hero:
- 2-3 adet hero banner (carousel veya statik)
- Boyut: Tam genislik, 400-520px yukseklik
- Icerik onerileri:
  1. **Ana banner:** "30 Yildir Iskenderun'un Perde Uzmani — Olcunuze Ozel Dikim" + CTA butonu "Urunleri Inceleyin"
  2. **Ozel dikim vurgusu:** "Her Pencereye Ozel, Her Eve Uygun" + hesap makinesi gorseli
  3. **Guven banneri:** "Kendi Atolyemizde, Kendi Elimizle Dikiyoruz" + atolye/uretim fotografi

**Gorsel Ihtiyaci:** Profesyonel fotograf cekimi veya yuksek kalite stok gorsel (yasam tarzi fotograflari, gorsel-kimlik.md'deki fotograf ilkelerine uygun)

### 2.2 Kategori Bolumu

**Oncelik:** Yuksek
**TAC Referansi:** 6 kategori ikonu (Tul, Fon, Stor vb.)

Urun kategorileri ikonlarla gosterilecek:
- **Tul Perde** — ikon/gorsel + link
- **Fon Perde** — ikon/gorsel + link
- **Blackout Perde** — ikon/gorsel + link
- **Saten** — ikon/gorsel + link

Her ikon:
- Net, temiz gorsel (beyaz arka plan uzerinde urun veya ikon)
- Kategori adi altta
- Tiklanabilir, ilgili kategori sayfasina yonlendirme

### 2.3 One Cikan Urunler

**Oncelik:** Orta
**TAC Referansi:** Anasayfada urun gridleri

- 4-8 adet one cikan urun (grid layout)
- Her kartta: urun gorseli, urun adi, fiyat bilgisi (metre fiyati)
- "Tum Urunleri Gor" butonu

### 2.4 Guven Bolumu

**Oncelik:** Yuksek
**TAC Referansi:** TAC'ta taksit rozeti, kargo bilgisi header'da

TAC'tan farkli olarak, Inanc Tekstil'in kendine has guven sinyalleri:
- **30 Yillik Tecrube** ikonu + kisa metin
- **Kendi Atolyemizde Imalat** ikonu + kisa metin
- **Olcuye Ozel Dikim** ikonu + kisa metin
- **Hatay'a Ucretsiz Kargo** (1000 TL ustu) ikonu + kisa metin

Bu bolum, TAC'in taksit/kargo badge'lerine karsilik, Inanc Tekstil'in farklilasmalarini on plana cikarir.

### 2.5 Hakkimizda Kisa Tanitim

**Oncelik:** Orta

Anasayfada kisa bir tanitim bolumu:
- Hatice ve Huseyin Ozdemirden'in hikayesi (2-3 cumle)
- Atolye/magaza fotografi
- "Hikayemizi Okuyun" butonu -> Hakkimizda sayfasina link
- Referans: [marka-kimligi.md](../brand/marka-kimligi.md)

---

## BOLUM 3: NAVIGASYON VE SAYFA YAPISI

### 3.1 Ana Menu Yapisi

**Oncelik:** Yuksek

Mevcut menu (5 item) yetersiz. Yeni yapi:

```
Ana Sayfa | Tul Perdeler | Fon Perdeler | Blackout | Saten | Hakkimizda | Iletisim
```

veya dropdown ile:

```
Ana Sayfa | Urunler (dropdown: Tul, Fon, Blackout, Saten) | Hakkimizda | Iletisim
```

- "Cookie Policy (EU)" menuden kaldirilacak (footer'a tasınacak)
- Mobilde hamburger menu

### 3.2 Hakkimizda Sayfasi Icerigi

**Oncelik:** Orta

Su an bos. Doldurulmasi gereken icerik:
- Marka hikayesi (marka-kimligi.md'den)
- Hatice ve Huseyin Ozdemirden tanitimi
- Atolye/magaza fotograflari
- 30 yillik tecrube vurgusu
- Fiziksel magaza adresi ve harita
- "Neden Bizi Secmelisiniz" bolumu (ozel dikim, kendi atolye, yerel hizmet)

### 3.3 Iletisim Sayfasi Icerigi

**Oncelik:** Yuksek

- Telefon numarasi
- WhatsApp numarasi (one cikarilmali — musteri iliskisi WhatsApp uzerinden yuruyor)
- E-posta adresi
- Fiziksel magaza adresi
- Google Maps embed
- Calisma saatleri
- Iletisim formu (WPForms veya Contact Form 7)

### 3.4 Yasal Sayfalar

**Oncelik:** Yuksek

Asagidaki sayfalar olusturulmali ve footer'a linklenecek:
- Iade ve Degisim Politikasi — icerik: [iade-politikasi.md](../legal/iade-politikasi.md)
- KVKK/Gizlilik Politikasi — icerik: [kvkk-gizlilik-politikasi.md](../legal/kvkk-gizlilik-politikasi.md)
- Mesafeli Satis Sozlesmesi — icerik: [mesafeli-satis-sozlesmesi.md](../legal/mesafeli-satis-sozlesmesi.md)
- On Bilgilendirme Formu — icerik: [on-bilgilendirme-formu.md](../legal/on-bilgilendirme-formu.md)
- Cerez Politikasi — icerik: [cerez-politikasi.md](../legal/cerez-politikasi.md)

> **Not:** Yasal metinler taslak haldedir. Hukuki danismana incelettirildikten sonra yayinlanmalidir.

---

## BOLUM 4: URUN KATALOGU VE URUN SAYFALARI

### 4.1 Urun Ekleme

**Oncelik:** Kritik
**Referans:** [product-catalog.md](../ecommerce/product-catalog.md)

Site su an urun icermiyor. Minimum baslangiic katalogu:
- 3-5 Tul Perde (farkli kumaslar/desenler)
- 3-5 Fon Perde (farkli kumaslar/renkler)
- 2-3 Blackout Perde
- 1-2 Saten

**Her urun icin gerekli:**
- Urun adi (tutarli adlandirma: `[Kumas Adi] [Tur] Perde`)
- Meta verileri: `_icc_product_type`, `_icc_price_per_meter`, `_icc_kartela_code`, `_icc_available_pleats`
- Minimum 2 fotograf (kumas detay + yasam tarzi/ortam)
- Aciklama metni (kumas ozellikleri, bakim talimatlari)
- Fiyat: metre fiyati (hesap makinesi uzerinden hesaplama)

**TAC'tan Alinan Dersler — Urun Adlandirma:**
TAC formati: `[Marka] [Model] Hazir [Tur] Perde [Renk] [Boyut]`
Inanc Tekstil icin uyarlama: `[Kumas/Model] [Tur] Perde — Ozel Dikim`
Ornek: `Lecino Tul Perde — Ozel Dikim`, `Bright Fon Perde Krem — Ozel Dikim`

### 4.2 Urun Sayfasi Duzeni

**Oncelik:** Yuksek
**TAC Referansi:** Renk swatchleri, beden butonlari, accordion detaylar

Inanc Tekstil'in urun sayfasi TAC'tan farklilasir cunku **ozel dikim + hesap makinesi** var:

```
+--------------------------------------------+
| Urun Gorselleri  |  Urun Adi              |
| (galeri)         |  Metre Fiyati: XX TL/m  |
|                  |                          |
|                  |  [PERDE HESAP MAKINESI]  |
|                  |  Pencere Eni: [___] cm   |
|                  |  Pile Orani: [v]         |
|                  |                          |
|                  |  Kumas: X.XX m           |
|                  |  Kumas Bedeli: XXX TL    |
|                  |  Dikim Ucreti: XXX TL    |
|                  |  TOPLAM: XXX TL          |
|                  |                          |
|                  |  [SEPETE EKLE]           |
+--------------------------------------------+
| Tab: Aciklama | Ozellikler | Bakim | Kargo |
+--------------------------------------------+
```

**Hesap Makinesi (mevcut plugin):** v2.0.0 kurulu ve calisiyor. Urun meta verileri dogru girildiginde otomatik aktif olacak.

**TAC'tan Alinacak UX Kaliplari:**

1. **Accordion Detay Bolumleri** (tab yerine veya tab icinde):
   - Urun Ozellikleri (kumas kompozisyonu, genislik, agirlik)
   - Bakim Talimatlari (yikama, utuleme)
   - Kargo ve Teslimat Bilgisi
   - Iade Politikasi ozeti

2. **Guven Bilgileri** (urun sayfasinda):
   - "Kendi atolyemizde dikilir"
   - "5-7 is gunu teslimat"
   - "Hatay icine ucretsiz kargo (1000 TL+)"

3. **Taksit Bilgisi** (PayTR aktif olunca):
   - "X ay taksit imkani" rozeti
   - TAC'in taksit tablosu benzeri gosterim

### 4.3 Urun Fotograflari

**Oncelik:** Kritik
**TAC Referansi:** 1500x1500 profesyonel urun fotograflari

Fotograf ihtiyaci:
- **Kumas Detay:** Her kumas icin yakin cekim (doku, desen, renk)
- **Ortam/Yasam Tarzi:** Perde asilmis halde, pencere onunde (dogal isik)
- **Boyut:** Minimum 1200x1200px, tercihen 1500x1500px
- **Format:** WebP (gorsel-kimlik.md'ye uygun)
- **Arka Plan:** Beyaz veya acik/notr (kumas detay icin); dogal ortam (yasam tarzi)

> **Onemli:** Urun fotograflari olmadan site acilamaz. Bu, en kritik beklenen icerik parcasidir.

### 4.4 Urun Listesi Sayfasi

**Oncelik:** Yuksek
**TAC Referansi:** Grid gorunum, filtreleme, siralama

WooCommerce varsayilan shop sayfasi iyilestirilecek:
- Grid gorunum (3-4 sutun masaustu, 2 sutun mobil)
- Kategori bazli filtreleme (sidebar veya ust filtre)
- Siralama: Fiyat (artan/azalan), En Yeniler, Populer
- Her urun kartinda: gorsel, ad, metre fiyati, "Detay" butonu

---

## BOLUM 5: OZEL DIKIM AVANTAJINI ONE CIKARMA

### 5.1 Rakiplerden Farklilasmma Stratejisi

**Oncelik:** Yuksek

TAC sadece **hazir perde** satar (sabit boyutlar: 140x260, 100x260 vb.). Inanc Tekstil'in en buyuk avantaji: **olcuye ozel dikim + hesap makinesi**.

Bu avantaj site genelinde vurgulanmali:
- Header'da veya hero'da "Olcunuze Ozel Dikim" mesaji
- Her urun sayfasinda hesap makinesi gorsel olarak one cikmali
- "Neden Ozel Dikim?" aciklama bolumu (anasayfa veya ayri sayfa)

### 5.2 "Neden Ozel Dikim?" Icerik Bolumu

Asagidaki icerigi anasayfada veya ayri sayfada kullan:

- **Hazir Perde Sorunu:** "Hazir perdeler sabit boyutlarda gelir. Pencereniz 2.70m ise ya kisa kalir ya da yere surunur."
- **Ozel Dikim Cozumu:** "Biz olcunuze gore dikeriz. 2.70m mi? Tam 2.70m dikeriz."
- **Hesap Makinesi:** "Pencere eninizi girin, pile oraninizi secin — fiyatinizi aninda gorun."
- **Kalite Guvencesi:** "30 yildir kendi atolyemizde, kendi elimizle dikiyoruz."

### 5.3 Kartela (Kumas Ornekleri) Entegrasyonu

**Oncelik:** Orta
**Referans:** [product-catalog.md](../ecommerce/product-catalog.md)

Fiziksel kartela sisteminin dijital yansimasi:
- Her kumas icin kartela kodu gorunur (ornek: `TUL-2024-A15`)
- Musteri magazada kumas ornegini gorebilir ("Magazamizda gorup dokunabilirsiniz")
- Ileride: kartela numarasiyla arama ozelligi

---

## BOLUM 6: GUVEN VE DONUSUM OPTIMIZASYONU

### 6.1 Guven Sinyalleri

**Oncelik:** Yuksek
**TAC Referansi:** Taksit rozeti, kargo bilgisi, iade linksi

Inanc Tekstil icin guven elemanlari:

**Header/Banner:**
- "30 Yildir Hizmetinizdeyiz"
- "Hatay Icine Ucretsiz Kargo (1000 TL+)"

**Urun Sayfasi:**
- "Kendi Atolyemizde Dikilir"
- "5-10 Is Gunu Teslimat"
- Taksit bilgisi (PayTR aktif olunca)
- Iade politikasi ozet linki

**Footer:**
- Odeme yontemi ikonlari (Visa, Mastercard, Troy)
- SSL guvenlik rozeti
- Fiziksel magaza adresi (somut varlik = guven)

### 6.2 WhatsApp Entegrasyonu

**Oncelik:** Yuksek

TAC Jetlink chat widget kullaniyor. Inanc Tekstil icin WhatsApp daha uygun (marka-kimligi.md'de belirtildigi gibi musteri iliskisi WhatsApp uzerinden yuruyor):
- Sabit WhatsApp butonu (sag alt kosede)
- "Soru sormak ister misiniz? WhatsApp'tan yazin" mesaji
- Eklenti onerisi: "Join.chat" veya "WhatsApp Chat" (ucretsiz WP eklentileri)

### 6.3 Taksit Bilgisi

**Oncelik:** Orta (PayTR aktif olunca)
**TAC Referansi:** Urun sayfasinda "X TL'den baslayan taksitlerle" rozeti

PayTR entegrasyonu tamamlaninca:
- Her urun sayfasinda taksit tablosu veya ozet
- Anasayfada "Taksit Imkani" banneri
- Odeme sayfasinda taksit secenekleri

---

## BOLUM 7: SEO VE ICERIK

### 7.1 Sayfa Basliklari ve Meta Aciklamalari

**Oncelik:** Yuksek

| Sayfa | Title Tag | Meta Description |
|-------|-----------|-----------------|
| Ana Sayfa | Inanc Tekstil — Olcuye Ozel Dikim Perde, Iskenderun | 30 yildir Iskenderun'da hizmet veren Inanc Tekstil. Tul, fon, blackout perde. Olcunuze ozel dikim, kendi atolyemizde imalat. |
| Tul Perdeler | Tul Perde Modelleri — Ozel Dikim | Inanc Tekstil | Ozel dikim tul perde cesitleri. Pencere olcunuze gore dikilir, evinize teslim edilir. |
| Fon Perdeler | Fon Perde Modelleri — Ozel Dikim | Inanc Tekstil | Fon perde secenekleri. Olcunuze ozel dikim, kaliteli kumas, profesyonel imalat. |
| Hakkimizda | Hakkimizda — Inanc Tekstil, 30 Yillik Tecrube | Hatice ve Huseyin Ozdemirden tarafindan kurulan Inanc Tekstil'in hikayesi. |
| Iletisim | Iletisim — Inanc Tekstil, Iskenderun | Inanc Tekstil magaza adresi, telefon, WhatsApp ve iletisim bilgileri. |

### 7.2 Urun SEO

**TAC Referansi:** Zengin urun bilgisi, yapilandirilmis veri

Her urun icin:
- SEO dostu URL: `/tul-perde/lecino-tul-perde-ozel-dikim/`
- Yapilandirilmis veri (Schema.org Product markup) — WooCommerce varsayilan destegi
- Alt text: her gorsel icin aciklayici Turkce alt metin
- Anahtar kelimeler: `[sehir] + [urun turu] + ozel dikim`
  - Ornek: "iskenderun tul perde ozel dikim", "hatay fon perde siparis"

### 7.3 Icerik Stratejisi

**Oncelik:** Dusuk (lansman sonrasi)

Blog/icerik fikirleri (uzun vadeli SEO):
- "Tul Perde Nasil Secilir? Rehber"
- "Fon Perde ile Blackout Perde Arasindaki Fark"
- "Perde Olcusu Nasil Alinir? Adim Adim"
- "Pile Orani Nedir? 1:2 mi 1:3 mu?"

---

## BOLUM 8: MOBIL OPTIMIZASYON

### 8.1 Responsive Tasarim

**Oncelik:** Yuksek

Hedef kitlenin buyuk kismi mobil kullanicilar (sosyal medya uzerinden gelecekler). Astra tema responsive destegi var, ancak kontrol edilecek noktalar:

- Hero banner mobilde okunabilir olmali
- Urun grid: 2 sutun mobil
- Hesap makinesi mobilde kullanilabilir olmali (inputlar yeterince buyuk)
- WhatsApp butonu mobilde kolayca erislebilir
- Hamburger menu duzgun calismali
- Footer mobilde tek sutun

### 8.2 Performans

- Gorseller WebP formatinda, lazy loading aktif
- Redis cache zaten yapilandirilmis (docker-compose.yml)
- Astra tema hafif — performans avantaji
- Google PageSpeed Insights ile test edilmeli (hedef: mobil 80+)

---

## BOLUM 9: TEKNIK GOREVLER

### 9.1 WooCommerce Yapilandirma

**Referans:** [woocommerce-setup.md](../ecommerce/woocommerce-setup.md)

- [ ] Turkce dil ayarlari kontrol
- [ ] TL para birimi ayari kontrol
- [ ] Vergi ayarlari (%20 KDV)
- [ ] Kargo bolgeleri yapilandirmasi (sadece Hatay) — [shipping-delivery.md](../ecommerce/shipping-delivery.md)
- [ ] WooCommerce e-posta sablonlari Turkce ve ozellestirilmis
- [ ] "Coming soon" modu lansman oncesi kapatilacak

### 9.2 Eklenti Kontrolleri

- [ ] Redis Object Cache aktif ve calisiyor
- [ ] Complianz Turkce'ye cevrilmis
- [ ] WP Mail SMTP yapilandirilmis (siparis bildirim e-postalari)
- [ ] Site Kit / Google Analytics baglantisi
- [ ] Guvenlik eklentisi (Wordfence) kurulumu
- [ ] WhatsApp chat eklentisi kurulumu

### 9.3 Admin Guvenligi

- [ ] Admin 2FA aktif
- [ ] wp-admin erisimine IP kisitlamasi (Traefik middleware ile)
- [ ] Guclu sifre politikasi

---

## UYGULAMA SIRASI (Oncelik Haritasi)

### Faz 1: Temel Altyapi (Hemen)
1. Astra tema renk/tipografi ayarlari (gorsel-kimlik.md)
2. Cerez banneri Turkce duzeltmesi
3. Navigasyon menu yapisi duzeltmesi
4. Footer icerik ve yapi duzeltmesi
5. Gecici logo (metin tabanli)

### Faz 2: Icerik ve Sayfalar (1-2 Hafta)
1. Hakkimizda sayfasi icerigi
2. Iletisim sayfasi icerigi
3. Yasal sayfalar (avukat incelemesinden sonra)
4. Ana sayfa hero ve guven bolumu

### Faz 3: Urun Katalogu (2-4 Hafta — KRITIK)
1. **Urun fotograflarinin cekilmesi** (en kritik darbogazz)
2. Ilk urun partisinin girilmesi (10-15 urun)
3. Urun sayfasi duzeni ve hesap makinesi testi
4. Kategori sayfalari duzenlenmesi

### Faz 4: Donusum Optimizasyonu (Lansman Oncesi)
1. WhatsApp entegrasyonu
2. Guven sinyalleri yerlesimleri
3. PayTR taksit gosterimi (onay bekleniyor)
4. Mobil test ve optimizasyon
5. Performans testi

### Faz 5: Lansman
1. SEO ayarlari finalize
2. Google Analytics/Search Console dogrulama
3. Son test (masaustu + mobil)
4. "Coming soon" modu kapatma
5. Sosyal medya duyurusu

---

## TAC'TAN ALINMAYACAK SEYLER

TAC buyuk olcekli bir e-ticaret platformu (Inveon altyapisi, Next.js/React SSR, CDN, chat widget). Inanc Tekstil kucuk bir aile isletmesi. Her sey kopyalanmamali:

| TAC Ozelligi | Inanc Tekstil Karari | Neden |
|--------------|---------------------|-------|
| Mega menu | Basit dropdown yeterli | 4 kategori var, mega menu gereksiz |
| Aninda Perde servisi | Uygulanmayacak | Farkli is modeli |
| Karmasik filtreleme | Basit kategori/siralama | Urun sayisi az |
| Jetlink chat widget | WhatsApp butonu | Musteri zaten WhatsApp kullaniyor |
| Marka bazli filtreleme | Gereksiz | Tek marka/atolye |
| 10 bannerlik carousel | 2-3 banner yeterli | Az icerik ile carousel anlamsiz |
| SSR/Next.js | WordPress/WooCommerce | Mevcut altyapi uygun ve yeterli |

---

## SONUC

Inanc Tekstil'in en buyuk avantaji **ozel dikim hesap makinesi** ve **30 yillik yerel guven**. TAC benchmark'i bize profesyonel e-ticaret standartlarini gosterdi ama bire bir kopyalanmamali. Odak noktalari:

1. **Profesyonel gorunum:** Temiz tema, tutarli renkler, duzgun tipografi
2. **Guven sinyalleri:** 30 yil, kendi atolye, fiziksel magaza, WhatsApp erisimi
3. **Ozel dikim vurgusu:** Her firsatta "olcunuze ozel" mesaji
4. **Urun fotograflari:** En kritik darbogazz — fotografsiz lansman yapilamaz
5. **Basitlik:** Kucuk isletme icin basit ama profesyonel cozumler

> **En Kritik Darbogaz:** Urun fotograflari. Tum teknik yapilandirma tamamlansa bile, profesyonel urun fotograflari olmadan site acilamaz. Fotograf cekimi planlanmali ve once baslattilmali.
