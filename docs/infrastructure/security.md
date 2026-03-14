# Guvenlik Yapilandirmasi

Bu dokuman sunucu, Docker konteynerleri, Traefik ve WordPress katmanlarinda uygulanacak guvenlik onlemlerini kapsar.

---

## 1. UFW Guvenlik Duvari

### 1.1 UFW Kurulumu ve Temel Yapilandirma

UFW, Ubuntu 24.04 ile birlikte gelir. Aktif degilse:

```bash
# Mevcut durumu kontrol et
ufw status

# Varsayilan politikalari ayarla
ufw default deny incoming
ufw default allow outgoing
```

### 1.2 Gerekli Portlari Ac

Docker + Traefik yapisinda sadece web trafigi ve SSH portlari acik olmalidir:

```bash
# SSH (zorunlu -- bunu ONCE ekle, yoksa kilitlenirsin)
ufw allow 22/tcp comment 'SSH'

# HTTP ve HTTPS (Traefik reverse proxy icin)
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
```

> **Not:** Docker + Traefik yapisinda sadece 22, 80 ve 443 portlari gereklidir. Kontrol paneli portu (8090, 7080 vb.) bulunmaz -- sunucu tamamen SSH ve Docker Compose uzerinden yonetilir.

### 1.3 UFW'yi Etkinlestir

```bash
ufw enable
```

> **UYARI:** `ufw enable` komutunu calistirmadan once SSH (port 22) kuralinin eklendiginden **kesinlikle** emin ol. Aksi takdirde sunucuya erisiminizi kaybedersiniz.

### 1.4 Durumu Dogrula

```bash
ufw status verbose
```

Beklenen cikti:

```
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)
New profiles: skip

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW IN    Anywhere                   # SSH
80/tcp                     ALLOW IN    Anywhere                   # HTTP
443/tcp                    ALLOW IN    Anywhere                   # HTTPS
22/tcp (v6)                ALLOW IN    Anywhere (v6)              # SSH
80/tcp (v6)                ALLOW IN    Anywhere (v6)              # HTTP
443/tcp (v6)               ALLOW IN    Anywhere (v6)              # HTTPS
```

### 1.5 SSH Guvenlik Sertlestirme

`/etc/ssh/sshd_config` dosyasinda:

```bash
# Root login'i kapat (sudo kullanicisi olusturduysan)
PermitRootLogin no

# Sifre ile girisi kapat (sadece SSH key)
PasswordAuthentication no

# Bos sifrelere izin verme
PermitEmptyPasswords no

# Maksimum deneme sayisi
MaxAuthTries 3

# Sadece SSH protocol 2
Protocol 2
```

Degisiklikleri uygula:

```bash
systemctl restart sshd
```

> **UYARI:** `PermitRootLogin no` yapmadan once sudo kullanicisinin SSH key ile giris yapabildgindan emin ol. Yoksa sunucuya erisiminizi kaybedersiniz. Hetzner VNC uzerinden kurtarma yapilabilir ama zahmetlidir.

---

## 2. Docker Guvenlik Yapilandirmasi

### 2.1 Docker Network Izolasyonu

Docker Compose yapilandirmasinda iki ayri ag kullanilir:

- **web:** Traefik ve WordPress'in dis dunyaya acik agi
- **backend:** Internal (izole) ag -- MariaDB ve Redis sadece bu ag uzerinden erisilebilir

```yaml
networks:
  web:
    name: web
  backend:
    name: backend
    internal: true  # Dis dunyadan erisim yok
```

Bu sayede MariaDB ve Redis konteynerleri dis dunyadan dogrudan erisilemez. Sadece ayni `backend` agindaki WordPress konteyneri bu servislere ulasabilir.

### 2.2 Docker Socket Korumasi

Traefik konteynerine Docker socket read-only olarak baglanir:

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:ro
```

`:ro` (read-only) flagi Traefik'in Docker socket uzerinden sadece okuma yapmasini saglar.

### 2.3 No-New-Privileges

Traefik konteynerinde ek yetki kazanmayi engellemek icin:

```yaml
security_opt:
  - no-new-privileges:true
```

### 2.4 Read-Only Volumes

Hassas konfigurasyonlari read-only olarak mount etmek guvenlik katmani ekler:

```yaml
volumes:
  - ./traefik/traefik.yml:/traefik.yml:ro
  - ./wordpress/uploads.ini:/usr/local/etc/php/conf.d/uploads.ini:ro
