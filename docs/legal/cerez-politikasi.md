# Cerez Politikasi Rehberi

Bu dokuman, Inanc Tekstil e-ticaret sitesi icin KVKK'ya uyumlu bir cerez politikasi olusturma rehberidir. Sitede Shopify'in cerez yonetimi, Google Analytics 4 ile analitik ve Meta Pixel ile pazarlama izlemesi kullanilmaktadir.

> **UYARI:** Bu dokumandaki taslak metin hukuki danismanlik yerine gecmez. Bir avukat tarafindan incelenmeli ve isletmenize ozel olarak uyarlanmalidir.

---

## Yasal Dayanak

- **6698 sayili KVKK** -- Kisisel verilerin islenmesi ve acik riza gerekliligi
- **5809 sayili Elektronik Haberlesme Kanunu, Madde 51** -- Haberlesmenin gizliligi ve trafik/konum verileri
- **KVKK Kurul Kararlari** -- Cerezler ve benzeri teknolojiler icin aydinlatma ve riza gerekliligi
- **AB GDPR ve ePrivacy** -- Turkiye'deki uygulamalar buyuk olcude AB modelini takip etmektedir

### KVKK Perspektifinden Cerezler

KVKK cercevesinde cerezler araciligiyla toplanan veriler (IP adresi, tarayici bilgileri, kullanim verileri) **kisisel veri** sayilmaktadir. Bu nedenle:

- **Zorunlu cerezler:** Web sitesinin duzgun calismasi icin teknik olarak gerekli cerezler, "mesru menfaat" veya "sozlesmenin ifasi" kapsaminda acik riza olmadan kullanilabilir
- **Analitik cerezler (GA4):** Acik riza gerektirir
- **Pazarlama cerezleri (Meta Pixel):** Acik riza gerektirir
- **Tercih cerezleri:** Acik riza gerektirir

---

## Inanc Tekstil'de Kullanilan Cerezler

### 1. Zorunlu (Gerekli) Cerezler

Bu cerezler web sitesinin temel islevlerinin calismasi icin zorunludur. Devre disi birakilamazlar.

| Cerez Adi | Saglayici | Amac | Sure |
|---|---|---|---|
| `_shopify_s` | Shopify | Oturum yonetimi | Oturum |
| `_shopify_y` | Shopify | Benzersiz ziyaretci kimligi | 1 yil |
| `cart` | Shopify | Sepet iceriginin yonetimi | 2 hafta |
| `cart_ts` | Shopify | Sepetin olusturulma zamani | 2 hafta |
| `cart_sig` | Shopify | Sepet dogrulama | 2 hafta |
| `secure_customer_sig` | Shopify | Musteri giris durumu | 20 yil |
| `_tracking_consent` | Shopify | Cerez onay tercihleri | 1 yil |

### 2. Analitik Cerezler

Bu cerezler, ziyaretci davranislarini analiz etmek ve site performansini olcmek icin kullanilir. Sadece kullanicinin acik rizasi ile aktif hale gelir.

| Cerez Adi | Saglayici | Amac | Sure |
|---|---|---|---|
| `_ga` | Google Analytics 4 | Benzersiz kullanici kimlik belirleme | 2 yil |
| `_ga_*` | Google Analytics 4 | Oturum durumu saklama | 2 yil |
| `_gid` | Google Analytics 4 | Benzersiz kullanici kimlik belirleme (24 saat) | 24 saat |
| `_gat_*` | Google Analytics 4 | Istek hizi sinirlandirma | 1 dakika |

### 3. Pazarlama/Reklam Cerezleri

Bu cerezler, kullaniciya kisisellestirilmis reklamlar gostermek ve reklam performansini olcmek icin kullanilir. Sadece kullanicinin acik rizasi ile aktif hale gelir.

| Cerez Adi | Saglayici | Amac | Sure |
|---|---|---|---|
| `_fbp` | Meta Pixel | Facebook reklam optimizasyonu | 3 ay |
| `_fbc` | Meta Pixel | Facebook reklam tiklamasi takibi | 2 yil |
| `fr` | Meta (Facebook) | Reklam hedefleme ve olcumleme | 3 ay |

---

## Cerez Onay Yonetimi

### Shopify Cerez Banneri

Shopify, dahili cerez onay banneri ve musteri gizliligi API'si saglar. Alternatif olarak daha kapsamli bir Shopify uygulamasi kullanilabilir (ornek: Pandectes GDPR Compliance, Consentmo).

Temel islevler:

1. **Cerez Banneri:** Ziyaretcilere ilk girislerinde cerez onay banneri gosterir
2. **Kategori Bazli Onay:** Cerezleri kategorilere ayirarak kullanicinin her kategori icin ayri ayri onay/red vermesini saglar
3. **Script Engelleme:** Onay verilmeyen cerez kategorileri icin ilgili scriptleri (GA4, Meta Pixel) otomatik olarak engeller
4. **Onay Kaydi:** Kullanicilarin verdigi onaylari kayit altina alir (KVKK uyumlulugu icin onemli)
5. **Tercih Degistirme:** Kullanicilarin daha sonra tercihlerini degistirmesine olanak tanir

