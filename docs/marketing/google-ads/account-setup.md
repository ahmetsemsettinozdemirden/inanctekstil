# Google Ads - Hesap Kurulumu

Bu dokuman, Inanc Tekstil icin Google Ads altyapisinin sifirdan kurulumunu adim adim aciklar.

---

## Adim 1: Google Ads Manager Account (MCC) Olusturma

MCC (My Client Center), birden fazla Google Ads hesabini tek bir panelden yonetmenizi saglayan ust duzey bir hesaptir.

### Islem Adimlari

1. https://ads.google.com/home/tools/manager-accounts/ adresine git
2. "Create a manager account" butonuna tikla
3. Isletme e-posta adresini kullan (kisisel degil, ornegin info@inanctekstil.store)
4. Hesap adini "Inanc Tekstil MCC" olarak belirle
5. Ulke: Turkiye, Saat Dilimi: Istanbul (UTC+3), Para Birimi: TRY
6. Hesabi olustur

### MCC Neden Onemli?

- **Olceklenme:** Ileride ikinci bir marka veya sube eklenirse, ayni MCC altinda yeni hesap acilabilir
- **Yetki Yonetimi:** Bir ajanla veya danismanla calisirken, MCC uzerinden sinirli erisim verilir, ana hesap bilgileri paylasildmaz
- **Toplu Yonetim:** Birden fazla hesabin performansi tek ekrandan izlenebilir
- **Faturalama:** Merkezi faturalama imkani

---

## Adim 2: Reklam Hesabi (Ad Account) Olusturma

MCC altinda bir reklam hesabi olusturulacak. Bu hesap uzerinden kampanyalar yonetilecek.

### Islem Adimlari

1. MCC paneline gir
2. Sol menude "Accounts" > "Performance" bolumune git
3. "+" butonuna tikla > "New Google Ads account" sec
4. Hesap adi: "Inanc Tekstil - Iskenderun"
5. Ulke: Turkiye, Saat Dilimi: Istanbul, Para Birimi: TRY
6. Faturalama bilgilerini gir (kredi karti veya banka karti)

### Faturalama Notu

- Turkiye'de Google Ads otomatik odeme ile calisir
- Kredi karti veya banka karti tanimlmanlidir
- Harcamalar gun sonunda veya belirli esik degerlerinde otomatik tahsil edilir
- Aylik butce limiti (2.500 TL) kampanya duzeyin de ayarlanir, hesap duzeyinde degil

---

## Adim 3: Google Analytics 4 (GA4) Kurulumu

GA4, web sitesi trafikini ve kullanici davranislarini izlemek icin gereklidir. Google Ads donusum verilerinin dogrulugunu arttirir.

### Islem Adimlari

1. https://analytics.google.com adresine git
2. "Admin" > "Create Property" sec
3. Mulk adi: "Inanc Tekstil Web Sitesi"
4. Saat dilimi: Turkiye, Para birimi: TRY
5. Isletme bilgilerini doldur
6. Web akisi (Web Stream) olustur:
   - Web sitesi URL'sini gir
   - Akis adi: "Inanc Tekstil Web"
7. Olcum Kimligini (Measurement ID, G-XXXXXXX) al
8. Bu kodu web sitesine ekle:
   - Eger WordPress kullaniliyorsa: Google Site Kit eklentisi ile
   - Eger ozel site ise: `<head>` bolumune gtag.js kodunu yerlestir
   - Eger Shopify/Trendyol gibi bir platform kullaniliyorsa: ilgili entegrasyon ayarlarindan

### GA4'u Google Ads'e Baglama

