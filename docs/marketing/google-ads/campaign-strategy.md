# Google Ads - Kampanya Stratejisi

Bu dokuman, Inanc Tekstil icin Google Ads arama kampanyalarinin detayli yapisini, anahtar kelimelerini, hedefleme ayarlarini, butce planini ve reklam metni orneklerini icerir.

---

## Kampanya Tipi: Arama (Search)

**Onemli:** "Smart Campaign" (Akilli Kampanya) degil, standart "Search Campaign" (Arama Kampanyasi) kullanilacak.

Smart kampanyalar Google'a tam kontrol verir ve:
- Anahtar kelime secimi uzerinde kontrol yoktur
- Hangi aramalarda gorunndugunuzu bilemezsiniz
- Negatif anahtar kelime ekleyemezsiniz
- Detayli raporlama sinirlidir
- Dusuk butcelerde verimsiz calisma egilimindedir

Standart arama kampanyasi ile her anahtar kelimeyi, teklifi ve reklam metnini kontrol edebilirsiniz.

---

## Kampanya Yapisi

```
Kampanya: Inanc Tekstil - Perde Arama
  ├── Reklam Grubu 1: Marka Aramalari
  ├── Reklam Grubu 2: Yerel + Urun Aramalari
  ├── Reklam Grubu 3: Niyet Bazli Aramalar
  └── Reklam Grubu 4: Kumas/Urun Tipi Aramalari
```

Her reklam grubu farkli bir arama niyetini hedefler. Bu yapi sayesinde:
- Her gruba ozel reklam metni yazilabilir
- Performans grup bazinda izlenebilir
- Butce, iyi calisan gruplara yonlendirilebilir

---

## Anahtar Kelime Listesi

### Reklam Grubu 1: Marka Aramalari

| Anahtar Kelime | Eslesme Tipi | Aciklama |
|----------------|--------------|----------|
| "inanc tekstil" | Exact Match | Marka adi arayan kullanicilar |
| "inanc tekstil iskenderun" | Exact Match | Marka + konum |
| inanc tekstil perde | Phrase Match | Marka + urun |

**Not:** Marka anahtar kelimeleri genellikle en dusuk CPC'ye ve en yuksek donusum oranina sahiptir. Marka bilinirlik arttikca bu grup daha degerli hale gelir.

### Reklam Grubu 2: Yerel + Urun Aramalari

| Anahtar Kelime | Eslesme Tipi | Aciklama |
|----------------|--------------|----------|
| "iskenderun perde" | Exact Match | En yuksek oncelikli yerel arama |
| "hatay perde" | Exact Match | Il duzeyinde arama |
| "iskenderun perde siparisi" | Exact Match | Yerel + satin alma niyeti |
| iskenderun perde magazasi | Phrase Match | Fiziksel magaza arayan |
| hatay perde fiyatlari | Phrase Match | Fiyat karsilastirmasi yapan |
| "iskenderun perde fiyatlari" | Exact Match | Yerel + fiyat odakli |

### Reklam Grubu 3: Niyet Bazli Aramalar

| Anahtar Kelime | Eslesme Tipi | Aciklama |
|----------------|--------------|----------|
| "online perde yaptirma" | Exact Match | Online siparis niyeti |
| "perde fiyatlari iskenderun" | Exact Match | Yerel fiyat arastirmasi |
| "ozel dikim perde" | Exact Match | Ozellestirilmis urun arayan |
| ozel dikim perde siparis | Phrase Match | Siparis niyeti yuksek |
| online perde siparis | Phrase Match | Online satin alma niyeti |
| perde yaptirmak istiyorum | Phrase Match | Yuksek niyet |

### Reklam Grubu 4: Kumas/Urun Tipi Aramalari

