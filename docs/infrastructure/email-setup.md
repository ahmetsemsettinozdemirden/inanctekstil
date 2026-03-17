# E-posta Yapilandirmasi

Bu dokuman kurumsal e-posta altyapisinin kurulumunu kapsar.

**Aktif Sistem:** Google Workspace Starter -- kurumsal e-posta (`info@inanctekstil.store`)

**Transactional E-postalar:** Shopify kendi e-posta altyapisini kullanir (siparis onaylari, kargo bildirimleri vb.). Harici SMTP yapilandirmasi gerekmez.

---

## 1. Google Workspace Starter Kurulumu

### 1.1 Google Workspace Hesabi Olusturma

1. [Google Workspace](https://workspace.google.com/pricing) sayfasina git
2. **Starter** planini sec ($7/kullanici/ay)
3. Kayit bilgilerini gir:
   - **Business name:** Inanc Tekstil
   - **Number of employees:** Just you
   - **Country:** Turkey
   - **Domain:** `inanctekstil.store` -- "I have a domain" sec
4. Ilk kullanici hesabini olustur:
   - **Username:** `info` (bu `info@inanctekstil.store` olacak)
   - **Password:** Guclu bir sifre sec

### 1.2 Domain Dogrulama

Google Workspace, domain'in sana ait oldugunu dogrulamak isteyecek:

1. Google Admin Console'da domain dogrulama sayfasina git
2. Verilen TXT kaydini DNS'e ekle (bkz. [dns-configuration.md](dns-configuration.md))
3. Google'da **Verify** butonuna tikla

### 1.3 MX Kayitlarini Ekleme

Butun MX kayitlarini [dns-configuration.md](dns-configuration.md) dosyasindaki tabloya gore ekle.

### 1.4 DKIM Aktivasyonu

1. Google Admin Console > **Apps > Google Workspace > Gmail > Authenticate email**
2. `inanctekstil.store` domainini sec
3. **Generate new record** > DKIM key uzunlugu: **2048** > Prefix: **google**
4. Verilen TXT kaydini DNS'e ekle
5. DNS propagasyonunu bekle (5-30 dakika)
6. **Start authentication** butonuna tikla

### 1.5 Gmail Ayarlari

Google Workspace'e giris yap: `https://mail.google.com` (info@inanctekstil.store ile)

**Imza ayari:**

```
--
Inanc Tekstil
Ev Tekstili & Dekorasyon
Iskenderun, Hatay
Tel: 0541 428 80 05
Web: https://inanctekstil.store
```

### 1.6 Ek Alias Adresleri

Google Workspace'te alias olusturarak birden fazla adresi tek hesaba yonlendirebilirsin:

- `info@inanctekstil.store` -- Ana adres
- `siparis@inanctekstil.store` -- Siparis bildirimleri
- `destek@inanctekstil.store` -- Musteri destegi
- `dmarc-reports@inanctekstil.store` -- DMARC raporlari

Google Admin Console > **Directory > Users > info > Account > Aliases > Add**

---

## 2. Shopify E-posta Bildirimleri

Shopify, siparis ve musteri bildirimlerini kendi altyapisiyla gonderir.

### Gonderen Ayarlari

```
Shopify Admin > Ayarlar > Bildirimler
  Gonderici e-posta: info@inanctekstil.store
  Gonderici adi: Inanc Tekstil
```

### Bildirim Sablonlari

Shopify varsayilan bildirim sablonlarini Turkce'ye cevir:

```
Shopify Admin > Ayarlar > Bildirimler > [ilgili bildirim]
```

Onemli sablonlar:
- Siparis onay
- Kargo bildirimi
- Siparis iptali
- Iade onay
- Hesap olusturma
- Sifre sifirlama

### SPF Kaydi

Shopify'in e-postalari gondermesi icin SPF kaydinda `include:shops.shopify.com` bulunmalidir. Bkz. [dns-configuration.md](dns-configuration.md).

---

## 3. E-posta Testi

### Deliverability Testi

1. [Mail Tester](https://www.mail-tester.com/) sitesine git
2. Verilen e-posta adresine Gmail'den test e-postasi gonder
3. Hedef skor: **9/10 veya ustu**

Dusuk skor alirsan kontrol et:
- SPF kaydinin dogru oldugunu (`dig +short inanctekstil.store TXT | grep spf`)
- DKIM'in aktif oldugunu
- DMARC kaydinin var oldugunu

### E-posta Basliklarini Kontrol Etme

Gelen test e-postasinin basliklarini incele (Gmail'de "Show original"):

```
Authentication-Results:
  spf=pass
  dkim=pass
  dmarc=pass
```

Uc "pass" goruyorsan e-posta altyapin dogru yapilandirilmis demektir.

---

## 4. Sorun Giderme

### Google Workspace e-postalar alinmiyor

1. MX kayitlarini dogrula: `dig +short inanctekstil.store MX`
2. DNS propagasyonu tamamlanmis mi kontrol et
3. Google Admin Console'da domain durumunu kontrol et

### Shopify e-postalari spam'e dusuyor

1. SPF kaydinda `include:shops.shopify.com` var mi kontrol et
2. DKIM ve DMARC kayitlarini dogrula
3. Shopify Admin > Ayarlar > Bildirimler > gonderici e-postayi kontrol et

### E-postalar hic gitmiyor

1. Shopify Admin > Ayarlar > Bildirimler'den test bildirimi gonder
2. Google Workspace'ten test e-postasi gonder
3. Her ikisi de calismiyorsa DNS kayitlarini kontrol et
