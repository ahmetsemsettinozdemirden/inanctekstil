# Meta Ads - Hesap Kurulumu

Bu dokuman, Inanc Tekstil icin Meta (Facebook + Instagram) reklam altyapisinin sifirdan kurulumunu adim adim aciklar. Adimlarin sirasi onemlidir - bozulmasi ileride ciddi sorunlara yol acar.

---

## Mevcut Durum (2026-03-17) — TUM ADIMLAR TAMAMLANDI

| Varlik | ID | Durum |
|--------|----|-------|
| Business Portfolio | `928098610079416` | Aktif |
| Ad Account | `act_1460297365542314` | Aktif, TRY |
| Facebook Page | `1064624423394553` | Aktif |
| Instagram Hesabi | `1074486572406385` (@inanc_tekstil) | Baglanmis |
| Meta Pixel / Dataset | `1754778638989489` | Aktif (Conversions API + Meta Pixel) |
| Shopify Urun Katalogu | `25593862530291556` | Baglanmis |
| Meta App (MCP icin) | `1475535244215512` | Live moda alindi |

**Notlar:**
- Meta App Live moda alinirken Privacy Policy ve Terms of Service URL eklendi
- Pixel: Shopify uzerinden hem Conversions API hem de Meta Pixel aktif
- Instagram actor ID, Meta Ads API'de farkli bir formatta gerekiyor — MCP ile `instagram_actor_id` parametresi calismiyor, Meta kendi eslestiriyor

---

## Kurulum Sirasi ve Neden Onemli

Asagidaki sira kesinlikle takip edilmelidir:

1. Meta Business Manager olustur
2. Facebook Business Page olustur
3. Instagram Business Account olustur ve bagla
4. Ad Account olustur (Business Manager icinde)
5. Meta Pixel olustur ve siteye ekle
6. Isletme dogrulamasi yap

**Neden bu sira?**

- Business Manager her seyin "ust catisi"dir. Once o olmali.
- Facebook Page olmadan Instagram Business baglananamaz.
- Reklam hesabi kisisel hesaptan degil, BM icinden acilmali. Kisisel hesaptan acilan reklam hesaplari ileride BM'ye tasinamaz ve sinirli ozelliklere sahiptir.
- Pixel, reklam hesabi olusturulduktan sonra olusturulur cunku hesaba baglanmasi gerekir.
- Isletme dogrulamasi en sona birakllir cunku onceki tum adimlarin tamamlanmis olmasi gerekir.

---

## Adim 1: Meta Business Manager Olusturma

Business Manager (Isletme Yoneticisi), tum Meta varliklarinizi (sayfalar, hesaplar, pikseller) merkezi olarak yonetmenizi saglar.

### Islem Adimlari

1. https://business.facebook.com/overview adresine git
2. "Hesap Olustur" (Create Account) butonuna tikla
3. Asagidaki bilgileri gir:
   - Isletme adi: Inanc Tekstil
   - Adiniz ve soyadiniz (isletme sahibi)
   - Isletme e-posta adresi (kisisel degil, ornegin info@inanctekstil.store)
4. Isletme detaylarini doldur:
   - Adres: Iskenderun, Hatay adresi
   - Telefon numarasi
   - Web sitesi URL'si
5. Hesabi olustur

### Onemli Notlar

- Business Manager icin kisisel bir Facebook hesabiniz olmak zorunda. Bu hesap BM yoneticisi olarak kullanilacak.
- Kisisel hesabiniz gercek bilgilerinizle olmali. Sahte hesap kullanirsaniz Meta butun varliklarinizi kapatabilir.
- Bir kisisel hesap ile en fazla 2 Business Manager olusturulabilir.

---

## Adim 2: Facebook Business Page Olusturma

Facebook sayfasi, isletmenizin Facebook ve Instagram'daki kimligidir. Reklamlar bu sayfa uzerinden yayinlanir.

### Islem Adimlari

1. Business Manager panelinde "Business Settings" (Isletme Ayarlari) bolumune git
2. Sol menude "Accounts" > "Pages" bolumune git
3. "Add" > "Create a New Page" sec
4. Sayfa bilgilerini doldur:
   - Sayfa adi: Inanc Tekstil
   - Kategori: "Perde Magazasi" veya "Ev Dekorasyon Magazasi"
   - Aciklama: "Iskenderun'da ozel dikim perde. Tul, fon, stor ve daha fazlasi. Online siparis ile evinize ozel perde."
5. Profil fotografi ekle (logo veya magaza fotografi)
6. Kapak fotografi ekle (en guzel perde calismanizin fotografi)
7. Iletisim bilgilerini ekle:
   - Adres
   - Telefon
   - Web sitesi
   - WhatsApp numarasi
   - Calisma saatleri

