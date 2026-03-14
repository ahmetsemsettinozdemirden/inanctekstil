# Mesafeli Satis Sozlesmesi Rehberi

Bu dokuman, Inanc Tekstil e-ticaret sitesi icin 6502 sayili Tuketicinin Korunmasi Hakkinda Kanun ve Mesafeli Sozlesmeler Yonetmeligi kapsaminda zorunlu olan Mesafeli Satis Sozlesmesi'nin hazirlanmasina iliskin rehberdir.

> **UYARI:** Bu dokumandaki taslak metin hukuki danismanlik yerine gecmez. Bir avukat tarafindan incelenmeli ve isletmenize ozel olarak uyarlanmalidir.

---

## Yasal Dayanak

- **6502 sayili Tuketicinin Korunmasi Hakkinda Kanun** -- Ozellikle Madde 48 (mesafeli sozlesmeler) ve Madde 15 (cayma hakki istisnalari)
- **Mesafeli Sozlesmeler Yonetmeligi** (Resmi Gazete: 27.11.2014, Sayi: 29188)
- **6563 sayili Elektronik Ticaretin Duzenlenmesi Hakkinda Kanun**

---

## Mesafeli Satis Sozlesmesinin Onemi

Turkiye'de internet uzerinden satis yapan tum isletmeler, tuketiciyle mesafeli satis sozlesmesi akdetmek zorundadir. Bu sozlesme:

1. Tuketiciyi satin aldigi urun ve kosullar hakkinda bilgilendirir
2. Saticiyi yasal yukumluluklere uyumlu kilar
3. Olasi uyusmazliklarda delil niteliginde kullanilir
4. WooCommerce checkout sayfasinda tuketici tarafindan onaylanmalidir

---

## Sozlesmede Bulunmasi Zorunlu Unsurlar

Mesafeli Sozlesmeler Yonetmeligi Madde 5 ve 6 uyarinca, sozlesmede asagidaki bilgiler yer almalidir:

### 1. Satici Bilgileri
- Isletme unvani
- Acik adres
- Telefon, faks (varsa), e-posta
- Mersis numarasi (varsa)
- Vergi dairesi ve numarasi

### 2. Urun Bilgileri
- Malin/hizmetin temel nitelikleri
- Siparis uzerine uretilen urunlerde: kumas cinsi, renk, model, olculer

### 3. Fiyat Bilgileri
- Tum vergiler dahil toplam fiyat
- Varsa ek masraflar (kargo, kurulum vb.)
- Odeme sekli ve plani

### 4. Teslimat Bilgileri
- Teslimat sekli
- Tahmini teslimat suresi
- Kargo firmasi bilgisi
- Teslimat adresi

### 5. Cayma Hakki Bilgileri
Bu kisim ozellikle onemlidir. Inanc Tekstil icin iki durum soz konusudur:

#### Ozel Siparis Urunler (Olcuye Ozel Perde)

**6502 sayili Kanun Madde 15/1-c** uyarinca:

> "Tuketicinin istekleri veya kisisel ihtiyaclari dogrultusunda hazirlanan mallara iliskin sozlesmelerde" cayma hakki kullanilamaz.

Olcuye ozel uretilen perdeler bu kapsama girer. Sozlesmede bu istisna acikca belirtilmelidir.

#### Hazir Urunler (Eger satiliyorsa)

Standart olculerde, olcuye ozel uretilmeyen hazir urunler satiliyorsa, bunlar icin 14 gunluk cayma hakki gecerlidir.

### 6. Sikayet ve Itiraz Yollari
- Musteri hizmetleri iletisim bilgileri
- Tuketici hakem heyetleri
- Tuketici mahkemeleri
- Tuketici hakem heyeti parasal sinirlari (guncel rakamlar kontrol edilmelidir)

---

## WooCommerce Uygulama Yontemi

### Sozlesme Gosterimi

