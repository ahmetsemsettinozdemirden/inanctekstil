# Yasal Gereksinimler ve Uyumluluk Dokumantasyonu

Bu dizin, **Inanc Tekstil** e-ticaret sitesinin Turk mevzuatina uyumlu sekilde isletilmesi icin gerekli yasal dokumanlarin rehberlerini ve taslak sablonlarini icerir.

> **UYARI:** Bu dokumanlardaki taslak metinler hukuki danismanlik yerine gecmez. Tum sablonlar bir avukat tarafindan incelenmeli ve isletmenize ozel olarak uyarlanmalidir.

---

## Isletme Bilgileri

- **Isletme Adi:** Inanc Tekstil
- **Faaliyet Alani:** Ozel olcule ve siparis uzerine perde imalati ve satisi (home textiles)
- **Konum:** Iskenderun, Hatay, Turkiye
- **Satis Kanali:** WooCommerce uzerinden e-ticaret
- **Odeme Altyapisi:** PayTR
- **Cerez Yonetimi:** Complianz eklentisi
- **Analitik Araclari:** Google Analytics 4 (GA4), Meta Pixel
- **E-posta Servisi:** Resend

---

## Yasal Gereksinimler Ozeti

Turkiye'de e-ticaret faaliyeti yurutmek icin asagidaki yasal yukumluluklerin yerine getirilmesi zorunludur:

### 1. KVKK Uyumlulugu (Kisisel Verilerin Korunmasi)

**Dayanak:** 6698 sayili Kisisel Verilerin Korunmasi Kanunu (KVKK)

Turkiye'nin kisisel verilerin korunmasina iliskin temel kanunudur. AB'deki GDPR'in muadilidir. E-ticaret sitelerinin:

- Kisisel veri isleme amaclarini acikca belirtmesi
- Musterilerden acik riza almasi
- Veri saklama surelerini belirlemesi
- Veri sahibi haklarini tanimasi ve bu haklarin kullanilmasi icin mekanizma sunmasi
- Veri Sorumlusu olarak VERBIS'e kayit olmasi

gerekir.

**Dokuman:** [KVKK Gizlilik Politikasi Rehberi](./kvkk-gizlilik-politikasi.md)

### 2. Mesafeli Satis Sozlesmesi

**Dayanak:** 6502 sayili Tuketicinin Korunmasi Hakkinda Kanun, Mesafeli Sozlesmeler Yonetmeligi

Turkiye'de mesafeli satis yapan tum isletmelerin, satis oncesinde tuketiciyle bir mesafeli satis sozlesmesi akdetmesi zorunludur. Bu sozlesme:

- Satici bilgilerini
- Urun ozelliklerini ve fiyatini
- Teslimat kosullarini
- Cayma hakki bilgisini

icermelidir. **Onemli:** Ozel siparis uzerine uretilen urunler (perde gibi) cayma hakkindan muaftir (Madde 15).

**Dokuman:** [Mesafeli Satis Sozlesmesi Rehberi](./mesafeli-satis-sozlesmesi.md)

### 3. Iade ve Degisim Politikasi

**Dayanak:** 6502 sayili Kanun, Madde 15 -- Cayma Hakki Istisnalari

Siparis uzerine uretilen (olcuye ozel) urunler, standart 14 gunluk cayma hakkindan muaftir. Ancak:

- Uretim hatasi
- Yanlis kumas gonderimi
- Satici kaynakli olcu hatasi

gibi durumlarda iade/degisim yapilmasi hem yasal zorunluluk hem de musteri memnuniyeti acisindan gereklidir.

**Dokuman:** [Iade Politikasi Rehberi](./iade-politikasi.md)

### 4. Cerez Politikasi

**Dayanak:** 6698 sayili KVKK, 5809 sayili Elektronik Haberlesme Kanunu

Web sitesinde kullanilan cerezler hakkinda kullanicilarin bilgilendirilmesi ve gerekli kategorilerde acik riza alinmasi zorunludur.

**Dokuman:** [Cerez Politikasi Rehberi](./cerez-politikasi.md)

### 5. On Bilgilendirme Formu

**Dayanak:** Mesafeli Sozlesmeler Yonetmeligi, Madde 5

Tuketicinin siparisi onaylamadan once, urun ve satis kosullari hakkinda acik ve anlasilir sekilde bilgilendirilmesi zorunludur. Bu form, WooCommerce checkout sayfasinda odeme oncesi gosterilmelidir.

**Dokuman:** [On Bilgilendirme Formu Rehberi](./on-bilgilendirme-formu.md)

---

## Teknik Uygulama Kontrol Listesi

Asagidaki maddeler WooCommerce sitesinde uygulanmalidir:

| Gereksinim | Konum | Durum |
|---|---|---|
| Gizlilik Politikasi sayfasi | Site altbilgisi (footer) + kayit/siparis formlari | [ ] |
| Mesafeli Satis Sozlesmesi | Checkout sayfasinda onay kutusu | [ ] |
| On Bilgilendirme Formu | Checkout sayfasinda odeme oncesi gorunum | [ ] |
| Iade Politikasi sayfasi | Site altbilgisi (footer) + urun sayfalari | [ ] |
| Cerez Politikasi sayfasi | Cerez banneri uzerinden erisim | [ ] |
| Cerez onay banneri (Complianz) | Tum sayfalarda | [ ] |
| KVKK acik riza onay kutusu | Kayit ve siparis formlari | [ ] |
| Veri sorumlusu iletisim bilgileri | Gizlilik politikasi sayfasi | [ ] |
| VERBIS kaydi | kvkk.gov.tr | [ ] |

---

## Ilgili Mevzuat Linkleri

- [6698 sayili KVKK](https://www.mevzuat.gov.tr/mevzuatmetin/1.5.6698.pdf)
- [6502 sayili Tuketicinin Korunmasi Hakkinda Kanun](https://www.mevzuat.gov.tr/mevzuatmetin/1.5.6502.pdf)
- [Mesafeli Sozlesmeler Yonetmeligi](https://www.resmigazete.gov.tr/eskiler/2014/11/20141127-6.htm)
- [6563 sayili Elektronik Ticaretin Duzenlenmesi Hakkinda Kanun](https://www.mevzuat.gov.tr/mevzuatmetin/1.5.6563.pdf)
- [KVKK Veri Sorumlusu Sicil Bilgi Sistemi (VERBIS)](https://verbis.kvkk.gov.tr/)

---

## Dosya Dizini

| Dosya | Icerik |
|---|---|
| [README.md](./README.md) | Bu dosya -- genel bakis ve indeks |
| [kvkk-gizlilik-politikasi.md](./kvkk-gizlilik-politikasi.md) | KVKK uyumlu gizlilik politikasi rehberi ve taslak |
| [mesafeli-satis-sozlesmesi.md](./mesafeli-satis-sozlesmesi.md) | Mesafeli satis sozlesmesi rehberi ve taslak |
| [iade-politikasi.md](./iade-politikasi.md) | Iade/degisim politikasi rehberi ve taslak |
| [cerez-politikasi.md](./cerez-politikasi.md) | Cerez politikasi rehberi ve taslak |
| [on-bilgilendirme-formu.md](./on-bilgilendirme-formu.md) | On bilgilendirme formu rehberi ve taslak |