### Yapilandirma Onerileri

#### Genel Ayarlar
- **Bolge:** Turkiye (ve AB, eger AB'den trafik aliniyorsa)
- **Varsayilan Durum:** Tum zorunlu olmayan cerezler varsayilan olarak **kapali** olmali (opt-in modeli)
- **Banner Dili:** Turkce

#### Cerez Kategorileri
Asagidaki kategoriler tanimlanmalidir:

| Kategori | Varsayilan | Kullanici Secimi |
|---|---|---|
| Zorunlu (Gerekli) | Acik | Devre disi birakilamaz |
| Analitik (Istatistik) | Kapali | Kullanici onay verebilir |
| Pazarlama (Reklam) | Kapali | Kullanici onay verebilir |

#### Script Engelleme
Cerez onay uygulamasi, onay verilmeyen kategorilerdeki scriptleri otomatik engelleyebilir:

- **Google Analytics 4:** "Analitik/Istatistik" kategorisine baglanmali
- **Meta Pixel:** "Pazarlama/Reklam" kategorisine baglanmali

Bu sayede, kullanici onay vermeden GA4 veya Meta Pixel cerezleri cihazina yerlestirilmez ve scriptler calismaz.

#### Banner Metni
Banner metninde asagidaki bilgiler yer almalidir:
- Cerez kullanim amacinin kisa aciklamasi
- Cerez politikasi sayfasina link
- "Tumu Kabul Et" butonu
- "Sadece Zorunlu" butonu
- "Tercihleri Yonet" butonu/linki

### Google Consent Mode v2

Google Analytics 4 ile uyumlu calisma icin **Google Consent Mode v2** yapilandirilmalidir. Shopify cerez banneri veya kullanilan uyumluluk uygulamasi bu entegrasyonu destekler.

Consent Mode parametreleri:

| Parametre | Varsayilan (onay oncesi) | Onay sonrasi |
|---|---|---|
| `analytics_storage` | denied | granted |
| `ad_storage` | denied | granted |
| `ad_user_data` | denied | granted |
| `ad_personalization` | denied | granted |

Bu yapilandirma sayesinde:
- Onay verilmeden once Google Analytics veri toplamaz (veya anonim ping gonderir)
- Onay verildikten sonra tam olcumleme baslar

---

## TASLAK Cerez Politikasi Metni

> **TASLAK -- Hukuki danismanlik alinarak ozellesitirilmelidir**

Asagidaki metin, web sitesinde yayinlanacak cerez politikasinin taslak halidir.

---

### INANC TEKSTIL CEREZ POLITIKASI

**Son Guncelleme Tarihi:** [GUN/AY/YIL]

#### 1. Giris

Inanc Tekstil olarak, [WEB SITESI ADRESI] internet sitemizde cerezler ve benzeri teknolojiler kullanmaktayiz. Bu cerez politikasi, hangi cerezlerin kullanildigini, ne amacla kullanildigini ve bunlari nasil yonetebileceginizi aciklamaktadir.

Bu politika, 6698 sayili Kisisel Verilerin Korunmasi Kanunu (KVKK) ve ilgili mevzuat kapsaminda hazirlanmistir.

#### 2. Cerez Nedir?

Cerezler, bir web sitesini ziyaret ettiginizde tarayiciniz araciligiyla cihaziniza (bilgisayar, tablet, telefon) yerlestirilen kucuk metin dosyalaridir. Cerezler, web sitesinin duzgun calismasi, guvenligin saglanmasi, kullanici deneyiminin iyilestirilmesi ve ziyaretci istatistiklerinin toplanmasi gibi amaclarla kullanilmaktadir.

Cerezler, icerikleri itibariyle kisisel veri icerebilir. Bu nedenle cerez kullaniminda KVKK'nin kisisel verilerin islenmesine iliskin hukumleri uygulanmaktadir.

#### 3. Kullanilan Cerez Turleri

Sitemizde asagidaki cerez kategorileri kullanilmaktadir:

**a) Zorunlu (Gerekli) Cerezler**

Bu cerezler, web sitemizin temel islevlerinin calismasi icin teknik olarak zorunludur. Bu cerezler olmadan alisveris sepeti, guvenli odeme ve kullanici girisi gibi ozellikler calismaz.

Bu cerezler, KVKK Madde 5/2-f (mesru menfaat) ve Madde 5/2-c (sozlesmenin ifasi) kapsaminda acik riza gerektirmeksizin kullanilmaktadir.

Kullanilan zorunlu cerezler:
- Shopify sepet ve oturum cerezleri (alisveris islemlerinin yurutulmesi)
- Shopify guvenlik ve kimlik dogrulama cerezleri
- Cerez onay tercihi cerezleri (tercihlerinizin saklanmasi)

**b) Analitik (Istatistik) Cerezleri**

Bu cerezler, web sitemizin nasil kullanildigini anlamamiza, ziyaretci sayilarini olcmemize ve site performansini iyilestirmemize yardimci olur. Toplanan veriler genellikle anonim veya takilmali (pseudonymous) formdadir.

Bu cerezler, yalnizca sizin **acik rizanizla** aktif hale gelir.