```

> **Not:** WordPress wp-content volume'u read-write olmalidir cunku eklenti/tema yuklemesi, medya upload'u ve otomatik guncellemeler icin yazma erisimi gerekir.

### 2.5 Konteyner Yeniden Baslatma Politikasi

Tum konteynerler `restart: unless-stopped` ile yapilandirilmistir. Bu sayede:
- Sunucu yeniden basladiginda konteynerler otomatik baslar
- Bir konteyner crash olursa otomatik yeniden baslatilir
- Manuel olarak durdurulan konteynerler yeniden baslatilmaz

### 2.6 Docker Log Boyutu Sinirlandirma

Docker loglarinin diski doldurmamasi icin `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

### 2.7 Docker Imaj Guvenlik Taramasi

Konteyner imajlarini duzenli olarak guvenlik taramasi icin `docker scout` kullan:

```bash
docker scout cves wordpress:6-php8.2-apache
docker scout cves mariadb:11
```

---

## 3. Traefik Guvenlik Yapilandirmasi

Traefik, Docker ortaminda reverse proxy gorevini ustlenir. Guvenlik basliklarini ve rate limiting'i Docker label'lari uzerinden yapilandirir.

### 3.1 Guvenlik Basliklari

docker-compose.yml'deki WordPress servisinin label'lari uzerinden guvenlik basliklari otomatik eklenir:

```yaml
labels:
  # HSTS (Strict Transport Security)
  - "traefik.http.middlewares.security-headers.headers.stsSeconds=31536000"
  - "traefik.http.middlewares.security-headers.headers.stsIncludeSubdomains=true"
  # Content-Type sniffing korumasi
  - "traefik.http.middlewares.security-headers.headers.contentTypeNosniff=true"
  # Clickjacking korumasi
  - "traefik.http.middlewares.security-headers.headers.frameDeny=true"
  # XSS korumasi
  - "traefik.http.middlewares.security-headers.headers.browserXssFilter=true"
  # Referrer politikasi
  - "traefik.http.middlewares.security-headers.headers.referrerPolicy=strict-origin-when-cross-origin"
  # Permission politikasi
  - "traefik.http.middlewares.security-headers.headers.permissionsPolicy=camera=(), microphone=(), geolocation=()"
```

Bu basliklar her HTTP yanitina otomatik olarak eklenir. Kontrol etmek icin:

```bash
curl -I https://inanctekstil.store
```

Beklenen basliklar:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### 3.2 Rate Limiting

Traefik uzerinden rate limiting, DDoS ve brute-force saldirilarina karsi temel koruma saglar:

```yaml
labels:
  - "traefik.http.middlewares.rate-limit.ratelimit.average=100"
  - "traefik.http.middlewares.rate-limit.ratelimit.burst=200"
  - "traefik.http.middlewares.rate-limit.ratelimit.period=1m"
```

Bu ayarlar dakikada ortalama 100 istek, burst olarak 200 istege izin verir. Asildiginda Traefik `429 Too Many Requests` yaniti doner.

### 3.3 SSL/TLS Yapilandirmasi

Traefik, Let's Encrypt sertifikalari ile HTTPS'i otomatik yonetir:

- HTTP (port 80) otomatik olarak HTTPS'e (port 443) yonlendirilir
- Sertifikalar otomatik olarak yenilenir (suresi dolmadan 30 gun once)
- Sertifikalar `/opt/inanctekstil/traefik/acme.json` dosyasinda saklanir

### 3.4 Traefik Dashboard

Traefik dashboard varsayilan olarak devre disidir (`api.dashboard: false`). Gerektiginde gecici olarak etkinlestirmek icin:

1. `traefik.yml`'de `api.dashboard: true` yap
2. Mutlaka BasicAuth middleware ile koruma ekle
3. Islem bitince tekrar kapat

> **Not:** Dashboard'u acik birakma, sunucu yapilandirmaniz hakkinda bilgi sizdirir.

---

## 4. XML-RPC Devre Disi Birakma

XML-RPC, WordPress'te brute-force ve DDoS saldirilari icin yaygin bir hedef. Mobil uygulama veya uzak yayin kullanmiyorsan (ki muhtemelen kullanmiyorsun) kapat.

