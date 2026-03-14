# Sunucu Kurulumu: Hetzner CX23 + Docker + Traefik + WordPress

## 1. Hetzner Cloud CX23 Sunucu Tedariegi

### 1.1 Hetzner Cloud Hesabi Olusturma

1. [Hetzner Cloud Console](https://console.hetzner.cloud/) adresine git.
2. Hesap olustur ve kimlik dogrulama islemlerini tamamla.
3. Yeni bir proje olustur: **inanc-tekstil**

### 1.2 Sunucu Olusturma

Hetzner Cloud Console uzerinden:

- **Location:** Nuremberg (nbg1)
- **Image:** Ubuntu 24.04
- **Type:** Shared vCPU -- CX23 (2 vCPU, 4 GB RAM, 40 GB SSD)
- **Networking:** Public IPv4 + IPv6
- **SSH Key:** Mevcut SSH public key'ini ekle (asagida aciklanmistir)
- **Name:** `inanctekstil-prod`

### 1.3 SSH Key Hazirligi

Eger henuz bir SSH key parin yoksa, yerel makinende olustur:

```bash
ssh-keygen -t ed25519 -C "semsettin@inanctekstil.store" -f ~/.ssh/inanctekstil
```

Public key'i Hetzner'a ekle:

```bash
cat ~/.ssh/inanctekstil.pub
# Ciktiyi Hetzner Console > SSH Keys > Add SSH Key'e yapistir
```

### 1.4 Ilk Baglanti

Sunucu olusturulduktan sonra atanan IP adresi: `5.75.165.158`

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158
```

---

## 2. Ubuntu 24.04 Temel Yapilandirma

### 2.1 Sistem Guncelleme

```bash
apt update && apt upgrade -y
```

### 2.2 Hostname Ayarlama

```bash
hostnamectl set-hostname inanctekstil-prod
```

`/etc/hosts` dosyasina ekle:

```
127.0.1.1 inanctekstil-prod
```

### 2.3 Zaman Dilimi Ayarlama

```bash
timedatectl set-timezone Europe/Istanbul
```

### 2.4 Swap Alani Olusturma (Onerilen)

4 GB RAM ile WooCommerce + Docker konteynerleri icin swap faydali olabilir:

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

Dogrulama:

```bash
swapon --show
free -h
```

### 2.5 Temel Paketlerin Kurulumu

```bash
apt install -y curl wget git htop nano
```

---

## 3. Docker ve Docker Compose Kurulumu

### 3.1 Docker Engine Kurulumu

Docker'in resmi deposundan kurulum:

```bash
# Eski surumler varsa kaldir
apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Docker GPG anahtarini ekle
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

# Docker deposunu ekle
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker'i kur
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 3.2 Docker Kurulumunu Dogrula

```bash
docker --version
docker compose version
docker run --rm hello-world
```

### 3.3 Docker Servisini Etkinlestir

```bash
systemctl enable docker
systemctl start docker
```

### 3.4 Docker Log Boyutu Sinirlandirma

Docker loglarinin diski doldurmamasi icin `/etc/docker/daemon.json` olustur:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

```bash
systemctl restart docker
```

---

## 4. Proje Dizin Yapisi

```bash
mkdir -p /opt/inanctekstil/traefik /opt/inanctekstil/wordpress
cd /opt/inanctekstil
```

Dizin yapisi:

```
/opt/inanctekstil/
  ├── docker-compose.yml         # Ana yapilandirma dosyasi
  ├── .env                       # Ortam degiskenleri (sifreler vb.)
  ├── traefik/
  │   ├── traefik.yml            # Traefik statik yapilandirma
  │   └── acme.json              # Let's Encrypt sertifikalari (otomatik olusur)
  └── wordpress/
      └── uploads.ini            # PHP yapilandirma override
```

---

## 5. Traefik Yapilandirmasi

### 5.1 Traefik Statik Yapilandirma

`/opt/inanctekstil/traefik/traefik.yml` olustur:

```yaml
# Traefik Statik Yapilandirma
api:
  dashboard: false  # Guvenlik icin kapali, gerektiginde true yap

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"

certificatesResolvers:
  letsencrypt:
    acme:
      email: info@inanctekstil.store
      storage: /acme.json
      httpChallenge:
        entryPoint: web

providers:
  docker:
    exposedByDefault: false
    network: web

log:
  level: WARN

accessLog:
  filePath: /var/log/traefik/access.log
  bufferingSize: 100
```

### 5.2 Let's Encrypt Sertifika Dosyasi

```bash
touch /opt/inanctekstil/traefik/acme.json
chmod 600 /opt/inanctekstil/traefik/acme.json
```

> **Onemli:** `acme.json` dosyasi 600 izniyle olusturulmalidir, aksi takdirde Traefik calismaz.

---

## 6. WordPress PHP Yapilandirmasi

`/opt/inanctekstil/wordpress/uploads.ini` olustur:

```ini
; WooCommerce icin onerilen PHP ayarlari
file_uploads = On
memory_limit = 512M
upload_max_filesize = 64M
post_max_size = 64M
max_execution_time = 300
max_input_vars = 5000

; Performans ayarlari
opcache.enable = 1
opcache.memory_consumption = 128
opcache.interned_strings_buffer = 16
opcache.max_accelerated_files = 10000
opcache.revalidate_freq = 2

; Guvenlik
expose_php = Off
display_errors = Off
log_errors = On
```

---

## 7. Ortam Degiskenleri

`/opt/inanctekstil/.env` olustur:

```bash
# Veritabani Ayarlari
MYSQL_ROOT_PASSWORD=GUCLU_ROOT_SIFRESI_BURAYA
MYSQL_DATABASE=inanctekstil_db
MYSQL_USER=inanctekstil_user
MYSQL_PASSWORD=GUCLU_DB_SIFRESI_BURAYA

# WordPress Ayarlari
WORDPRESS_DB_HOST=mariadb:3306
WORDPRESS_DB_NAME=inanctekstil_db
WORDPRESS_DB_USER=inanctekstil_user
WORDPRESS_DB_PASSWORD=GUCLU_DB_SIFRESI_BURAYA
WORDPRESS_TABLE_PREFIX=inct_

# Domain
DOMAIN=inanctekstil.store
```

> **Guvenlik:** Bu dosyayi asla git reposuna commit etme. Guclu ve benzersiz sifreler olusturmak icin:
> ```bash
> openssl rand -base64 32
> ```

```bash
chmod 600 /opt/inanctekstil/.env
```

---

## 8. Docker Compose Yapilandirmasi

`/opt/inanctekstil/docker-compose.yml` olustur:

```yaml
services:
  traefik:
    image: traefik:v3.2
    container_name: traefik
    restart: unless-stopped
    security_opt:
      - no-new-privileges:true
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik/traefik.yml:/traefik.yml:ro
      - ./traefik/acme.json:/acme.json
      - traefik-logs:/var/log/traefik
    networks:
      - web

  mariadb:
    image: mariadb:11
    container_name: mariadb
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mariadb-data:/var/lib/mysql
    networks:
      - backend
    command: >
      --character-set-server=utf8mb4
      --collation-server=utf8mb4_unicode_ci
      --innodb-buffer-pool-size=256M
      --max-connections=100

  redis:
    image: redis:7-alpine
    container_name: redis
    restart: unless-stopped
    command: redis-server --maxmemory 128mb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    networks:
      - backend

  wordpress:
    image: wordpress:6-php8.2-apache
    container_name: wordpress
    restart: unless-stopped
    depends_on:
      - mariadb
      - redis
    environment:
      WORDPRESS_DB_HOST: ${WORDPRESS_DB_HOST}
      WORDPRESS_DB_NAME: ${WORDPRESS_DB_NAME}
      WORDPRESS_DB_USER: ${WORDPRESS_DB_USER}
      WORDPRESS_DB_PASSWORD: ${WORDPRESS_DB_PASSWORD}
      WORDPRESS_TABLE_PREFIX: ${WORDPRESS_TABLE_PREFIX}
    volumes:
      - wp-content:/var/www/html/wp-content
      - ./wordpress/uploads.ini:/usr/local/etc/php/conf.d/uploads.ini:ro
    networks:
      - web
      - backend
    labels:
      # Traefik routing
      - "traefik.enable=true"
      - "traefik.http.routers.wordpress.rule=Host(`${DOMAIN}`) || Host(`www.${DOMAIN}`)"
      - "traefik.http.routers.wordpress.entrypoints=websecure"
      - "traefik.http.routers.wordpress.tls.certresolver=letsencrypt"
      # www -> non-www yonlendirme
      - "traefik.http.middlewares.www-redirect.redirectregex.regex=^https://www\\.(.+)"
      - "traefik.http.middlewares.www-redirect.redirectregex.replacement=https://$${1}"
      - "traefik.http.middlewares.www-redirect.redirectregex.permanent=true"
      # Guvenlik basliklari
      - "traefik.http.middlewares.security-headers.headers.stsSeconds=31536000"
      - "traefik.http.middlewares.security-headers.headers.stsIncludeSubdomains=true"
      - "traefik.http.middlewares.security-headers.headers.contentTypeNosniff=true"
      - "traefik.http.middlewares.security-headers.headers.frameDeny=true"
      - "traefik.http.middlewares.security-headers.headers.browserXssFilter=true"
      - "traefik.http.middlewares.security-headers.headers.referrerPolicy=strict-origin-when-cross-origin"
      - "traefik.http.middlewares.security-headers.headers.permissionsPolicy=camera=(), microphone=(), geolocation=()"
      # Rate limiting
      - "traefik.http.middlewares.rate-limit.ratelimit.average=100"
      - "traefik.http.middlewares.rate-limit.ratelimit.burst=200"
      - "traefik.http.middlewares.rate-limit.ratelimit.period=1m"
      # Middleware zinciri
      - "traefik.http.routers.wordpress.middlewares=www-redirect,security-headers,rate-limit"

networks:
  web:
    name: web
  backend:
    name: backend
    internal: true  # Dis dunyadan erisim yok, sadece konteynerler arasi

volumes:
  mariadb-data:
  redis-data:
  wp-content:
  traefik-logs:
```

### 8.1 Mimari Aciklama

| Servis | Gorev | Ag |
|---|---|---|
| **traefik** | Reverse proxy, SSL terminasyonu, HTTP->HTTPS yonlendirme | web |
| **wordpress** | WordPress + Apache (PHP 8.2) | web + backend |
| **mariadb** | Veritabani (MySQL uyumlu, daha hafif) | backend |
| **redis** | Object cache (WooCommerce performansi) | backend |

- **web** agi: Traefik ve WordPress'in dis dunyaya acik agi
- **backend** agi: Internal (izole) -- MariaDB ve Redis sadece WordPress'ten erisilebilir, dis dunyadan erisilemez

---

## 9. Servisleri Baslatma

### 9.1 Ilk Baslatma

```bash
cd /opt/inanctekstil
docker compose up -d
```

### 9.2 Konteynerlerin Durumunu Kontrol Et

```bash
docker compose ps
```

Beklenen cikti (tum konteynerler "Up" olmali):

```
NAME        IMAGE                       STATUS          PORTS
traefik     traefik:v3.2                Up              0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
mariadb     mariadb:11                  Up              3306/tcp
redis       redis:7-alpine              Up              6379/tcp
wordpress   wordpress:6-php8.2-apache   Up              80/tcp
```

### 9.3 Loglari Kontrol Et

```bash
# Tum servislerin loglari
docker compose logs

# Belirli bir servisin loglari
docker compose logs traefik
docker compose logs wordpress
docker compose logs mariadb

# Canli log takibi
docker compose logs -f
```

### 9.4 SSL Sertifika Kontrolu

DNS A kaydi (`inanctekstil.store` -> `5.75.165.158`) ayarlandiktan sonra Traefik otomatik olarak Let's Encrypt sertifikasi alacaktir. Kontrol:

```bash
# Sertifika dosyasi olusmus mu?
ls -la /opt/inanctekstil/traefik/acme.json

# Traefik loglarinda sertifika islemini kontrol et
docker compose logs traefik | grep -i "acme\|certificate\|letsencrypt"

# Site'yi test et
curl -I https://inanctekstil.store
```

---

## 10. WordPress Ilk Kurulum

### 10.1 WordPress Kurulum Sihirbazi

Tarayicida `https://inanctekstil.store` adresine git. WordPress kurulum sihirbazi gorunecektir:

1. **Dil:** Turkce
2. **Site Basligi:** Inanc Tekstil
3. **Kullanici Adi:** `admin` degil, benzersiz bir kullanici adi sec (ornegin `semsettin_admin`)
4. **Sifre:** Guclu bir sifre (en az 16 karakter, ozel karakterler dahil)
5. **E-posta:** `info@inanctekstil.store`

### 10.2 WordPress Temel Ayarlar

WordPress admin paneline gir: `https://inanctekstil.store/wp-admin`

1. **Settings > General:**
   - Site Title: `Inanc Tekstil`
   - Tagline: `Iskenderun'un Ev Tekstili Magazasi`
   - Site Language: `Turkce`
   - Timezone: `UTC+3` (Istanbul)

2. **Settings > Permalinks:**
   - **Post name** (/%postname%/) sec -- SEO icin en iyi secenek

### 10.3 WooCommerce Kurulumu

```
WordPress Admin > Plugins > Add New > "WooCommerce" ara > Install > Activate
```

WooCommerce kurulum sihirbazini takip et:
- **Ulke:** Turkiye
- **Para Birimi:** Turk Lirasi (TRY / TL)
- **Urun Turleri:** Fiziksel urunler
- **Kargo:** Turkiye ici kargo (kurulum sonrasi ayarlanacak)

---

## 11. WP-CLI Kullanimi

Docker ortaminda wp-cli, WordPress konteynerinin icinden calistirilir:

### 11.1 Temel wp-cli Komutlari

```bash
cd /opt/inanctekstil

# WordPress bilgisi
docker compose exec wordpress wp --info --allow-root

# WordPress cekirdek guncelleme
docker compose exec wordpress wp core update --allow-root

# Tum eklentileri guncelle
docker compose exec wordpress wp plugin update --all --allow-root

# Veritabani optimizasyonu
docker compose exec wordpress wp db optimize --allow-root

# Eklenti kurulumu (ornek: Redis Object Cache)
docker compose exec wordpress wp plugin install redis-cache --activate --allow-root

# Cache temizleme
docker compose exec wordpress wp cache flush --allow-root
```

### 11.2 Kolaylik icin Alias Tanimla (Opsiyonel)

Sunucuda `/root/.bashrc` dosyasina ekle:

```bash
alias wp='cd /opt/inanctekstil && docker compose exec wordpress wp --allow-root'
```

Sonra kaynak olarak yukle:

```bash
source /root/.bashrc
```

Artik dogrudan `wp plugin list` gibi komutlar kullanabilirsin.

---

## 12. Redis Object Cache Yapilandirmasi

WooCommerce performansi icin Redis object cache kurulumu:

### 12.1 Redis Cache Eklentisini Kur

```bash
cd /opt/inanctekstil
docker compose exec wordpress wp plugin install redis-cache --activate --allow-root
```

### 12.2 wp-config.php'ye Redis Ayarlarini Ekle

WordPress konteynerine girip wp-config.php'yi duzenle:

```bash
docker compose exec wordpress bash
```

`/var/www/html/wp-config.php` dosyasina `/* That's all, stop editing! */` satirindan **once** asagidaki satirlari ekle:

```php
/* Redis Object Cache Ayarlari */
define('WP_REDIS_HOST', 'redis');
define('WP_REDIS_PORT', 6379);
define('WP_REDIS_TIMEOUT', 1);
define('WP_REDIS_READ_TIMEOUT', 1);
define('WP_REDIS_DATABASE', 0);
define('WP_CACHE_KEY_SALT', 'inanctekstil_');
```

Konteynerden cik:

```bash
exit
```

### 12.3 Redis Cache'i Etkinlestir

```bash
docker compose exec wordpress wp redis enable --allow-root
```

Dogrulama:

```bash
docker compose exec wordpress wp redis status --allow-root
```

Beklenen cikti: `Status: Connected`

---

## 13. WordPress Cron'u Sistem Cron ile Degistirme

WordPress'in dahili cron mekanizmasi yerine sistem cron'u kullanmak daha guvenilirdir.

### 13.1 wp-config.php'de WP Cron'u Kapat

wp-config.php dosyasina ekle (`/* That's all, stop editing! */` satirindan once):

```php
define('DISABLE_WP_CRON', true);
```

### 13.2 Sistem Cron'una Ekle

```bash
# Her 5 dakikada bir WordPress cron calistir
(crontab -l 2>/dev/null; echo "*/5 * * * * cd /opt/inanctekstil && docker compose exec -T wordpress wp cron event run --due-now --allow-root > /dev/null 2>&1") | crontab -
```

> `-T` flagi TTY olmadan calistirmayi saglar, cron icin gereklidir.

---

## 14. Docker Yonetimi ve Bakim

### 14.1 Temel Docker Compose Komutlari

```bash
cd /opt/inanctekstil

# Stack'i baslat
docker compose up -d

# Stack'i durdur
docker compose down

# Stack'i yeniden baslat
docker compose restart

# Belirli bir servisi yeniden baslat
docker compose restart wordpress

# Loglari goruntule
docker compose logs -f wordpress

# Konteyner icine gir
docker compose exec wordpress bash
docker compose exec mariadb mysql -u root -p
```

### 14.2 Kaynak Kullanimi Izleme

```bash
# Gercek zamanli kaynak kullanimi
docker stats

# Docker disk kullanimi
docker system df

# Kullanilmayan imajlari temizle
docker image prune -f
```

### 14.3 Redis Izleme

```bash
# Redis CLI'ya baglan
docker compose exec redis redis-cli

# Redis icinde:
INFO stats
DBSIZE
```

### 14.4 Docker Imaj Guncellemeleri

```bash
cd /opt/inanctekstil

# Yeni imajlari cek
docker compose pull

# Konteynerleri yeni imajlarla yeniden olustur
docker compose up -d

# Eski (kullanilmayan) imajlari temizle
docker image prune -f
```

> **Uyari:** Imaj guncelleme oncesi mutlaka yedek alin (bkz. [backup-recovery.md](backup-recovery.md)).

---

## 15. Sorun Giderme

### 15.1 Konteyner Baslamiyorsa

```bash
# Detayli log kontrol et
docker compose logs traefik
docker compose logs wordpress
docker compose logs mariadb

# Konteyneri yeniden olustur
docker compose up -d --force-recreate wordpress
```

### 15.2 SSL Sertifikasi Alinamiyorsa

Traefik loglarini kontrol et:

```bash
docker compose logs traefik | grep -i error
```

Sik karsilasilan sorunlar:
- DNS A kaydi henuz yayilmamis (24 saat bekle)
- Port 80 kapali (UFW kontrol et: `ufw status`)
- `acme.json` dosya izinleri yanlis (chmod 600 olmali)

### 15.3 WordPress Veritabani Baglanti Hatasi

```bash
# MariaDB konteynerinin calistigini dogrula
docker compose ps mariadb

# MariaDB loglarini kontrol et
docker compose logs mariadb

# Veritabanina baglanmayi dene
docker compose exec mariadb mysql -u ${MYSQL_USER} -p
```

### 15.4 Redis Baglanti Sorunu

```bash
# Redis konteynerinin calistigini dogrula
docker compose ps redis

# Redis'e ping at
docker compose exec redis redis-cli ping
# Cikti: PONG
```

---

## 16. Kurulum Sonrasi Kontrol Listesi

- [ ] SSH ile sunucuya basariyla baglaniliyor (`ssh -i ~/.ssh/inanctekstil root@5.75.165.158`)
- [ ] Docker ve Docker Compose kurulu ve calisiyor
- [ ] Tum konteynerler ayakta (`docker compose ps`)
- [ ] DNS A kaydi dogru IP'ye isaret ediyor (5.75.165.158)
- [ ] SSL sertifikasi basariyla alindi (Traefik + Let's Encrypt)
- [ ] HTTP -> HTTPS yonlendirmesi calisiyor
- [ ] www -> non-www yonlendirmesi calisiyor
- [ ] WordPress admin paneline giris yapilabiliyor
- [ ] WooCommerce kuruldu ve temel ayarlar yapildi
- [ ] Redis object cache bagli ve calisiyor
- [ ] WordPress cron sistem cron'una tasinmis
- [ ] PHP ayarlari ozellestrildi (512M memory limit vb.)
- [ ] Swap alani olusturuldu (2GB)
- [ ] Zaman dilimi Europe/Istanbul olarak ayarlandi
- [ ] Docker log boyutu sinirlandirilmis
- [ ] UFW guvenlik duvari yapilandirildi (bkz. [security.md](security.md))
- [ ] Veritabani yedegi test edildi
