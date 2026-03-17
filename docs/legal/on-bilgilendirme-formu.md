# On Bilgilendirme Formu Rehberi

Bu dokuman, Inanc Tekstil e-ticaret sitesi icin Mesafeli Sozlesmeler Yonetmeligi kapsaminda zorunlu olan On Bilgilendirme Formu'nun hazirlanmasina ve Shopify'da uygulanmasina iliskin rehberdir.

> **UYARI:** Bu dokumandaki taslak metin hukuki danismanlik yerine gecmez. Bir avukat tarafindan incelenmeli ve isletmenize ozel olarak uyarlanmalidir.

---

## Yasal Dayanak

- **6502 sayili Tuketicinin Korunmasi Hakkinda Kanun, Madde 48** -- Mesafeli sozlesmelerde on bilgilendirme yukumlulugu
- **Mesafeli Sozlesmeler Yonetmeligi, Madde 5** -- On bilgilendirme yukumlulugu detaylari
- **Mesafeli Sozlesmeler Yonetmeligi, Madde 6** -- On bilgilendirmenin yapilma sekli

---

## On Bilgilendirme Formu Nedir?

On Bilgilendirme Formu, mesafeli satis yapan saticilar tarafindan **tuketicinin siparisi kesinlestirmesinden once** sunulmasi zorunlu olan bir bilgilendirme dokumanidir. Bu form, tuketicinin satin alacagi urun, fiyat, teslimat kosullari ve haklari hakkinda acik ve anlasilir sekilde bilgilendirilmesini amaclar.

### Neden Zorunlu?

1. **Yasal zorunluluk:** Mesafeli Sozlesmeler Yonetmeligi Madde 5 uyarinca tuketici, sozlesme kurulmadan once bilgilendirilmelidir
2. **Ispat yukumlulugu:** On bilgilendirmenin yapildigini ispat yukumlulugu saticicaya aittir
3. **Sozlesme gecerliligi:** On bilgilendirme yapilmadan kurulan mesafeli sozlesmelerde tuketici ilave haklara sahip olabilir
4. **Idari yaptirim:** Bilgilendirme yukumlulugune aykiri davranan saticilara idari para cezasi uygulanabilir

---

## On Bilgilendirme Formunda Bulunmasi Gereken Bilgiler

Mesafeli Sozlesmeler Yonetmeligi Madde 5 uyarinca asagidaki bilgiler yer almalidir:

### 1. Satici Bilgileri
- Satici isletmenin adi/unvani
- Satici isletmenin acik adresi
- Telefon numarasi
- Varsa faks numarasi
- E-posta adresi
- Mersis numarasi (varsa)
- Vergi dairesi ve numarasi

### 2. Urun Bilgileri
- Malin/hizmetin temel ozellikleri
- Ozel siparis perdeler icin: kumas cinsi, renk/desen, model, olculer (en x boy)

### 3. Fiyat Bilgileri
- Tum vergiler (KDV) dahil toplam satis fiyati
- Varsa kargo/teslimat ucreti
- Varsa ek masraflar
- Toplam odeme tutari
- Taksitli satislarda: taksit sayisi, taksit tutarlari, toplam taksitli fiyat

### 4. Odeme Bilgileri
- Odeme yontemi
- Odeme tarihi/zamanlamasi

### 5. Teslimat Bilgileri
- Teslimat/ifa sekli
- Teslimata iliskin tahmini sure (uretim + kargo)
- Kargo firmasi (biliniyorsa)

### 6. Cayma Hakki Bilgileri
- Cayma hakki kullanilabilecek durumlar ve sure (14 gun)
- Cayma hakkinin kullanim sekli ve bildirimin yapilacagi adres/iletisim bilgisi
- **Ozel siparis urunlerde: Cayma hakkinin kullanilamayacagi ve bunun yasal dayanagi**
- Cayma hakki istisnasinin tuketiciye acikca bildirilmesi

### 7. Sikayet ve Basvuru Yollari
- Musteri hizmetleri iletisim bilgileri
- Tuketici Hakem Heyeti basvuru hakki
- Tuketici Mahkemesi basvuru hakki

### 8. Diger Bilgiler
- Sozlesmenin suresi (varsa belirli sureli ise)
- Tuketicinin talep ve sikayetlerini iletebilecegi iletisim bilgileri
- Uyusmazlik halinde yetkili merci

---

## Shopify Uygulama Yontemi

### Yontem 1: Shopify Politikalar Sayfasi

Shopify'in dahili politika ozelligi kullanilabilir:

1. **Shopify Admin > Ayarlar > Politikalar** bolumunden on bilgilendirme metnini girin
2. **Shopify Admin > Ayarlar > Odeme** bolumunden checkout sayfasinda hizmet sartlari onay kutusunu etkinlestirin
3. Checkout sayfasinda otomatik olarak onay kutusu gorunecektir

**Eksiklik:** Bu yontem statik bir metin gosterir; siparis bazinda degisen bilgileri (urun detaylari, toplam tutar vb.) otomatik dolduramaz.