### Sayfa Optimizasyonu

- **Kullanici adi:** @inanctekstil (veya uygun varyasyon)
- **CTA Butonu:** "Mesaj Gonder" veya "Web Sitesini Ziyaret Et"
- **Hakkinda bolumu:** Detayli isletme aciklamasi, hizmet bolgeleri, urun cesitleri
- **Ilk 3-5 gonderi:** Sayfa bos durmasin. Urun fotograflari, magaza tanitimi paylasildiktan sonra reklama baslansin.

---

## Adim 3: Instagram Business Account Olusturma ve Baglama

Instagram Business hesabi, reklamlarin Instagram'da da yayinlanmasini saglar ve detayli analizlere erisim verir.

### Islem Adimlari

1. Telefondan Instagram uygulamasini ac
2. Yeni bir Instagram hesabi olustur veya mevcut hesabi kullan
   - Kullanici adi: @inanctekstil (veya uygun varyasyon)
3. Profili Business (Isletme) hesabina cevir:
   - Ayarlar > Hesap > Profesyonel hesaba gec > Isletme
4. Kategori sec: "Perde Magazasi" veya "Ev Dekorasyon Magazasi"
5. Facebook Page'e bagla:
   - Instagram Ayarlar > Hesap > Bagli hesaplar > Facebook
   - "Inanc Tekstil" Facebook sayfasini sec
6. Business Manager'dan baglantyi dogrula:
   - BM > Business Settings > Accounts > Instagram Accounts
   - "Add" > bagli Instagram hesabini sec

### Onemli Notlar

- Instagram hesabi kisisel (Personal) veya icerik uretici (Creator) degil, **Isletme (Business)** olmali. Sadece Business hesaplar BM'ye baglanir ve reklamlarda kullanilir.
- Baglanti yapilmazsa Instagram'da reklam yayinlanamaaz.

---

## Adim 4: Reklam Hesabi (Ad Account) Olusturma

Reklam hesabi, kampanyalarin olusturuldugu ve yonetildigi hesaptir. Business Manager icinden olusturulmalidir.

### Islem Adimlari

1. Business Manager panelinde "Business Settings" bolumune git
2. Sol menude "Accounts" > "Ad Accounts" bolumune git
3. "Add" > "Create a New Ad Account" sec
4. Hesap bilgilerini gir:
   - Hesap adi: Inanc Tekstil Ad Account
   - Saat dilimi: Istanbul (UTC+3)
   - Para birimi: TRY (Turk Lirasi)
5. Hesap olusturulduktan sonra odeme yontemi ekle:
   - Reklam hesabi ayarlarina git
   - "Payment Methods" bolumune git
   - Kredi karti veya banka karti ekle

### Neden Business Manager Icinden?

- Kisisel Facebook hesabindan olusturulan reklam hesaplari BM'ye tasinamaz
- BM disindaki hesaplarin yetkilendirme ve guvenlik ozellikleri sinirlidir
- Ajanslara veya danismanlara erisim vermek icin BM sarttir
- Hesap kapanmasi durumunda kurtarma sureci BM ile daha kolaydir

---

## Adim 5: Meta Pixel Kurulumu

Meta Pixel, web sitenize gelen ziyaretcilerin davranislarini izleyen bir kod parcasidir. Retargeting ve donusum izleme icin zorunludur.

### Islem Adimlari

1. Business Manager > "Events Manager" (Etkinlik Yoneticisi) bolumune git
2. "Connect Data Sources" > "Web" sec
3. "Meta Pixel" sec ve "Connect" tikla
4. Pixel adi: "Inanc Tekstil Pixel"
5. Web sitesi URL'sini gir
6. Kurulum yontemi sec:
   - **Manuel Kurulum:** Pixel kodunu alip web sitesinin `<head>` bolumune yerlestir
   - **Partner Entegrasyonu:** Shopify icin Facebook & Instagram kanal entegrasyonu ile otomatik kurulum
   - **Google Tag Manager:** GTM kullaniliyorsa tag olarak ekle

### Pixel Kodu Yerlestirme

Pixel temel kodu (`fbq('init', 'PIXEL_ID')`) web sitesinin tum sayfalarinda `<head>` bolumunde olmalidir.

### Izlenecek Olaylar (Events)