1. **Checkout sayfasinda** siparis ozeti ile birlikte sozlesme metni gosterilmelidir
2. Tuketici, sozlesmeyi okudugunu ve kabul ettigini belirten bir **onay kutusu** isaretlemelidir
3. Onay kutusu isaretlenmeden siparis tamamlanamamalidir

### Teknik Uygulama Secenekleri

- **WooCommerce Varsayilan:** WooCommerce > Ayarlar > Gelismis > Sayfa Ayarlari > "Sartlar ve Kosullar" sayfasi olarak bir WordPress sayfasi secebilirsiniz
- **Eklenti Secenekleri:**
  - YITH WooCommerce Terms and Conditions Popup
  - WooCommerce Terms and Conditions Popup (sozlesmeyi popup olarak gosterir)
  - Germanized / WooCommerce EU Compliance (Avrupa/Turkiye uyumu icin)

### Dinamik Icerik

Sozlesme metninde siparis bazinda degisen bilgiler yer almalidir:
- Musteri adi, adresi
- Siparis edilen urunler ve detaylari
- Toplam tutar
- Siparis tarihi

Bu bilgiler WooCommerce shortcode veya ozel sablonlarla dinamik olarak doldurulabilir.

---

## Ozel Siparis (Custom-Made) Urunlerde Dikkat Edilecek Hususlar

Inanc Tekstil'in temel urun grubu ozel siparis uzerine uretilen perdelerdir. Bu durum sozlesmede ozellikle vurgulanmalidir:

1. **Urunun ozel siparis oldugu acikca belirtilmeli:** "Bu urun, musterinin belirttigi olcu ve tercihlere gore ozel olarak uretilmektedir."
2. **Cayma hakki istisnasi vurgulanmali:** Madde 15/1-c referansiyla, ozel siparis urunlerde cayma hakkinin bulunmadigi yazilmali
3. **Onay mekanizmasi:** Musterinin olculeri ve tercihleri onayladigi bir adim bulunmali
4. **Hata durumu:** Satici kaynakli hatalar (yanlis kumas, yanlis olcu vb.) icin iade/degisim kosullari ayrica belirtilmeli

---

## TASLAK Mesafeli Satis Sozlesmesi Metni

> **TASLAK -- Hukuki danismanlik alinarak ozellesitirilmelidir**

Asagidaki metin, WooCommerce checkout sayfasinda ve/veya ayri bir sayfada yayinlanacak mesafeli satis sozlesmesinin taslak halidir.

---

### MESAFELI SATIS SOZLESMESI

**Madde 1 -- TARAFLAR**

**SATICI:**
- Unvan: [ISLETME TAM UNVANI]
- Adres: [TAM ADRES], Iskenderun, Hatay
- Telefon: [TELEFON NUMARASI]
- E-posta: [E-POSTA ADRESI]
- Vergi Dairesi / No: [VERGI DAIRESI] / [VERGI NUMARASI]
- Mersis No: [VARSA MERSIS NUMARASI]

**ALICI (TUKETICI):**
- Ad Soyad: [SIPARIS FORMUNDAN ALINACAK]
- Adres: [SIPARIS FORMUNDAN ALINACAK]
- Telefon: [SIPARIS FORMUNDAN ALINACAK]
- E-posta: [SIPARIS FORMUNDAN ALINACAK]

**Madde 2 -- KONU**

Isbu sozlesmenin konusu, ALICI'nin SATICI'ya ait [WEB SITESI ADRESI] internet sitesinden elektronik ortamda siparisini verdigi asagida nitelikleri ve satis fiyati belirtilen urunun/urunlerin satisi ve teslimi ile ilgili olarak 6502 sayili Tuketicinin Korunmasi Hakkinda Kanun ve Mesafeli Sozlesmeler Yonetmeligi hukumleri geregi taraflarin hak ve yukumluluklerinin belirlenmesidir.

ALICI, SATICI'nin ismi, adresi, urunun temel ozellikleri, vergiler dahil fiyati, odeme ve teslimat bilgilerine iliskin on bilgilendirmeyi okuyup bilgi sahibi oldugunu ve elektronik ortamda gerekli onay teyidini verdikten sonra satin alma islemini gerceklestirdigini kabul ve beyan eder.