1. GA4 panelinde "Admin" > "Google Ads Links" bolumune git
2. "Link" butonuna tikla
3. Google Ads hesabini sec (Adim 2'de olusturulan hesap)
4. Tum ayarlari varsayilan olarak birak ve baglantyi olustur
5. Google Ads panelinden de baglantyi dogrula: "Tools & Settings" > "Linked accounts" > "Google Analytics (GA4)"

### Baglantinin Faydalari

- GA4 kitleleri Google Ads'te kullanilabilir (remarketing)
- Donusum verileri her iki platformda da gorunur
- Kullanici yolculugu analizi yapilabilir

---

## Adim 4: Donusum Izleme (Conversion Tracking) Kurulumu

Donusum izleme olmadan reklam harcamasinin geri donusunu olcmek mumkun degildir. Bu adim kritik oneme sahiptir.

### Izlenecek Donusumler

| Donusum Adi | Tetikleme | Oncelik |
|-------------|-----------|---------|
| Siparis Tamamlama | Siparis onay sayfasina ulasma | Birincil |
| Telefon Arama | Reklamdaki telefon numarasina tiklama | Ikincil |
| WhatsApp Mesaj | WhatsApp butonuna tiklama | Ikincil |
| Form Gonderme | Iletisim/siparis formu gonderme | Ikincil |

### Islem Adimlari

1. Google Ads panelinde "Tools & Settings" > "Conversions" bolumune git
2. "New conversion action" butonuna tikla
3. "Website" sec
4. Web sitesi URL'sini gir ve tara
5. Donusum aksiyonlarini tanimla:
   - Siparis tamamlama icin: "Purchase/Sale" kategorisi, URL kurali (ornegin siparis-onay sayfasi URL'si)
   - Telefon arama icin: "Phone call" kategorisi
6. Donusum etiketini (conversion tag) al
7. Etiketi web sitesine ekle:
   - Google Tag Manager kullaniliyorsa: tag olarak ekle
   - Dogrudan site koduna: ilgili sayfalara yerlestir

### GA4 Donusumlerini Google Ads'e Aktarma (Alternatif Yontem)

Eger GA4 zaten donusum izliyorsa:

1. Google Ads'te "Tools & Settings" > "Conversions" git
2. "Import" > "Google Analytics 4 properties" sec
3. Izlemek istediginiz olaylari (events) secin
4. Kaydet

---

## Adim 5: Google Business Profile (Isletme Profili) Dogrulamasi

Google Business Profile, Google Haritalar'da ve yerel arama sonuclarinda gorunnmenizi saglar. Yerel bir isletme icin kritik oneme sahiptir.

### Islem Adimlari

1. https://business.google.com adresine git
2. "Manage now" butonuna tikla
3. Isletme bilgilerini gir:
   - Isletme adi: Inanc Tekstil
   - Kategori: "Perde Magazasi" veya "Home Goods Store"
   - Adres: Iskenderun, Hatay (tam adres)
   - Telefon numarasi
   - Web sitesi URL'si
4. Dogrulama yontemi secenekleri sunulacak:
   - **Posta karti (Postcard):** Google fiziksel adrese bir posta karti gonderir. 1-2 hafta icerisinde ulasir. Kartin uzerindeki dogrulama kodunu girersiniz.
   - **Telefon:** Bazi isletmeler icin telefon ile dogrulama secenegi sunulur. SMS veya arama ile kod gelir.
   - **E-posta:** Nadiren sunulur.
5. Dogrulama kodunu girdikten sonra profil aktif olur.

### Dogrulama Suresi

- Posta karti: 1-2 hafta (Turkiye'de bazen 3 haftaya kadar uzayabilir)
- Telefon: Aninda (eger secenek sunulursa)
- Dogrulama beklerken profili duzenleyebilirsiniz ancak Google Haritalar'da gorulnmezsiniz

### Profil Optimizasyonu (Dogrulama Sonrasi)

1. Isletme saatlerini ekle
2. Isletme aciklamasi yaz (Turkce, anahtar kelimeler icersin)
3. Fotograf ekle (magaza disi, ic mekan, urun fotograflari - en az 5-10 adet)
4. Hizmetleri listele (ozel dikim perde, tul perde, fon perde, stor perde vb.)
5. Ilk gonderiyi (post) paylas
6. Musterilerden yorum isteyin

### Google Business Profile'i Google Ads'e Baglama

1. Google Ads panelinde "Assets" > "Extensions" bolumune git
2. "Location" uzantisi ekle
3. Google Business Profile hesabini bagla
4. Bu sayede reklamlarinizda adres, telefon ve harita bilgisi gorunnecek

---

## Hesap Kurulum Sirasi Ozeti

Tum adimlarin onerilen sirasi:

| Sira | Islem | Tahmini Sure |
|------|-------|--------------|
| 1 | MCC olusturma | 15 dakika |
| 2 | Reklam hesabi olusturma | 10 dakika |
| 3 | GA4 kurulumu ve siteye ekleme | 30-60 dakika |
| 4 | GA4'u Google Ads'e baglama | 10 dakika |
| 5 | Donusum izleme kurulumu | 30-60 dakika |
| 6 | Google Business Profile olusturma | 20 dakika |
| 7 | Google Business Profile dogrulama | 1-2 hafta bekleme |
| 8 | Google Business Profile'i Google Ads'e baglama | 10 dakika |

**Toplam aktif calisma suresi:** Yaklasik 2-3 saat
**Toplam bekleme suresi:** 1-2 hafta (Google Business Profile dogrulama)

---

## Sorun Giderme

### MCC olusturma sirasinda "bu e-posta zaten kullaniliyyor" hatasi

Farkli bir e-posta adresi kullanin veya mevcut Google Ads hesabini MCC'ye donusturun.

### GA4 verileri gormunmuyor

- Olcum kodunun dogru eklendiginden emin olun
- GA4 Realtime raporundan canli trafigi kontrol edin
- Google Tag Assistant Chrome eklentisini kullanarak kodu test edin

### Google Business Profile dogrulama kodu gelmiyor

- Adresi dogru girdiginizden emin olun
- 3 haftadan fazla beklediyseniz yeniden dogrulama istegi gonderin
- Telefon dogrulama secenegi varsa onu deneyin

### Donusum izleme calismiyor

- Google Tag Assistant ile etiketi kontrol edin
- Bir test donusumu yaparak verilerin geldigini dogrulayin
- GA4 DebugView'u kullanarak olaylari canli izleyin
