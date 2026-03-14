# DNS Yapilandirmasi

Bu dokuman `inanctekstil.store` alan adi icin gerekli tum DNS kayitlarini kapsar: web sitesi yonlendirme, Google Workspace e-posta ve Resend transactional e-posta altyapisi.

> **Onemli:** DNS kayitlari domain registrar'inin (alan adini nereden aldiysan) DNS yonetim panelinden girilir. Eger Hetzner DNS kullanmak istersen, registrar'da nameserver'lari Hetzner'a yonlendir:
> - `hydrogen.ns.hetzner.com`
> - `oxygen.ns.hetzner.com`
> - `helium.ns.hetzner.de`

Asagidaki orneklerde sunucunun gercek IPv4 adresi `5.75.165.158` kullanilmistir.

---

## 1. Temel DNS Kayitlari (Web Sitesi)

### A Kayitlari

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `@` | `5.75.165.158` | 300 |
| A | `www` | `5.75.165.158` | 300 |

Alternatif olarak `www` icin CNAME kullanabilirsin:

| Type | Name | Value | TTL |
|---|---|---|---|
| CNAME | `www` | `inanctekstil.store.` | 300 |

### AAAA Kayitlari (IPv6, Opsiyonel)

Hetzner sunucuna atanan IPv6 adresi varsa:

| Type | Name | Value | TTL |
|---|---|---|---|
| AAAA | `@` | `2a01:4f8:xxxx:xxxx::1` | 300 |
| AAAA | `www` | `2a01:4f8:xxxx:xxxx::1` | 300 |

### CAA Kaydi (SSL Sertifika Yetkisi)

Sadece Let's Encrypt'in sertifika vermesine izin ver:

| Type | Name | Value | TTL |
|---|---|---|---|
| CAA | `@` | `0 issue "letsencrypt.org"` | 3600 |

---

## 2. Google Workspace MX Kayitlari

Google Workspace e-postanin calisabilmesi icin MX kayitlari zorunludur.

### MX Kayitlari

| Type | Name | Value | Priority | TTL |
|---|---|---|---|---|
| MX | `@` | `aspmx.l.google.com.` | 1 | 3600 |
| MX | `@` | `alt1.aspmx.l.google.com.` | 5 | 3600 |
| MX | `@` | `alt2.aspmx.l.google.com.` | 5 | 3600 |
| MX | `@` | `alt3.aspmx.l.google.com.` | 10 | 3600 |
| MX | `@` | `alt4.aspmx.l.google.com.` | 10 | 3600 |

### Google Workspace Domain Dogrulama

Google Workspace kurulumu sirasinda domain dogrulama icin bir TXT kaydi istenecektir:

| Type | Name | Value | TTL |
|---|---|---|---|
| TXT | `@` | `google-site-verification=XXXXXXXXXXXXX` | 3600 |

> Google Admin Console'dan alinan dogrulama degerini `XXXXXXXXXXXXX` yerine yaz.

---

## 3. SPF (Sender Policy Framework)

SPF kaydi, hangi sunucularin senin domain'in adindan e-posta gondermesine izin verildigini belirtir. Hem Google Workspace hem de Resend'i tek bir SPF kaydinda birlestirmek gerekir (bir domain icin yalnizca bir SPF TXT kaydi olmalidir).

### Birlesik SPF Kaydi

| Type | Name | Value | TTL |
|---|---|---|---|
| TXT | `@` | `v=spf1 include:_spf.google.com include:send.resend.com ~all` | 3600 |

**Aciklama:**
- `include:_spf.google.com` -- Google Workspace sunucularina izin verir
- `include:send.resend.com` -- Resend sunucularina izin verir
- `~all` -- Listede olmayan kaynaklar icin softfail (basta `~all` kullan, her sey calistiktan sonra `~all` yerine `-all` ile degistirebilirsin)

> **Uyari:** Birden fazla SPF kaydi (birden fazla `v=spf1` ile baslayan TXT kaydi) ekleme. Bu SPF'i bozar. Tek bir TXT kaydinda her iki `include` ifadesini birlestir.

---

## 4. DKIM (DomainKeys Identified Mail)

DKIM, gonderilen e-postalarin dijital olarak imzalanmasini saglar.

### 4.1 Google Workspace DKIM