### Yontem 1: .htaccess ile

WordPress konteyneri resmi imaji Apache uzerinde calisir, dolayisiyla `.htaccess` destegi vardir:

```bash
cd /opt/inanctekstil
docker compose exec wordpress bash -c "cat >> /var/www/html/.htaccess << 'EOF'

# XML-RPC'yi tamamen engelle
<Files xmlrpc.php>
  Order Deny,Allow
  Deny from all
</Files>
EOF"
```

### Yontem 2: WordPress filtresi ile

wp-config.php dosyasina ekle (Docker konteynerinde):

```bash
cd /opt/inanctekstil
docker compose exec wordpress bash -c "sed -i \"/That's all, stop editing/i // XML-RPC devre disi birak\nadd_filter('xmlrpc_enabled', '__return_false');\" /var/www/html/wp-config.php"
```

> Yontem 1 daha etkilidir cunku istek PHP'ye ulasmadan engellenir.

---

## 5. WordPress Sertlestirme

### 5.1 wp-config.php Guvenlik Ayarlari

Docker konteynerine girip wp-config.php'yi duzenle:

```bash
cd /opt/inanctekstil
docker compose exec wordpress bash
```

Asagidaki satirlari `/var/www/html/wp-config.php` dosyasina ekle (`/* That's all, stop editing! */` satirindan once):

```php
// Dosya duzenlemeyi devre disi birak (tema/eklenti editoru)
define('DISALLOW_FILE_EDIT', true);

// Debug modunu kapat (production'da)
define('WP_DEBUG', false);
define('WP_DEBUG_LOG', false);
define('WP_DEBUG_DISPLAY', false);

// Otomatik guncelleme ayarlari
define('WP_AUTO_UPDATE_CORE', 'minor');  // Sadece minor/security guncellemeleri otomatik

// Post revision sayisini sinirla (disk alani tasarrufu)
define('WP_POST_REVISIONS', 5);

// Cop kutusunu otomatik bosalt (30 gun)
define('EMPTY_TRASH_DAYS', 30);

// WordPress cron icin sistem cron kullan (daha guvenilir)
define('DISABLE_WP_CRON', true);

// SSL admin zorunlu
define('FORCE_SSL_ADMIN', true);
```

### 5.2 WordPress Cron'u Sistem Cron ile Degistirme

`DISABLE_WP_CRON` ayarini yaptiysan, host sistem cron'una ekle:

```bash
(crontab -l 2>/dev/null; echo "*/5 * * * * cd /opt/inanctekstil && docker compose exec -T wordpress wp cron event run --due-now --allow-root > /dev/null 2>&1") | crontab -
```

> Bu, wp-cron'u her 5 dakikada bir Docker konteyneri icinde calistirir. `-T` flagi cron icin gereklidir (TTY olmadan calistirir).

### 5.3 Guvenlik Basliklarini Ekleme

Guvenlik basliklari Traefik middleware ile ayarlandi (bkz. Bolum 3.1). Traefik zaten bu basliklari her HTTP yanitina eklediginden `.htaccess` ile tekrar eklemeye gerek yoktur.

### 5.4 wp-config.php ve wp-includes Korumasi

```bash
cd /opt/inanctekstil
docker compose exec wordpress bash -c "cat >> /var/www/html/.htaccess << 'HTEOF'

# wp-config.php'ye dogrudan erisimi engelle
<Files wp-config.php>
  Order Allow,Deny
  Deny from All
</Files>

# wp-includes dizinindeki PHP dosyalarina dogrudan erisimi engelle
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^wp-admin/includes/ - [F,L]
  RewriteRule !^wp-includes/ - [S=3]
  RewriteRule ^wp-includes/[^/]+\\.php$ - [F,L]
  RewriteRule ^wp-includes/js/tinymce/langs/.+\\.php - [F,L]
  RewriteRule ^wp-includes/theme-compat/ - [F,L]
</IfModule>
HTEOF"
```

### 5.5 Dosya Izinleri

Docker konteyneri icinde dosya izinleri:

```bash
cd /opt/inanctekstil
docker compose exec wordpress bash -c "
find /var/www/html -type d -exec chmod 755 {} \;
find /var/www/html -type f -exec chmod 644 {} \;
chmod 600 /var/www/html/wp-config.php
chown -R www-data:www-data /var/www/html/wp-content
"
```

