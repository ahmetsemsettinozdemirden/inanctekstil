# Inanc Tekstil — Infrastructure as Code

Hetzner Cloud + DNS icin Terraform; PMS + curtain-checkout-api icin Docker Compose yapilandirmasi.

## Onkoşullar

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.5
- Hetzner Cloud API token
- SSH key pair: `~/.ssh/inanctekstil` ve `~/.ssh/inanctekstil.pub`

## Terraform Kurulum

```bash
# 1. Degiskenleri ayarla
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars dosyasini duzenle, token'i gir

# 2. Terraform baslatma
terraform init

# 3. Plan kontrol
terraform plan

# 4. Uygulama
terraform apply
```

## Terraform Kaynaklari

| Kaynak | Aciklama |
|--------|----------|
| hcloud_server.web | CX23 — Ubuntu 24.04, nbg1 (IP: 5.75.165.158) |
| hcloud_firewall.web | TCP 22, 80, 443 |
| hcloud_ssh_key.inanctekstil | SSH public key |
| hcloud_zone.main | inanctekstil.store DNS zone |
| hcloud_zone_record.* | A, MX, TXT kayitlari |

> **Not:** Terraform state yereldir (`terraform.tfstate`) — remote backend yoktur.

## Docker Stack

Sunucuda `/opt/inanctekstil/` dizininde calisir (`docker-compose.yml` bu repoda takip edilir).

| Servis | Imaj / Kaynak | Gorev | URL |
|--------|---------------|-------|-----|
| traefik | traefik:v3 | Reverse proxy, SSL (Let's Encrypt), routing | — |
| postgres | postgres:16-alpine | Veritabani (PMS icin) | — |
| pms | /opt/pms/ (Bun + React) | Urun yonetim sistemi | pms.inanctekstil.store |
| curtain-app | /opt/curtain-checkout-api/ (Bun) | Fiyat hesaplama + checkout API | app.inanctekstil.store |

### Sunucuda Kaynak Dizinleri

| Yol | Icerik |
|-----|--------|
| `/opt/inanctekstil/` | docker-compose.yml + Traefik config + .env |
| `/opt/pms/` | PMS kaynak kodu (frontend + backend) |
| `/opt/curtain-checkout-api/` | Curtain checkout API kaynak kodu |
| `/opt/products/` | Urun gorsel varliklari (swatches, katalog gorselleri) |

### Sunucuya Deploy

Deploy tamamen manueldir (CI/CD yoktur).

```bash
# SSH ile baglan
ssh -i ~/.ssh/inanctekstil root@5.75.165.158

# Kaynak kodunu guncelle (yerel makineden)
rsync -av --exclude node_modules ecommerce/pms/ root@5.75.165.158:/opt/pms/
rsync -av --exclude node_modules technical/curtain-checkout-api/ root@5.75.165.158:/opt/curtain-checkout-api/

# Servisi yeniden derle ve baslat
cd /opt/inanctekstil
docker compose up -d --build pms
# veya
docker compose up -d --build curtain-app
```

> **Onemli:** `/opt/pms/.dockerignore` dosyasi `**/node_modules` ve `frontend/dist` dislar.
> Bu olmadan Docker build context kirli `node_modules` kopyalar, Vite bundle bozulur.

### .env Dosyasi

`/opt/inanctekstil/.env` icerigi:

```
POSTGRES_PASSWORD=<hex>
SHOPIFY_STORE_DOMAIN=1z7hb1-2d.myshopify.com
SHOPIFY_ACCESS_TOKEN=<token>   # Bos birakilirsa Shopify sync calismaz
SHOPIFY_CLIENT_ID=<id>
SHOPIFY_CLIENT_SECRET=<secret>
FAL_KEY=<key>                  # Bos birakilirsa gorsel uretimi calismaz
```

## Apply Sonrasi Adimlar

1. `terraform output` ile sunucu IP adresini al
2. Namecheap'te nameserver'lari Hetzner'a yonlendir:
   - hydrogen.ns.hetzner.com
   - oxygen.ns.hetzner.com
   - helium.ns.hetzner.de
3. SSH ile sunucuya baglan: `ssh -i ~/.ssh/inanctekstil root@5.75.165.158`
4. `/opt/inanctekstil/.env` dosyasini olustur ve degerleri gir
5. `cd /opt/inanctekstil && docker compose up -d` ile stack'i baslat

## Dosya Yapisi

```
gitopsprod/
├── .gitignore
├── terraform.tfvars          # Gizli degerler (gitignored)
├── terraform.tfvars.example  # Ornek tfvars dosyasi
├── variables.tf              # Degisken tanimlari
├── versions.tf               # Provider versiyonlari
├── main.tf                   # Sunucu, SSH key, firewall
├── dns.tf                    # DNS zone ve kayitlari
├── outputs.tf                # Ciktilar (IP, nameservers, SSH komutu)
├── docker-compose.yml        # Uretim Docker stack (Traefik + Postgres + PMS + curtain-app)
└── README.md
```