### Yontem 2: Dinamik On Bilgilendirme Formu (Onerilen)

Siparis bazinda degisen bilgilerin otomatik doldurulmasi icin:

#### a) Shopify Liquid Sablonlari

Shopify checkout sayfasi Liquid sablonlari ile ozellestirilip siparis bazinda degisen bilgiler (urun detaylari, toplam tutar, musteri bilgileri) otomatik olarak doldurulabilir.

#### b) Shopify Uygulamalari

- **Consentmo** -- GDPR/KVKK uyumlu cerez banneri ve yasal sayfalar
- **Pandectes GDPR Compliance** -- AB/Turkiye uyumlulugu icin kapsamli cozum

### Yontem 3: Siparis Onay E-postasinda

On bilgilendirme formunun bir kopyasi siparis onay e-postasinda da gonderilebilir. Bu, ispat acisindan ek bir guvenlik katmani saglar.

### Teknik Notlar

- On bilgilendirme formu, **odeme butonu tiklanmadan once** gorunur olmalidir
- Tuketici, formu okudugunu belirten bir onay kutusu isaretlemelidir
- Onay kutusu isaretlenmeden siparis tamamlanamamalidir
- Onay bilgisi, siparis kayitlarinda saklanmalidir (ispat icin)

---

## Ozel Siparis Urunler Icin Ozel Hususlar

Inanc Tekstil'in perdeler gibi ozel siparis urunleri icin on bilgilendirme formunda ozellikle dikkat edilmesi gerekenler:

1. **Ozel siparis niteligi acikca belirtilmeli:** "Bu urun, tarafinizca belirlenen olcu ve tercihlere gore ozel olarak uretilecektir."
2. **Cayma hakki istisnasi vurgulanmali:** "6502 sayili Kanun'un 15. maddesi uyarinca, ozel siparis uzerine uretilen urunlerde cayma hakki kullanilamaz."
3. **Olcu ve tercih onay:** Musterinin belirledigi olculerin ve tercihlerin dogru oldugunu onayladigi bir mekanizma olmali
4. **Uretim sureci bilgisi:** Siparis uzerine uretim yapilacagi ve tahmini uretim suresinin belirtilmesi

---

## TASLAK On Bilgilendirme Formu Metni

> **TASLAK -- Hukuki danismanlik alinarak ozellesitirilmelidir**

Asagidaki metin, Shopify checkout sayfasinda siparis onayindan once gosterilecek on bilgilendirme formunun taslak halidir. Koseli parantez `[...]` icindeki dinamik alanlar siparis bilgileriyle doldurulmalidir.

---

### ON BILGILENDIRME FORMU

(6502 sayili Tuketicinin Korunmasi Hakkinda Kanun ve Mesafeli Sozlesmeler Yonetmeligi uyarinca)

---

#### 1. SATICI BILGILERI

| Bilgi | Detay |
|---|---|
| Unvan | [ISLETME TAM UNVANI] |
| Adres | [TAM ADRES], Iskenderun, Hatay |
| Telefon | [TELEFON NUMARASI] |
| E-posta | [E-POSTA ADRESI] |
| Vergi Dairesi / No | [VERGI DAIRESI] / [VERGI NUMARASI] |
| Mersis No | [VARSA MERSIS NUMARASI] |

#### 2. URUN BILGILERI

| Bilgi | Detay |
|---|---|
| Urun Adi | [SIPARIS DETAYINDAN] |
| Kumas Cinsi | [SIPARIS DETAYINDAN] |
| Renk / Desen | [SIPARIS DETAYINDAN] |
| Model / Dikim Detayi | [SIPARIS DETAYINDAN] |
| Olculer (En x Boy) | [SIPARIS DETAYINDAN] |
| Adet | [SIPARIS DETAYINDAN] |

**Ozel Siparis Bildirimi:** Bu urun, tarafinizca belirlenen olcu, kumas, renk ve model tercihlerine gore ozel olarak uretilecektir. Standart bir raf urunu degildir.

#### 3. FIYAT BILGILERI

| Bilgi | Tutar |
|---|---|
| Urun Birim Fiyati (KDV dahil) | [SIPARIS DETAYINDAN] TL |
| Adet | [SIPARIS DETAYINDAN] |
| Ara Toplam (KDV dahil) | [SIPARIS DETAYINDAN] TL |
| Kargo Ucreti | [SIPARIS DETAYINDAN] TL |
| **Toplam Odeme Tutari (KDV dahil)** | **[SIPARIS DETAYINDAN] TL** |

Fiyatlara KDV dahildir.

[Taksitli odeme yapiliyorsa:]
| Taksit Sayisi | [X] |
| Aylik Taksit Tutari | [X] TL |
| Toplam Taksitli Tutar | [X] TL |

#### 4. ODEME BILGILERI