| Olay Adi | Tetikleme | Kullanim |
|----------|-----------|----------|
| PageView | Her sayfa yuklenmesi | Otomatik (temel kod ile) |
| ViewContent | Urun sayfasi goruntulenme | Retargeting |
| AddToCart | Sepete ekleme | Retargeting |
| InitiateCheckout | Odeme baslatma | Retargeting |
| Purchase | Siparis tamamlama | Donusum olcumu |
| Contact | Iletisim formu / WhatsApp tiklamasi | Donusum olcumu |
| Lead | Fiyat teklifi isteme | Donusum olcumu |

### Pixel Test Etme

1. Facebook Pixel Helper Chrome eklentisini kurun
2. Web sitenizi ziyaret edin
3. Eklenti simgesine tiklayarak Pixel'in dogru calistigini dogrulayin
4. Events Manager'da "Test Events" bolumunden canli olaylari izleyin

---

## Adim 6: Isletme Dogrulamasi (Business Verification)

Isletme dogrulamasi, Meta'nin isletmenizin gercek oldugunu teyit etme sureccdir. Dogrulama yapilmadan bazi reklam ozellikleri sinirli kalir.

### Neden Gerekli?

- Ozel hedef kitle (Custom Audience) olusturma icin gereklidir
- Pixel veri paylasimi icin gereklidir
- Hesap guvenilirligini arttirir
- Hesap kapanma riskini azaltir

### Gerekli Belge

**Vergi Levhasi** (en yaygin kabul edilen belge Turkiye icin)

Alternatif olarak:
- Ticaret sicil gazetesi
- Isletme ruhsati
- Fatura (isletme adina duzenleumis)

### Islem Adimlari

1. Business Manager > "Business Settings" > "Security Centre" bolumune git
2. "Start Verification" butonuna tikla
3. Isletme bilgilerini gir:
   - Yasal isletme adi (vergi levhasindaki gibi)
   - Adres (vergi levhasindaki gibi)
   - Telefon numarasi
4. Dogrulama belgesi yukle (vergi levhasi PDF veya fotograf)
5. Dogrulama yontemi sec:
   - E-posta dogrulamasi (isletme domaininden e-posta alinir)
   - Telefon dogrulamasi (isletme telefonuna kod gelir)
6. Kodu girin ve dogrulamayi tamamlayin

### Dogrulama Suresi

- Genellikle 1-3 is gunu
- Bazen 1 haftaya kadar uzayabilir
- Belge reddedilirse, daha net bir goruntu yukleyerek tekrar deneyin

---

## Hesap Kurulum Sirasi Ozeti

| Sira | Islem | Tahmini Sure |
|------|-------|--------------|
| 1 | Business Manager olusturma | 15 dakika |
| 2 | Facebook Business Page olusturma ve optimize etme | 30-45 dakika |
| 3 | Instagram Business hesap ve baglama | 15-20 dakika |
| 4 | Reklam hesabi olusturma ve odeme yontemi ekleme | 15 dakika |
| 5 | Meta Pixel olusturma ve siteye ekleme | 30-60 dakika |
| 6 | Isletme dogrulamasi | 15 dakika + 1-3 gun bekleme |

**Toplam aktif calisma suresi:** Yaklasik 2-3 saat
**Toplam bekleme suresi:** 1-3 is gunu (isletme dogrulamasi)

---

## Sorun Giderme

### Business Manager olusturma sirasinda hata aliyor

- Kisisel Facebook hesabinizin en az 1-2 haftalik ve gercek bilgilerle olmasi gerekir
- Daha once BM olusturmus ve kapatilmissa, farkli bir Facebook hesabi deneyin

### Instagram hesabi Facebook Page'e baglanmiyor

- Instagram hesabinin Business (Isletme) tipinde oldugundan emin olun
- Her iki hesapta da ayni e-posta veya telefon numarasi kullaniliyorsa, oncelikle Instagram ayarlarindan baglama yapin

### Pixel verileri gelmiyor

- Pixel Helper eklentisi ile kodun dogru yuklendigini kontrol edin
- Sitenin HTTPS kullandiginden emin olun
- Ad blocker eklentilerini kapatin ve tekrar deneyin
- Events Manager > Test Events bolumunden canli test yapin

### Isletme dogrulamasi reddedildi

- Vergi levhasinin okunakli oldugundlan emin olun
- Isletme adi BM'de girilen isim ile belgdeki isim bire bir ayni olmali
- Farkli bir belge turu deneyin (ornegin ticaret sicil gazetesi)
- Belge tarihinin guncel oldugundan emin olun

### Reklam hesabi devre disi birakildi

- Meta'nin reklam politikalarini ihlal eden bir icerik olabilir
- Odeme yontemiyle ilgili sorun olabilir
- "Account Quality" bolumunden durumu kontrol edin
- Itiraz (appeal) sureci baslatin