| Anahtar Kelime | Eslesme Tipi | Aciklama |
|----------------|--------------|----------|
| "tul perde" | Exact Match | Spesifik urun tipi |
| "fon perde" | Exact Match | Spesifik urun tipi |
| "stor perde" | Exact Match | Spesifik urun tipi |
| tul perde fiyatlari | Phrase Match | Urun + fiyat |
| fon perde modelleri | Phrase Match | Urun + model arastirmasi |
| stor perde cesitleri | Phrase Match | Urun cesidi arayan |
| zebra perde | Phrase Match | Spesifik urun tipi |
| blackout perde | Phrase Match | Spesifik urun tipi |

### Eslesme Tipi Aciklamasi

- **Exact Match [...]:** Sadece tam olarak bu aranan kelime veya cok yakin varyasyonlari icin gorunnur. En hassas hedefleme.
- **Phrase Match "...":** Anahtar kelimenin anlami korunarak yapilan aramalarda gorunnur. Ornegin "iskenderun perde" phrase match, "iskenderun en iyi perde magazasi" aramasinda da gorunnebilir.
- **Broad Match:** Genel eslesme. Dusuk butcelerde onerilmez cunku alakasiz aramalarda da gorunnebilir.

---

## Negatif Anahtar Kelimeler

Bu kelimeler eklenerek, alakasiz aramalarda reklam gosterimi engellenir. Butce israfini onler.

### Kampanya Duzeyinde Negatif Kelimeler

| Negatif Anahtar Kelime | Neden |
|------------------------|-------|
| perde yikama | Hizmet degil, urun satiyoruz |
| perde tamiri | Tamir hizmeti vermiyoruz |
| ikinci el perde | Ikinci el satmiyoruz |
| kullanilmis perde | Ikinci el satmiyoruz |
| perde yikama makinesi | Alakasiz urun |
| perde askisi | Farkli urun kategorisi |
| perde ray | Farkli urun kategorisi (eger satmiyorsak) |
| perde nasil dikilir | Bilgi arayan, satin alma niyeti dusuk |
| perde dikimi ogrenme | Bilgi arayan, satin alma niyeti dusuk |
| perde kursu | Egitim arayan |
| ucretsiz perde | Ucretsiz arayan |
| bedava perde | Ucretsiz arayan |
| perde istanbul | Farkli sehir |
| perde ankara | Farkli sehir |
| perde izmir | Farkli sehir |

**Not:** Negatif anahtar kelime listesi surekli guncellenmeli. Her hafta "Search Terms" raporuna bakilarak alakasiz aramalar negatif listeye eklenmeli.

---

## Cografi Hedefleme (Geo-Targeting)

### Baslangic (Ilk 2 Hafta)

- **Merkez:** Iskenderun, Hatay
- **Yaricap:** Iskenderun merkez + 30 km
- **Hedefleme Ayari:** "People in or regularly in your targeted locations" (Hedeflenen konumlarda bulunan veya duzenli olarak bulunan kisiler)

**Onemli:** "People interested in your targeted locations" secenegini secmeyin. Bu secenek, Iskenderun'a ilgi duyan ama baska sehirlerde yasayan kisilere de reklam gosterir ve butce israfina yol acar.

### Genisletme (2 Hafta Sonra)

Ilk 2 haftanin performans verilerine bakilarak:
- CPC ve CTR hedeflere yakinsa, hedefleme Hatay il geneline genisletilir
- Performans kotuyse, once mevcut hedefleme optimize edilir

### Gelecek Genisletme (Ay 2-3)

Hatay performansi iyiyse, komsu illere (Adana, Osmaniye, Mersin) genisletme degerlendirilir. Ancak bu butce artisi gerektirebilir.

---

## Butce ve Teklif Stratejisi

### Butce

- **Aylik toplam:** 2.500 TL
- **Gunluk ortalama:** ~83 TL (2.500 / 30)
- **Not:** Google gunluk butceyi %100'e kadar asabilir ancak aylik toplami gecmez

### Teklif Stratejisi

#### Faz 1: Baslangic (Ilk 30 donusume kadar)