Kullanilan analitik cerezler:
- Google Analytics 4 cerezleri (`_ga`, `_ga_*`, `_gid`): Sayfa goruntulenmeleri, oturum suresi, trafik kaynaklari gibi veriler toplanir.

**Veri aktarimi:** Google Analytics verileri, Google LLC'nin ABD'deki sunucularina aktarilabilmektedir.

**c) Pazarlama (Reklam) Cerezleri**

Bu cerezler, size ilgi alanlariniza uygun reklamlar gostermek ve reklam kampanyalarinin etkinligini olcmek amaciyla kullanilir.

Bu cerezler, yalnizca sizin **acik rizanizla** aktif hale gelir.

Kullanilan pazarlama cerezleri:
- Meta Pixel cerezleri (`_fbp`, `_fbc`): Facebook ve Instagram reklamlarinin optimizasyonu ve donusum olcumleme amaciyla kullanilir.

**Veri aktarimi:** Meta Pixel verileri, Meta Platforms Inc.'in ABD'deki sunucularina aktarilabilmektedir.

#### 4. Cerez Onay Yonetimi

Sitemizi ilk ziyaretinizde size bir cerez onay banneri gosterilir. Bu banner araciligiyla:

- **"Tumunu Kabul Et"** secenegini tercih ederek tum cerez kategorilerine onay verebilirsiniz.
- **"Sadece Zorunlu Cerezler"** secenegini tercih ederek yalnizca web sitesinin calismasi icin zorunlu cerezlere izin verebilirsiniz.
- **"Tercihleri Yonet"** secenegi ile hangi cerez kategorilerine izin verdiginizi tek tek belirleyebilirsiniz.

Zorunlu cerezler, web sitesinin calismasi icin teknik gereklilik olmasi nedeniyle devre disi birakilamamaktadir.

**Tercihlerinizi degistirmek icin:** Sayfanin alt kisminda yer alan "Cerez Ayarlari" linkine tiklayarak cerez tercihlerinizi istediginiz zaman degistirebilirsiniz.

#### 5. Cerezleri Tarayicinizdan Yonetme

Cerezleri tarayicinizin ayarlarindan da yonetebilirsiniz. Cogu tarayici, cerezleri goruntuleme, silme veya engelleme secenekleri sunmaktadir:

- **Google Chrome:** Ayarlar > Gizlilik ve Guvenlik > Cerezler ve site verileri
- **Mozilla Firefox:** Ayarlar > Gizlilik ve Guvenlik > Cerezler ve Site Verileri
- **Safari:** Tercihler > Gizlilik > Cerezleri ve web sitesi verilerini yonet
- **Microsoft Edge:** Ayarlar > Cerezler ve site izinleri

**Onemli:** Tum cerezleri engellemeniz durumunda web sitemizin bazi ozellikleri (alisveris sepeti, uyelik girisi vb.) duzgun calismayabilir.

#### 6. Ucuncu Taraf Cerezleri ve Veri Aktarimi

Sitemizde kullanilan bazi cerezler ucuncu taraf hizmet saglayicilar tarafindan yerlestirilmektedir:

| Hizmet Saglayici | Amac | Gizlilik Politikasi |
|---|---|---|
| Google LLC (Analytics) | Web analizi | https://policies.google.com/privacy |
| Meta Platforms Inc. | Reklam optimizasyonu | https://www.facebook.com/privacy/policy |

Bu ucuncu taraf hizmet saglayicilarin cerezleri araciligiyla toplanan veriler, ilgili sirketlerin ABD'deki sunucularina aktarilabilmektedir. Bu aktarim, KVKK Madde 9 uyarinca acik rizaniza dayanmaktadir.

#### 7. Cerez Saklama Sureleri

| Cerez Kategorisi | Saklama Suresi |
|---|---|
| Zorunlu (oturum cerezleri) | Tarayici kapandiginda silinir |
| Zorunlu (kalici cerezler) | 1 yila kadar |
| Analitik cerezler | 24 saat - 2 yil arasi |
| Pazarlama cerezleri | 3 ay - 2 yil arasi |
| Cerez onay tercihi | 1 yil |

#### 8. Kisisel Verilerinizle Ilgili Haklariniz

Cerezler araciligiyla toplanan kisisel verilerinize iliskin KVKK kapsamindaki haklariniz hakkinda detayli bilgi icin [Gizlilik Politikamizi](/gizlilik-politikasi) inceleyebilirsiniz.

#### 9. Politika Degisiklikleri

Inanc Tekstil, isbu cerez politikasini yasal duzenlemeler, teknik gelismeler veya isletme ihtiyaclari dogrultusunda guncelleme hakkini sakli tutar. Guncel politika her zaman bu sayfada yayinlanir.

#### 10. Iletisim

Cerez politikamiz hakkindaki soru ve talepleriniz icin:
- **E-posta:** [E-POSTA ADRESI]
- **Telefon:** [TELEFON NUMARASI]
- **Adres:** [TAM ADRES], Iskenderun, Hatay

---

*Bu cerez politikasi [GUN/AY/YIL] tarihinde yururluge girmistir.*
