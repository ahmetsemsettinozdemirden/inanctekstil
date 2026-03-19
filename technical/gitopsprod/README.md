# Inanc Tekstil — Infrastructure as Code

Hetzner Cloud + DNS + Docker stack icin Terraform ve Docker Compose yapilandirmasi.

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
| hcloud_server.web | CX23 — Ubuntu 24.04, nbg1 |
| hcloud_firewall.web | TCP 22, 80, 443 |
| hcloud_ssh_key.inanctekstil | SSH public key |
| hcloud_zone.main | inanctekstil.store DNS zone |
| hcloud_zone_record.* | A, MX, TXT kayitlari |

## Docker Stack

Sunucuda `/opt/inanctekstil/` dizininde calisir. Kaynak dosyalar `docker/` klasorunde.

| Servis | Imaj | Gorev |
|--------|------|-------|
| traefik | traefik:v3.2 | Reverse proxy, SSL (Let's Encrypt), routing |
| wordpress | wordpress:6-php8.2-apache | WordPress + WooCommerce |
| mariadb | mariadb:11 | Veritabani |
| redis | redis:7-alpine | Object cache |

### Sunucuya Deploy

```bash
# 1. docker/ klasorunu sunucuya kopyala
scp -i ~/.ssh/inanctekstil -r docker/ root@<IP>:/opt/inanctekstil/

# 2. .env dosyasini olustur
ssh -i ~/.ssh/inanctekstil root@<IP>
cd /opt/inanctekstil
cp .env.example .env
# .env dosyasini duzenle, guclu sifreler olustur:
#   openssl rand -base64 32

# 3. acme.json olustur
touch traefik/acme.json && chmod 600 traefik/acme.json

# 4. Stack'i baslat
docker compose up -d
```

## Apply Sonrasi Adimlar

1. `terraform output` ile sunucu IP adresini al
2. Namecheap'te nameserver'lari Hetzner'a yonlendir:
   - hydrogen.ns.hetzner.com
   - oxygen.ns.hetzner.com
   - helium.ns.hetzner.de
3. SSH ile sunucuya baglan: `terraform output -raw ssh_command`
4. Docker stack'i deploy et (yukaridaki adimlari takip et)
5. Google Workspace ve Resend aktive ettikten sonra DKIM degerlerini dns.tf'e ekle ve `terraform apply` calistir

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
├── README.md
└── docker/                   # Docker Compose stack
    ├── docker-compose.yml    # Traefik + WordPress + MariaDB + Redis
    ├── .env.example          # Ornek ortam degiskenleri
    ├── .env                  # Gercek degerler (gitignored)
    ├── traefik/
    │   ├── traefik.yml       # Traefik statik yapilandirma
    │   └── acme.json         # Let's Encrypt sertifikalari (gitignored)
    └── wordpress/
        └── uploads.ini       # PHP yapilandirma
```