- **Strateji:** Maximize Clicks (Tiklama Sayisini En Ust Duzeye Cikarma)
- **Neden:** Yeterli donusum verisi olmadigi icin algoritma optimize edemez. Once veri toplamamiz gerekir.
- **Maksimum CPC Limiti:** 8 TL (asiri pahali tiklamalari onlemek icin)
- **Sure:** Yaklasik 4-8 hafta (donusum oranina bagli)

#### Faz 2: Optimizasyon (30+ donusum sonrasi)

- **Strateji:** Target CPA (Hedef Edinme Basina Maliyet)
- **Neden:** 30+ donusum verisi ile algoritma hangi kullanicilarin donusum yapma olasiliginin yuksek oldugunu ogrenir.
- **Hedef CPA:** Ilk 30 donusumun ortalama maliyetine gore belirlenir
- **Not:** Target CPA'ya geciste butceyi %20-30 artirmak performansi stabilize eder

---

## Reklam Metni Ornekleri

### Reklam Grubu 1: Marka Aramalari

**Reklam 1:**
```
Baslik 1: Inanc Tekstil | Iskenderun
Baslik 2: Ozel Dikim Perde Siparisi
Baslik 3: Ucretsiz Olcu ve Danismanlik
Aciklama 1: Iskenderun'un guvenilir perde magazasi. Tul, fon, stor ve daha fazlasi. Olcunuze ozel dikim. Hemen siparis verin.
Aciklama 2: Kaliteli kumaslar, profesyonel dikim. Iskenderun ve cevre ilcelere hizmet. Online siparis kolayligi.
```

### Reklam Grubu 2: Yerel + Urun Aramalari

**Reklam 1:**
```
Baslik 1: Iskenderun Perde Siparisi
Baslik 2: Ozel Dikim - Inanc Tekstil
Baslik 3: Ucretsiz Kesfet
Aciklama 1: Iskenderun'da ozel dikim perde arayanlar icin. Yuzlerce kumas secenegi. Olcunuze gore uretim. Hemen fiyat alin.
Aciklama 2: Hatay ve Iskenderun'a ozel perde cozumleri. Tul, fon, stor perde cesitleri. Kaliteli kumaslar, uygun fiyatlar.
```

**Reklam 2:**
```
Baslik 1: Hatay'da Perde Mi Ariyorsunuz?
Baslik 2: Inanc Tekstil - Online Siparis
Baslik 3: Hizli Teslimat
Aciklama 1: Hatay bolgesinde ozel dikim perde siparisi. Evinize ozel olculerde uretim. Genis kumas koleksiyonu. Simdi inceleyin.
Aciklama 2: Iskenderun merkezli perde atolyesi. Tul perdeden fon perdeye, stor perdeden zebra perdeye tum cesitler.
```

### Reklam Grubu 3: Niyet Bazli Aramalar

**Reklam 1:**
```
Baslik 1: Online Perde Yaptirma
Baslik 2: Olcunuze Ozel Dikim
Baslik 3: Inanc Tekstil - Iskenderun
Aciklama 1: Ozel dikim perde siparisi artik cok kolay. Olculerinizi gonderin, kumasinizi secin, biz dikelim. Iskenderun ve cevresi.
Aciklama 2: Evinize ozel perde yaptirmak mi istiyorsunuz? Profesyonel olcu alma, kaliteli kumas ve dikim. Ucretsiz danismanlik.
```

### Reklam Grubu 4: Kumas/Urun Tipi Aramalari

**Reklam 1 (Tul Perde):**
```
Baslik 1: Tul Perde Cesitleri
Baslik 2: Ozel Dikim - Inanc Tekstil
Baslik 3: Iskenderun'dan Online Siparis
Aciklama 1: Birbirinden sik tul perde modelleri. Olcunuze ozel dikim. Genis renk ve desen secenekleri. Hemen fiyat ogrenmek icin tiklayin.
Aciklama 2: Kaliteli tul perde cesitleri uygun fiyatlarla. Ozel dikim avantaji ile evinize en uygun tul perdeyi bulun.
```