**Madde 3 -- SOZLESME KONUSU URUN BILGILERI**

Urunun temel ozellikleri (turu, miktari, kumaş cinsi, renk/desen, modeli, olculeri) SATICI'ya ait internet sitesinde yer almaktadir. Urunun temel ozelliklerini kampanya surecinde SATICI degistirebilir; bu degisiklik satis oncesinde guncellenir.

| Bilgi | Detay |
|---|---|
| Urun Adi/Tanimi | [SIPARIS DETAYINDAN ALINACAK] |
| Kumas Cinsi | [SIPARIS DETAYINDAN ALINACAK] |
| Renk/Desen | [SIPARIS DETAYINDAN ALINACAK] |
| Olculer (En x Boy) | [SIPARIS DETAYINDAN ALINACAK] |
| Adet | [SIPARIS DETAYINDAN ALINACAK] |
| Dikim/Model Detayi | [SIPARIS DETAYINDAN ALINACAK] |
| Birim Fiyat (KDV dahil) | [SIPARIS DETAYINDAN ALINACAK] |
| Kargo Ucreti | [SIPARIS DETAYINDAN ALINACAK] |
| Toplam Tutar (KDV dahil) | [SIPARIS DETAYINDAN ALINACAK] |

**Bu urun, ALICI'nin belirttigi olcu ve tercihlere gore ozel olarak uretilecek olup standart bir raf urunu degildir.**

**Madde 4 -- ODEME BILGILERI**

| Bilgi | Detay |
|---|---|
| Odeme Yontemi | Kredi Karti / Banka Karti (PayTR uzerinden) |
| Taksit Sayisi | [SIPARIS DETAYINDAN ALINACAK] |
| Toplam Odeme Tutari | [SIPARIS DETAYINDAN ALINACAK] TL (KDV dahil) |

Odeme islemleri, PCI DSS sertifikali PayTR odeme altyapisi uzerinden guvenli sekilde gerceklestirilmektedir. Kredi karti bilgileri SATICI tarafindan saklanmamaktadir.

**Madde 5 -- TESLIMAT BILGILERI**

| Bilgi | Detay |
|---|---|
| Teslimat Adresi | [SIPARIS FORMUNDAN ALINACAK] |
| Teslim Alacak Kisi | [SIPARIS FORMUNDAN ALINACAK] |
| Teslimat Sekli | Kargo ile kapiya teslim |
| Tahmini Teslimat Suresi | Siparis onayindan itibaren [X] is gunu |
| Kargo Firmasi | [KARGO FIRMASI ADI] |

SATICI, siparis konusu urunu eksiksiz, siparis detaylarinda belirtilen niteliklere uygun ve varsa garanti belgeleri ile teslim etmeyi kabul ve taahhut eder.

Teslimat, stok durumu ve uretim sureci dahilinde, siparis tarihinden itibaren en gec 30 (otuz) gun icerisinde yapilir. Uretim sureci tamamlandiktan sonra urun kargoya verilir ve ALICI'ya kargo takip bilgisi iletilir.

**Madde 6 -- CAYMA HAKKI**

6.1. **Ozel siparis uzerine uretilen urunlerde cayma hakki:**

Isbu sozlesme kapsamindaki urunler, ALICI'nin istekleri ve kisisel ihtiyaclari dogrultusunda ozel olarak uretilmektedir. 6502 sayili Tuketicinin Korunmasi Hakkinda Kanun'un 15. maddesinin 1. fikrasinin (c) bendi uyarinca:

*"Tuketicinin istekleri veya kisisel ihtiyaclari dogrultusunda hazirlanan mallara iliskin sozlesmelerde"*

cayma hakki kullanilamaz.

Bu nedenle, ALICI ozel siparis uzerine uretilen perde urunleri icin 14 gunluk cayma hakkini kullanamaz.