| Bilgi | Detay |
|---|---|
| Odeme Yontemi | Kredi Karti / Banka Karti |
| Odeme Altyapisi | PayTR (PCI DSS sertifikali guvenli odeme) |

Kredi karti bilgileriniz Inanc Tekstil tarafindan saklanmamaktadir. Odeme islemi tamamen PayTR guvenli odeme altyapisi uzerinden gerceklestirilir.

#### 5. TESLIMAT BILGILERI

| Bilgi | Detay |
|---|---|
| Teslimat Adresi | [SIPARIS FORMUNDAN] |
| Teslim Alacak Kisi | [SIPARIS FORMUNDAN] |
| Teslimat Yontemi | Kargo ile kapiya teslim |
| Tahmini Uretim Suresi | [X] is gunu |
| Tahmini Kargo Suresi | [X] is gunu |
| **Tahmini Toplam Teslimat Suresi** | **Siparis onayindan itibaren [X] is gunu** |
| Kargo Firmasi | [KARGO FIRMASI ADI] |

Urunler, siparis onayindan sonra uretim surecine alinmakta olup, uretim tamamlandiktan sonra kargoya verilir. Kargo takip bilgileri e-posta ve/veya SMS ile tarafiniza iletilecektir.

En gec teslimat suresi, siparis tarihinden itibaren 30 (otuz) gundur.

#### 6. CAYMA HAKKI

**6.1. Ozel Siparis Urunlerde Cayma Hakki:**

Siparis verdiginiz perde urunleri, tarafinizca belirlenen olcu ve tercihlere gore **ozel siparis uzerine uretilmektedir**.

6502 sayili Tuketicinin Korunmasi Hakkinda Kanun'un 15. maddesinin birinci fikrasinin (c) bendi uyarinca:

> *"Tuketicinin istekleri veya kisisel ihtiyaclari dogrultusunda hazirlanan mallara iliskin sozlesmelerde cayma hakki kullanilamaz."*

Bu nedenle, **ozel siparis uzerine uretilen perde urunlerimizde 14 gunluk cayma hakkiniz bulunmamaktadir.**

**6.2. Satici Kaynakli Hatalar:**

Yukaridaki cayma hakki istisnasi, asagidaki satici kaynakli hata durumlarinda haklarinizi sinirlandirmaz:
- Siparis edilenden farkli kumas, renk veya desen gonderilmesi
- Uretim hatasi veya defolu urun teslimi
- Satici kaynakli olcu hatasi (sizin belirttiginiz olculerden farkli uretim)
- Kargo sirasinda olusan hasar

Bu durumlarda iade, degisim veya yeniden uretim hakkiniz saklidir. Detaylar icin iade politikamizi inceleyebilirsiniz.

**6.3. Cayma Hakki Kullanimi (standart urunler icin, eger varsa):**

Ozel siparis olmayan standart urunlerde, teslim tarihinden itibaren 14 (on dort) gun icerisinde herhangi bir gerekce gostermeksizin cayma hakkinizi kullanabilirsiniz. Cayma bildirimi icin:
- Telefon: [TELEFON NUMARASI]
- E-posta: [E-POSTA ADRESI]
- Adres: [TAM ADRES], Iskenderun, Hatay

#### 7. SIKAYET VE BASVURU YOLLARI

Siparisiniz veya hizmetimizle ilgili sikayet ve onerileriniz icin:

**Musteri Hizmetleri:**
- Telefon: [TELEFON NUMARASI]
- E-posta: [E-POSTA ADRESI]
- Calisma Saatleri: [CALISMA SAATLERI]

**Resmi Basvuru Yollari:**
- **Tuketici Hakem Heyeti:** Ikamet ettiginiz il veya ilcedeki Tuketici Hakem Heyeti'ne basvurabilirsiniz. Basvuru parasal sinirlari her yil guncellenmektedir.
- **Tuketici Mahkemesi:** Parasal sinirlar uzerindeki uyusmazliklarda ikamet ettiginiz veya islemin yapildigi yerdeki Tuketici Mahkemesi'ne basvurabilirsiniz.
- **Ticaret Bakanligi Tuketici Sikayet Hatti:** Alo 175

#### 8. DIGER BILGILER

- Bu on bilgilendirme formu, siparisinizi onaylamaniz halinde akdedilecek mesafeli satis sozlesmesinin ayrilmaz bir parcasidir.
- Siparis vermeniz halinde, isbu formda yer alan kosullari kabul etmis sayilirsiniz.
- Inanc Tekstil, siparis konusu urunu sozlesme ve on bilgilendirme formunda belirtilen niteliklere uygun olarak teslim etmeyi taahhut eder.

---

**ALICI BEYANI:**

Isbu on bilgilendirme formundaki tum bilgileri okudum, anladim ve siparis onaylama asamasinda elektronik ortamda onayladim. Ozel siparis uzerine uretilecek urunlerde cayma hakkimin bulunmadigini biliyorum.

**Tarih:** [SIPARIS TARIHI]
**Alici:** [MUSTERI ADI SOYADI]