---

## 6. Giris Guvenlik Eklentileri

### 6.1 Limit Login Attempts Reloaded

```bash
cd /opt/inanctekstil
docker compose exec wordpress wp plugin install limit-login-attempts-reloaded --activate --allow-root
```

Onerilen ayarlar (WordPress Admin > **Settings > Limit Login Attempts**):

| Ayar | Deger |
|---|---|
| Allowed retries | 3 |
| Minutes lockout | 20 |
| Lockouts increase lockout time to | 24 saat |
| Hours until retries are reset | 12 |

### 6.2 Two-Factor Authentication (Opsiyonel ama Onerilen)

```bash
docker compose exec wordpress wp plugin install two-factor --activate --allow-root
```

WordPress Admin > **Users > Profile > Two-Factor Options**:
- **TOTP (Time-Based One-Time Password)** sec
- Google Authenticator veya Authy ile QR kodu tara

### 6.3 Login URL Degistirme (Opsiyonel)

```bash
docker compose exec wordpress wp plugin install wps-hide-login --activate --allow-root
```

WordPress Admin > **Settings > WPS Hide Login**:
- **Login URL:** `wp-admin` yerine benzersiz bir URL sec (ornegin `giris-paneli`)
- **Redirection URL:** `404`

Bu, botlarin `/wp-login.php` ve `/wp-admin` adreslerini otomatik olarak taramasini engeller.

---

## 7. Otomatik Guncelleme Yapilandirmasi

### 7.1 WordPress Cekirdek

`wp-config.php`'de `WP_AUTO_UPDATE_CORE` zaten ayarlandi:

```php
define('WP_AUTO_UPDATE_CORE', 'minor');  // 6.4.1 -> 6.4.2 otomatik, 6.4 -> 6.5 degil
```

Major guncellemeler icin manuel kontrol yap:

```bash
cd /opt/inanctekstil
docker compose exec wordpress wp core check-update --allow-root
docker compose exec wordpress wp core update --allow-root  # Manuel major guncelleme
```

### 7.2 Eklenti Otomatik Guncellemesi

WordPress Admin'den her eklenti icin "Enable auto-updates" secenegini ac, veya toplu olarak:

```bash
docker compose exec wordpress wp plugin auto-updates enable --all --allow-root
```

> **Uyari:** Otomatik eklenti guncellemeleri nadiren de olsa siteyi bozabilir. Yedekleme sisteminin calistigindan emin ol (bkz. [backup-recovery.md](backup-recovery.md)).

### 7.3 Docker Imaj Guncellemeleri

Docker imajlarini aylik olarak guncelle:

```bash
cd /opt/inanctekstil

# Yedek al (onemli!)
/root/scripts/mysql-backup.sh
/root/scripts/files-backup.sh

# Yeni imajlari cek ve konteynerleri yeniden olustur
docker compose pull
docker compose up -d

# Eski imajlari temizle
docker image prune -f
```

> **Not:** Bu islem once yeni imajlari indirir, sonra konteynerleri yeniden olusturur. Volume'lar korunur, veri kaybi olmaz.

### 7.4 Ubuntu Sistem Guncellemeleri

Otomatik guvenlik guncellemeleri icin `unattended-upgrades` yapilandir:

```bash
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

`/etc/apt/apt.conf.d/50unattended-upgrades` dosyasinda:

```
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}";
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};

// Gereksiz kernel paketlerini otomatik temizle
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";

// Otomatik yeniden baslatma (kernel guncellemelerinden sonra)
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "04:00";

// E-posta bildirimi (opsiyonel)
Unattended-Upgrade::Mail "info@inanctekstil.store";
Unattended-Upgrade::MailReport "on-change";
```

### 7.5 Haftalik Guncelleme Kontrol Scripti

`/root/scripts/weekly-update-check.sh` olustur:

```bash
#!/bin/bash
# Haftalik guncelleme kontrol scripti

LOG_FILE="/var/log/weekly-update-check.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')
COMPOSE_DIR="/opt/inanctekstil"

echo "=== Guncelleme Kontrolu: $DATE ===" >> "$LOG_FILE"

# WordPress cekirdek kontrolu
echo "--- WordPress Core ---" >> "$LOG_FILE"
cd "$COMPOSE_DIR" && docker compose exec -T wordpress wp core check-update --allow-root >> "$LOG_FILE" 2>&1

