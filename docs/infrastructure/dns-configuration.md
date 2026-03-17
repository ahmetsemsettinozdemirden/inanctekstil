# DNS Yapilandirmasi

Bu dokuman `inanctekstil.store` alan adi icin gerekli tum DNS kayitlarini kapsar: Shopify baglantisi, Google Workspace e-posta ve e-posta guvenlik kayitlari.

> **Not:** DNS kayitlari alan adi saglayicinizin DNS panelinden yonetilir.
>
> Shopify baglantisi icin gerekli DNS kayitlari asagida belirtilmistir.

---

## 1. Shopify DNS Kayitlari

Shopify baglantisi icin A ve CNAME kayitlari:

### A Kaydi (Apex Domain)

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `@` | `23.227.38.65` | 300 |

**Not:** Bu Shopify'in standart IP adresidir. Shopify Admin > Ayarlar > Alan adlari bolumunden guncel IP'yi dogrula.

### CNAME Kaydi (www)

| Type | Name | Value | TTL |
|---|---|---|---|
| CNAME | `www` | `shops.myshopify.com.` | 300 |

### Shopify Alan Adi Baglama

```
Shopify Admin > Ayarlar > Alan adlari > Mevcut alan adi bagla
  Alan adi: inanctekstil.store
  Birincil alan adi olarak ayarla
```

Shopify, DNS kayitlarinin dogru oldugunu otomatik olarak dogrulayacaktir.

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

| Type | Name | Value | TTL |
|---|---|---|---|
| TXT | `@` | `google-site-verification=XXXXXXXXXXXXX` | 3600 |

> Google Admin Console'dan alinan dogrulama degerini `XXXXXXXXXXXXX` yerine yaz.

---

## 3. SPF (Sender Policy Framework)

SPF kaydi, hangi sunucularin domain adindan e-posta gondermesine izin verildigini belirtir.

| Type | Name | Value | TTL |
|---|---|---|---|
| TXT | `@` | `v=spf1 include:_spf.google.com include:shops.shopify.com ~all` | 3600 |

**Aciklama:**
- `include:_spf.google.com` -- Google Workspace sunucularina izin verir
- `include:shops.shopify.com` -- Shopify siparis bildirimleri icin izin verir
- `~all` -- Listede olmayan kaynaklar icin softfail

> **Uyari:** Birden fazla SPF kaydi (birden fazla `v=spf1` ile baslayan TXT kaydi) ekleme. Tek bir TXT kaydinda birlestir.

---

## 4. DKIM (DomainKeys Identified Mail)

### Google Workspace DKIM

1. [Google Admin Console](https://admin.google.com) > **Apps > Google Workspace > Gmail > Authenticate email**
2. **Generate new record** > DKIM key uzunlugu: **2048 bit** > Prefix: **google**
3. DNS kaydini ekle:

| Type | Name | Value | TTL |
|---|---|---|---|
| TXT | `google._domainkey` | `v=DKIM1; k=rsa; p=...` (Google'dan alinan tam deger) | 3600 |

4. Google Admin Console'da **Start authentication** butonuna tikla

---

## 5. DMARC

DMARC, SPF ve DKIM kontrollerinin basarisiz oldugu durumlarda ne yapilacagini belirler.

| Type | Name | Value | TTL |
|---|---|---|---|
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc-reports@inanctekstil.store; ruf=mailto:dmarc-reports@inanctekstil.store; fo=1` | 3600 |

### DMARC Gecis Plani

1. **Hafta 1-4:** `p=none` ile izle
2. **Hafta 5-8:** `p=quarantine; pct=50` ile gecis
3. **Hafta 9+:** `p=reject` ile sertlestir

---

## 6. Tam DNS Kayit Tablosu (Ozet)

| Type | Name | Value | Priority | TTL |
|---|---|---|---|---|
| A | `@` | `23.227.38.65` | - | 300 |
| CNAME | `www` | `shops.myshopify.com.` | - | 300 |
| MX | `@` | `aspmx.l.google.com.` | 1 | 3600 |
| MX | `@` | `alt1.aspmx.l.google.com.` | 5 | 3600 |
| MX | `@` | `alt2.aspmx.l.google.com.` | 5 | 3600 |
| MX | `@` | `alt3.aspmx.l.google.com.` | 10 | 3600 |
| MX | `@` | `alt4.aspmx.l.google.com.` | 10 | 3600 |
| TXT | `@` | `google-site-verification=XXXXX` | - | 3600 |
| TXT | `@` | `v=spf1 include:_spf.google.com include:shops.shopify.com ~all` | - | 3600 |
| TXT | `google._domainkey` | `v=DKIM1; k=rsa; p=...` (Google'dan) | - | 3600 |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc-reports@inanctekstil.store; ...` | - | 3600 |

---

## 7. DNS Dogrulama Komutlari

```bash
# A kaydi kontrolu (Shopify IP)
dig +short inanctekstil.store A

# CNAME kontrolu
dig +short www.inanctekstil.store CNAME

# MX kaydi kontrolu
dig +short inanctekstil.store MX

# SPF kontrolu
dig +short inanctekstil.store TXT | grep spf

# DKIM kontrolu (Google)
dig +short google._domainkey.inanctekstil.store TXT

# DMARC kontrolu
dig +short _dmarc.inanctekstil.store TXT
```

Online araclar:
- [MXToolbox](https://mxtoolbox.com/SuperTool.aspx) -- Tum DNS kayitlarini kontrol et
- [Mail Tester](https://www.mail-tester.com/) -- E-posta deliverability skoru

---

## 8. DNS Propagasyon Notlari

- A ve CNAME kayitlari icin TTL **300** (5 dakika) kullan
- MX ve TXT kayitlari icin TTL **3600** (1 saat) kullan
- DNS propagasyonu genellikle 5-30 dakika surer, ancak 48 saate kadar uzayabilir
- Propagasyon surecinde `dig` komutlariyla kontrol et