6.2. **ALICI, siparis oncesinde bu hususu acikca kabul ettigini beyan eder.**

6.3. Bu madde, SATICI kaynakli hatalar (yanlis kumas gonderimi, uretim hatasi, SATICI kaynakli olcu hatasi) durumlarinda ALICI'nin haklarini sinirlandirmaz. Bu durumlarda SATICI'nin iade politikasi gecerlidir.

**Madde 7 -- SATICI KAYNAKLI HATALAR VE IADE**

Asagidaki durumlarda ALICI, urunu iade edebilir veya yeniden uretim talep edebilir:

a) Siparis edilen kumas cinsi veya renk/desen ile farkli bir kumas/renk/desen gonderilmesi
b) Uretimden kaynaklanan hata, kusur veya defolu urun teslimi
c) SATICI kaynakli olcu hatasi (ALICI'nin belirttigi olculerden farkli uretim yapilmasi)
d) Nakliye sirasinda olusan hasar

Bu durumlarda ALICI, teslim tarihinden itibaren 7 (yedi) gun icerisinde SATICI'yi bilgilendirmelidir. Detayli iade kosullari icin SATICI'nin iade politikasi gecerlidir.

**Madde 8 -- GENEL HUKUMLER**

8.1. ALICI, SATICI'ya ait internet sitesinde sozlesme konusu urune iliskin on bilgileri (temel ozellikler, satis fiyati, odeme sekli, teslimat kosullari vb.) okuyup bilgi sahibi oldugunu ve elektronik ortamda gerekli teyidi verdikten sonra siparis verdigini kabul ve beyan eder.

8.2. Urun, ALICI'dan baska bir kisi/kuruluşa teslim edilecek olsa dahi, SATICI teslimat ile ilgili yukumlulugunu tam ve eksiksiz olarak yerine getirmis kabul edilir.

8.3. SATICI, sozlesme konusu urunun saglam, eksiksiz, siparis detaylarinda belirtilen niteliklere uygun tesliminden sorumludur.

8.4. SATICI, siparis konusu urun veya hizmetin yerine getirilmesinin imkansizlastigini ileri surerek sozlesme konusu yukumluluklerini yerine getiremezse, bu durumu ogrendigi tarihten itibaren 3 (uc) gun icerisinde ALICI'ya bildirir ve varsa alinan tum odemeleri bildirim tarihinden itibaren en gec 14 (on dort) gun icerisinde iade eder.

8.5. Sozlesme konusu urunun teslimatinin, ALICI'dan kaynaklanmayan nedenlerle gerceklesememesi halinde, SATICI durumu ALICI'ya bildirir ve gerekli iade islemlerini baslatir.

**Madde 9 -- UYUSMAZLIK COZUMU**

Isbu sozlesmeden dogan uyusmazliklarda, ALICI'nin mal veya hizmeti satin aldigi veya ikametgahinin bulundugu yerdeki Il veya Ilce Tuketici Hakem Heyetleri ile Tuketici Mahkemeleri yetkilidir.

Tuketici Hakem Heyeti'ne basvuru siniri her yil guncellenmektedir. Guncel sinirlar icin Ticaret Bakanligi web sitesi kontrol edilmelidir.

**Madde 10 -- YURURLUK**

ALICI, isbu sozlesmede yazili tum kosullari ve aciklamalari okuyup bilgi sahibi olarak kabul ettigini ve siparis formunda onay teyidini verdikten sonra sozlesmenin yururluge girmis olacagini beyan eder.

**Sozlesme Tarihi:** [SIPARIS TARIHI]

**SATICI:** Inanc Tekstil
**ALICI:** [MUSTERI ADI SOYADI]

---

*ALICI, isbu mesafeli satis sozlesmesinin tum maddelerini okudugunu, anladigini ve kabul ettigini, sozlesme konusu urununun ozel siparis uzerine uretilecek olmasi nedeniyle cayma hakkinin bulunmadigini bildigini elektronik ortamda onaylamistir.*