1. [Google Admin Console](https://admin.google.com) > **Apps > Google Workspace > Gmail > Authenticate email** bolumune git
2. **Generate new record** butonuna tikla
3. DKIM key uzunlugu: **2048 bit** sec
4. Prefix selector: `google` (varsayilan)
5. Google sana bir TXT kaydi verecektir:

| Type | Name | Value | TTL |
|---|---|---|---|
| TXT | `google._domainkey` | `v=DKIM1; k=rsa; p=MIIBIjANBgkqhki...` (Google'dan alinan tam deger) | 3600 |

6. DNS kaydini ekledikten sonra Google Admin Console'da **Start authentication** butonuna tikla

> **Not:** DKIM degerini Google Admin Console'dan birebir kopyala. Cok uzun bir string olacak, kesilmemesine dikkat et.

### 4.2 Resend DKIM

Resend hesabinda domain eklendiginde otomatik olarak 3 adet DKIM CNAME kaydi verilir:

| Type | Name | Value | TTL |
|---|---|---|---|
| CNAME | `resend._domainkey` | `resend._domainkey.inanctekstil.store.xxxxx.dkim.resend.dev.` | 3600 |
| CNAME | `s1._domainkey` | `s1._domainkey.inanctekstil.store.xxxxx.dkim.resend.dev.` | 3600 |
| CNAME | `s2._domainkey` | `s2._domainkey.inanctekstil.store.xxxxx.dkim.resend.dev.` | 3600 |

> Gercek degerleri Resend dashboard > Domains > `inanctekstil.store` > DNS Records sayfasindan al.

---

## 5. DMARC (Domain-based Message Authentication, Reporting and Conformance)

DMARC, SPF ve DKIM kontrollerinin basarisiz oldugu durumlarda ne yapilacagini belirler.

### Baslangic DMARC Kaydi (Izleme Modu)

| Type | Name | Value | TTL |
|---|---|---|---|
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc-reports@inanctekstil.store; ruf=mailto:dmarc-reports@inanctekstil.store; fo=1` | 3600 |

**Aciklama:**
- `p=none` -- Baslangicta sadece izleme modu; hicbir e-posta reddedilmez
- `rua` -- Toplu DMARC raporlarinin gonderilecegi adres
- `ruf` -- Forensic (detayli) raporlarin gonderilecegi adres
- `fo=1` -- SPF veya DKIM'den herhangi biri basarisiz olursa rapor gonder

### DMARC Gecis Plani

1. **Hafta 1-4:** `p=none` ile izle, raporlari incele
2. **Hafta 5-8:** Sorun yoksa `p=quarantine; pct=50` ile gecis yap (e-postalarin %50'si icin karantina)
3. **Hafta 9+:** Tamamen calistigina emin oldugunda `p=reject` ile sertlestir

Hedef DMARC kaydi (tam koruma):

```
v=DMARC1; p=reject; rua=mailto:dmarc-reports@inanctekstil.store; ruf=mailto:dmarc-reports@inanctekstil.store; fo=1
```

> **Not:** `dmarc-reports@inanctekstil.store` icin Google Workspace'te bir alias veya grup olusturmayi unutma, yoksa raporlar bos bir yere gider.

---

## 6. Resend Return-Path / Bounce Domain (Opsiyonel)

Resend icin bounce domain ayarlamak deliverabilityi arttirir:

| Type | Name | Value | TTL |
|---|---|---|---|
| MX | `bounces` | `feedback-smtp.us-east-1.resend.com.` | 3600 |

> Gercek degeri Resend dashboard'dan dogrula, bolgeye gore degisebilir.

---

## 7. Tam DNS Kayit Tablosu (Ozet)

Asagida tum DNS kayitlarinin birlesmis listesi. `5.75.165.158` yerine gercek IP adresini koy.

| Type | Name | Value | Priority | TTL |
|---|---|---|---|---|
| A | `@` | `5.75.165.158` | - | 300 |
| A | `www` | `5.75.165.158` | - | 300 |
| CAA | `@` | `0 issue "letsencrypt.org"` | - | 3600 |
| MX | `@` | `aspmx.l.google.com.` | 1 | 3600 |
| MX | `@` | `alt1.aspmx.l.google.com.` | 5 | 3600 |
| MX | `@` | `alt2.aspmx.l.google.com.` | 5 | 3600 |
| MX | `@` | `alt3.aspmx.l.google.com.` | 10 | 3600 |
| MX | `@` | `alt4.aspmx.l.google.com.` | 10 | 3600 |
| TXT | `@` | `google-site-verification=XXXXX` | - | 3600 |
| TXT | `@` | `v=spf1 include:_spf.google.com include:send.resend.com ~all` | - | 3600 |
| TXT | `google._domainkey` | `v=DKIM1; k=rsa; p=...` (Google'dan) | - | 3600 |
| CNAME | `resend._domainkey` | (Resend'den) | - | 3600 |
| CNAME | `s1._domainkey` | (Resend'den) | - | 3600 |
| CNAME | `s2._domainkey` | (Resend'den) | - | 3600 |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc-reports@inanctekstil.store; ruf=mailto:dmarc-reports@inanctekstil.store; fo=1` | - | 3600 |
| MX | `bounces` | `feedback-smtp.us-east-1.resend.com.` | 10 | 3600 |

---

## 8. DNS Dogrulama Komutlari

DNS kayitlarini ekledikten sonra propagasyon kontrolu icin:

```bash
# A kaydi kontrolu
dig +short inanctekstil.store A
dig +short www.inanctekstil.store A

# MX kaydi kontrolu
dig +short inanctekstil.store MX

# SPF kontrolu
dig +short inanctekstil.store TXT | grep spf

# DKIM kontrolu (Google)
dig +short google._domainkey.inanctekstil.store TXT

# DKIM kontrolu (Resend)
dig +short resend._domainkey.inanctekstil.store CNAME

# DMARC kontrolu
dig +short _dmarc.inanctekstil.store TXT

# CAA kontrolu
dig +short inanctekstil.store CAA
```

Online araclar:
- [MXToolbox](https://mxtoolbox.com/SuperTool.aspx) -- Tum DNS kayitlarini tek yerden kontrol et
- [Google Admin Toolbox Dig](https://toolbox.googleapps.com/apps/dig/) -- Google'in DNS arama araci
- [Mail Tester](https://www.mail-tester.com/) -- E-posta deliverability skoru

---

## 9. DNS Propagasyon Notlari

- A kayitlari icin TTL **300** (5 dakika) kullan — degisiklik gerektiginde hizli propagasyon saglar
- MX, TXT, CAA ve CNAME kayitlari icin TTL **3600** (1 saat) kullan — nadiren degistirilen kayitlar icin uygundur
- Her sey stabilize olduktan sonra A kayitlarinin TTL'lerini de **3600** veya **86400** (1 gun) olarak artirabilirsin
- DNS propagasyonu genellikle 5-30 dakika surer, ancak bazi durumlarda 48 saate kadar uzayabilir
- Propagasyon surecinde `dig` komutlariyla kontrol et, tarayiciya guvenme (tarayici cache'i yaniltici olabilir)