**Reklam 2 (Fon Perde):**
```
Baslik 1: Fon Perde Modelleri
Baslik 2: Isik Kontrol ve Sik Tasarim
Baslik 3: Ozel Olcu Dikim
Aciklama 1: Fon perde ile odalariniza karakter katin. Yuzlerce kumas secenegi, ozel olcu dikim. Inanc Tekstil Iskenderun.
Aciklama 2: Kaliteli fon perde cesitleri. Duz renk, desenli, kadife ve daha fazlasi. Olcunuze gore profesyonel dikim.
```

### Reklam Uzantilari (Ad Extensions)

Tum kampanyalara asagidaki uzantilar eklenmelidir:

1. **Konum Uzantisi:** Google Business Profile'dan otomatik (adres ve harita)
2. **Arama Uzantisi (Callout):**
   - "Ucretsiz Danismanlik"
   - "Ozel Olcu Dikim"
   - "Genis Kumas Secenegi"
   - "Hizli Teslimat"
3. **Site Baglanti Uzantisi (Sitelink):**
   - "Tul Perde Cesitleri" > ilgili sayfa linki
   - "Fon Perde Modelleri" > ilgili sayfa linki
   - "Stor Perde" > ilgili sayfa linki
   - "Iletisim" > iletisim sayfasi linki
4. **Telefon Uzantisi:** Isletme telefon numarasi
5. **Yapili Snippet (Structured Snippet):**
   - Tür: "Hizmetler"
   - Degerler: "Tul Perde, Fon Perde, Stor Perde, Zebra Perde, Ozel Dikim"

---

## Reklam Planlama (Ad Schedule)

### Baslangic Ayari

Tum gunler, 07:00 - 23:00 arasi. Gece saatlerinde reklam gosterimi durdurulmali cunku dusuk donusum orani beklenir ve butce korunur.

### Optimizasyon Sonrasi

2 haftalik veriden sonra, hangi gun ve saatlerde donusum oraninin yuksek olduguna bakilarak teklif ayarlamasi yapilir. Ornegin hafta sonu donusumleri yuksekse, hafta sonu teklifleri %20 arttirilir.

---

## Haftalik Optimizasyon Kontrol Listesi

Her hafta asagidaki islemler yapilmalidir:

1. **Search Terms Raporu:** Gercekte hangi aramalarda gorunndugunuze bakin. Alakasiz aramalari negatif listeye ekleyin.
2. **Anahtar Kelime Performansi:** Dusuk CTR'li (<1%) anahtar kelimeleri degerlendirin. Reklam metnini iyilestirin veya kelimeyi durdurun.
3. **Reklam Metni Performansi:** En az 2 reklam metni test edin. Dusuk performanslisini degistirin.
4. **Cografi Performans:** Hangi bolgelerden tiklama geldigine bakin. Donusum getirmeyen bolgeleri cikartin.
5. **Cihaz Performansi:** Mobil vs masaustu performansini karsilastirin. Gerekirse cihaz bazli teklif ayarlamasi yapin.
6. **Butce Kontrolu:** Gunluk harcamayi kontrol edin. Aylik butceyi asmamak icin gerekirse ayarlama yapin.

---

## Sik Yapilan Hatalar

1. **Smart Campaign kullanmak:** Kontrolu Google'a birakir, dusuk butcelerde verimsizdir.
2. **Broad Match anahtar kelime kullanmak:** Alakasiz aramalarda gorunnmeye ve butce israfina yol acar.
3. **Negatif kelime eklememek:** Her hafta search terms raporuna bakmamak en yaygin hatadir.
4. **Tek reklam metni kullanmak:** Her zaman en az 2 varyasyon test edilmeli.
5. **"Interested in" hedefleme secmek:** Konum hedeflemede "in or regularly in" secilmeli.
6. **Donusum izleme kurmamak:** Izleme olmadan optimizasyon yapilamaz.
7. **Ilk haftada kampanyayi durdurmak:** En az 2 hafta veri toplanmasi gerekir.