# Eklenti guncellemeleri
echo "--- Eklentiler ---" >> "$LOG_FILE"
cd "$COMPOSE_DIR" && docker compose exec -T wordpress wp plugin list --update=available --allow-root >> "$LOG_FILE" 2>&1

# Tema guncellemeleri
echo "--- Temalar ---" >> "$LOG_FILE"
cd "$COMPOSE_DIR" && docker compose exec -T wordpress wp theme list --update=available --allow-root >> "$LOG_FILE" 2>&1

# Ubuntu guncellemeleri
echo "--- Sistem Paketleri ---" >> "$LOG_FILE"
apt list --upgradable 2>/dev/null >> "$LOG_FILE"

echo "" >> "$LOG_FILE"
```

```bash
chmod +x /root/scripts/weekly-update-check.sh
```

Cron'a ekle (her pazartesi 09:00):

```bash
(crontab -l 2>/dev/null; echo "0 9 * * 1 /root/scripts/weekly-update-check.sh") | crontab -
```

---

## 8. Ek Guvenlik Onlemleri

### 8.1 Fail2Ban (Opsiyonel)

Limit Login Attempts eklentisine ek olarak sunucu seviyesinde koruma:

```bash
apt install -y fail2ban
```

`/etc/fail2ban/jail.local` olustur:

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 86400
```

```bash
systemctl enable fail2ban
systemctl start fail2ban
```

### 8.2 WordPress Salt Key Yenileme

WordPress'in guvenlik anahtarlarini periyodik olarak yenile:

```bash
cd /opt/inanctekstil
docker compose exec wordpress wp config shuffle-salts --allow-root
```

Bu komut tum oturumlari sonlandirir, tekrar giris yapmak gerekir.

### 8.3 Veritabani Tablo On Eki

WordPress kurulumunda varsayilan `wp_` on eki degistirilmeli. Docker Compose `.env` dosyasinda:

```
WORDPRESS_TABLE_PREFIX=inct_
```

Bu ayar ilk kurulumda gecerlidir. Mevcut kurulumda degistirmek risklidir.

### 8.4 Dosya Degisiklik Izleme

Wordfence veya Sucuri Security eklentisi dosya degisikliklerini izleyebilir. Basit bir alternatif:

```bash
# Mevcut dosya hash'lerini kaydet
cd /opt/inanctekstil
docker compose exec -T wordpress find /var/www/html -type f -name "*.php" -exec md5sum {} \; > /root/wp-file-hashes.txt

# Karsilastirma icin (cron veya manuel):
docker compose exec -T wordpress find /var/www/html -type f -name "*.php" -exec md5sum {} \; | diff /root/wp-file-hashes.txt - > /tmp/wp-file-changes.txt
```

---

## 9. Guvenlik Kontrol Listesi

- [ ] UFW etkin ve sadece 22, 80, 443 portlari acik
- [ ] SSH sifre girisi kapali, sadece key ile erisim
- [ ] Docker network izolasyonu yapilandirilmis (backend agi internal)
- [ ] Docker socket read-only baglanmis
- [ ] Docker log boyutu sinirlandirilmis
- [ ] Traefik guvenlik basliklari yapilandirilmis
- [ ] Traefik rate limiting etkin
- [ ] SSL/TLS otomatik (Traefik + Let's Encrypt)
- [ ] Traefik dashboard devre disi
- [ ] XML-RPC devre disi
- [ ] `DISALLOW_FILE_EDIT` aktif
- [ ] `FORCE_SSL_ADMIN` aktif
- [ ] Dosya izinleri dogru (644 dosya, 755 dizin, 600 wp-config.php)
- [ ] Limit Login Attempts eklentisi kurulu ve yapilandirilmis
- [ ] Two-Factor Authentication etkin (admin kullanici icin)
- [ ] Login URL degistirildi
- [ ] WordPress auto-update (minor) aktif
- [ ] Docker imajlari duzenli guncelleniyor
- [ ] Ubuntu unattended-upgrades aktif
- [ ] Fail2Ban kurulu ve etkin
- [ ] wp-config.php ve wp-includes korunuyor
- [ ] `.env` dosyasi 600 izniyle korunuyor
- [ ] Konteyner restart policy ayarlanmis (unless-stopped)
