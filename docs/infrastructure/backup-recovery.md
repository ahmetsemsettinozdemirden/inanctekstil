# Yedekleme ve Kurtarma

Bu dokuman veri kaybi durumunda siteyi kurtarabilmek icin gereken yedekleme stratejisini ve kurtarma prosedurlerini kapsar.

## Yedekleme Stratejisi Ozeti

| Yontem | Kapsam | Siklik | Saklama | Hedef |
|---|---|---|---|---|
| Hetzner Snapshot | Tum sunucu (disk image) | Haftalik | Son 3 snapshot | Tam sunucu kurtarma |
| MariaDB Dump | Veritabani (docker compose exec) | Gunluk | Son 14 gun (yerel) + harici | Veritabani kurtarma |
| wp-content Volume | Docker volume (medya/tema/eklenti) | Gunluk | Son 14 gun (yerel) + harici | Dosya kurtarma |
| Traefik Sertifika | acme.json (Let's Encrypt) | Gunluk | Son 14 gun | SSL kurtarma |
| Harici Senkronizasyon | DB dump + wp-content + traefik | Gunluk | 30 gun | Off-site felaket kurtarma |

---

## 1. Hetzner Cloud Snapshot (Haftalik)

### 1.1 Manuel Snapshot Olusturma (Hetzner Console)

1. [Hetzner Cloud Console](https://console.hetzner.cloud/) > **Servers > inanctekstil-prod**
2. **Snapshots** sekmesi > **Create Snapshot**
3. Isimlendirme: `inanctekstil-prod-YYYY-MM-DD`

> **Maliyet:** Snapshot'lar 0.0108 EUR/GB/ay. 40 GB disk icin yaklasik 0.43 EUR/ay per snapshot. 3 snapshot saklarsan ~1.30 EUR/ay.

### 1.2 Otomatik Snapshot (Hetzner API ile)

Hetzner Cloud konsolunda yerlesik otomatik snapshot planlama yoktur, ancak API ile cron job olusturabilirsin.

#### Hetzner API Token Olusturma

1. Hetzner Cloud Console > **Security > API Tokens**
2. **Generate API Token** > Isim: `snapshot-automation` > Permission: **Read & Write**
3. Token'i kaydet

#### hcloud CLI Kurulumu

```bash
apt install -y hcloud-cli
# veya
curl -sL https://github.com/hetznercloud/cli/releases/latest/download/hcloud-linux-amd64.tar.gz | tar xz -C /usr/local/bin/
```

Kimlik dogrulama:

```bash
hcloud context create inanctekstil
# API token'i yapistir
```

#### Otomatik Snapshot Scripti

`/root/scripts/hetzner-snapshot.sh` olustur:

```bash
#!/bin/bash
# Hetzner Cloud Haftalik Snapshot Scripti
# Her Pazar 03:00'te calisir

set -euo pipefail

SERVER_NAME="inanctekstil-prod"
DATE=$(date '+%Y-%m-%d')
SNAPSHOT_NAME="${SERVER_NAME}-${DATE}"
KEEP_COUNT=3  # Son 3 snapshot'i sakla
LOG_FILE="/var/log/hetzner-snapshot.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "Snapshot olusturuluyor: $SNAPSHOT_NAME"

# Snapshot olustur
RESULT=$(hcloud server create-image --type snapshot --description "$SNAPSHOT_NAME" "$SERVER_NAME" 2>&1)
log "Sonuc: $RESULT"

# Eski snapshot'lari temizle
SNAPSHOTS=$(hcloud image list --type snapshot --selector "server=$SERVER_NAME" -o columns=id,created -o noheader | sort -k2 -r)
COUNT=0
while IFS= read -r line; do
    COUNT=$((COUNT + 1))
    if [ $COUNT -gt $KEEP_COUNT ]; then
        SNAP_ID=$(echo "$line" | awk '{print $1}')
        log "Eski snapshot siliniyor: ID=$SNAP_ID"
        hcloud image delete "$SNAP_ID" 2>&1 | tee -a "$LOG_FILE"
    fi
done <<< "$SNAPSHOTS"

log "Snapshot islemi tamamlandi."
```

```bash
mkdir -p /root/scripts
chmod +x /root/scripts/hetzner-snapshot.sh
```

Cron'a ekle:

```bash
# Her Pazar saat 03:00'te
(crontab -l 2>/dev/null; echo "0 3 * * 0 /root/scripts/hetzner-snapshot.sh") | crontab -
```

---

## 2. Gunluk MariaDB Yedekleme (Docker)

### 2.1 Veritabani Bilgilerini Ogrenme

Veritabani bilgileri `/opt/inanctekstil/.env` dosyasindadir:

```bash
grep -E "MYSQL_DATABASE|MYSQL_USER|MYSQL_PASSWORD" /opt/inanctekstil/.env
```

### 2.2 MariaDB Dump Scripti

`/root/scripts/mysql-backup.sh` olustur:

```bash
#!/bin/bash
# Gunluk MariaDB Yedekleme Scripti (Docker)
# Her gun saat 02:00'de calisir

set -euo pipefail

# Yapilandirma
COMPOSE_DIR="/opt/inanctekstil"
BACKUP_DIR="/root/backups/mysql"
KEEP_DAYS=14
DATE=$(date '+%Y-%m-%d_%H%M')
LOG_FILE="/var/log/mysql-backup.log"

# .env dosyasindan veritabani bilgilerini oku
source "${COMPOSE_DIR}/.env"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Yedekleme dizinini olustur
mkdir -p "$BACKUP_DIR"

BACKUP_FILE="${BACKUP_DIR}/${MYSQL_DATABASE}_${DATE}.sql.gz"

log "MariaDB yedekleme basliyor: $MYSQL_DATABASE"

# Docker konteynerinden mysqldump calistir ve gzip ile sikistir
cd "$COMPOSE_DIR"
docker compose exec -T mariadb mysqldump \
    --user="$MYSQL_USER" \
    --password="$MYSQL_PASSWORD" \
    --single-transaction \
    --routines \
    --triggers \
    --add-drop-table \
    "$MYSQL_DATABASE" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    FILESIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "Yedekleme basarili: $BACKUP_FILE ($FILESIZE)"
else
    log "HATA: Yedekleme basarisiz!"
    exit 1
fi

# Eski yedekleri temizle
DELETED=$(find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$KEEP_DAYS -delete -print | wc -l)
log "$DELETED adet eski yedek silindi (${KEEP_DAYS} gunden eski)."

log "MariaDB yedekleme tamamlandi."
```

### 2.3 wp-content Docker Volume Yedekleme

`/root/scripts/files-backup.sh` olustur:

```bash
#!/bin/bash
# Gunluk wp-content Docker volume yedekleme scripti

set -euo pipefail

COMPOSE_DIR="/opt/inanctekstil"
BACKUP_DIR="/root/backups/files"
KEEP_DAYS=14
DATE=$(date '+%Y-%m-%d_%H%M')
LOG_FILE="/var/log/files-backup.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

mkdir -p "$BACKUP_DIR"

BACKUP_FILE="${BACKUP_DIR}/wp-content_${DATE}.tar.gz"

log "wp-content volume yedekleme basliyor."

# WordPress konteynerinden wp-content dizinini arsivle
cd "$COMPOSE_DIR"
docker compose exec -T wordpress tar -czf - -C /var/www/html wp-content > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    FILESIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "Yedekleme basarili: $BACKUP_FILE ($FILESIZE)"
else
    log "HATA: wp-content yedeklemesi basarisiz!"
    exit 1
fi

# Eski yedekleri temizle
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$KEEP_DAYS -delete
log "wp-content volume yedekleme tamamlandi."
```

### 2.4 Traefik Sertifika Yedekleme

`/root/scripts/traefik-backup.sh` olustur:

```bash
#!/bin/bash
# Traefik Let's Encrypt sertifika yedekleme scripti

set -euo pipefail

TRAEFIK_DIR="/opt/inanctekstil/traefik"
BACKUP_DIR="/root/backups/traefik"
KEEP_DAYS=14
DATE=$(date '+%Y-%m-%d_%H%M')
LOG_FILE="/var/log/traefik-backup.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

mkdir -p "$BACKUP_DIR"

cp "${TRAEFIK_DIR}/acme.json" "${BACKUP_DIR}/acme_${DATE}.json"
log "Traefik sertifika yedekleme tamamlandi: acme_${DATE}.json"

# Eski yedekleri temizle
find "$BACKUP_DIR" -name "acme_*.json" -mtime +$KEEP_DAYS -delete
```

### 2.5 Cron Ayarlari

```bash
chmod +x /root/scripts/mysql-backup.sh
chmod +x /root/scripts/files-backup.sh
chmod +x /root/scripts/traefik-backup.sh
```

`crontab -e` ile ekle:

```
# Gunluk MariaDB yedekleme - 02:00
0 2 * * * /root/scripts/mysql-backup.sh

# Gunluk wp-content volume yedekleme - 02:30
30 2 * * * /root/scripts/files-backup.sh

# Gunluk Traefik sertifika yedekleme - 02:45
45 2 * * * /root/scripts/traefik-backup.sh

# Haftalik Hetzner snapshot - Pazar 03:00
0 3 * * 0 /root/scripts/hetzner-snapshot.sh
```

---

## 3. Harici Depolamaya Senkronizasyon

Yedeklerin sadece ayni sunucuda durmasi yeterli degil. Sunucu tamamen kaybolursa (disk arizasi, veri merkezi sorunu) yedekler de kaybolur. Harici depolamaya senkronize etmek gerekir.

### Secenek A: Hetzner Object Storage (S3 uyumlu) -- Onerilen

#### 3A.1 Hetzner Object Storage Olusturma

1. Hetzner Cloud Console > **Object Storage** > **Create Bucket**
2. Ayarlar:
   - **Name:** `inanctekstil-backups`
   - **Location:** `nbg1` (sunucu ile ayni bolge)
3. **S3 Credentials** olustur ve Access Key / Secret Key'i kaydet

#### 3A.2 s3cmd Kurulumu

```bash
apt install -y s3cmd
```

`/root/.s3cfg` yapilandir:

```bash
s3cmd --configure
```

Veya dogrudan `/root/.s3cfg` dosyasini olustur:

```ini
[default]
access_key = HETZNER_ACCESS_KEY
secret_key = HETZNER_SECRET_KEY
host_base = nbg1.your-objectstorage.com
host_bucket = %(bucket)s.nbg1.your-objectstorage.com
use_https = True
signature_v2 = False
```

> **Not:** `host_base` ve `host_bucket` degerlerini Hetzner Cloud Console'daki Object Storage detaylarindan al.

#### 3A.3 Senkronizasyon Scripti

`/root/scripts/sync-to-s3.sh` olustur:

```bash
#!/bin/bash
# Yedekleri Hetzner Object Storage'a senkronize et

set -euo pipefail

BUCKET="s3://inanctekstil-backups"
MYSQL_DIR="/root/backups/mysql"
FILES_DIR="/root/backups/files"
TRAEFIK_DIR="/root/backups/traefik"
LOG_FILE="/var/log/backup-sync.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "S3 senkronizasyonu basliyor."

# MariaDB yedeklerini senkronize et
s3cmd sync "$MYSQL_DIR/" "${BUCKET}/mysql/" --delete-removed >> "$LOG_FILE" 2>&1

# wp-content yedeklerini senkronize et
s3cmd sync "$FILES_DIR/" "${BUCKET}/files/" --delete-removed >> "$LOG_FILE" 2>&1

# Traefik sertifika yedeklerini senkronize et
s3cmd sync "$TRAEFIK_DIR/" "${BUCKET}/traefik/" --delete-removed >> "$LOG_FILE" 2>&1

log "S3 senkronizasyonu tamamlandi."
```

```bash
chmod +x /root/scripts/sync-to-s3.sh
```

Cron'a ekle:

```
# Gunluk S3 senkronizasyonu - 03:00 (yedeklemeler bittikten sonra)
0 3 * * * /root/scripts/sync-to-s3.sh
```

### Secenek B: Google Drive (rclone ile)

#### 3B.1 rclone Kurulumu

```bash
curl https://rclone.org/install.sh | bash
```

#### 3B.2 rclone Yapilandirmasi

```bash
rclone config
```

Adimlar:
1. **n** (new remote)
2. **Name:** `gdrive`
3. **Storage:** `drive` (Google Drive)
4. **client_id:** Bos birak (varsayilan)
5. **client_secret:** Bos birak
6. **scope:** `drive.file`
7. **root_folder_id:** Bos birak
8. **service_account_file:** Bos birak
9. **Auto config:** `n` (headless sunucu icin)
10. Verilen URL'yi tarayicida ac, Google hesabina giris yap, dogrulama kodunu yapistir

#### 3B.3 Google Drive Senkronizasyon Scripti

`/root/scripts/sync-to-gdrive.sh` olustur:

```bash
#!/bin/bash
# Yedekleri Google Drive'a senkronize et

set -euo pipefail

REMOTE="gdrive:inanctekstil-backups"
MYSQL_DIR="/root/backups/mysql"
FILES_DIR="/root/backups/files"
TRAEFIK_DIR="/root/backups/traefik"
LOG_FILE="/var/log/backup-sync.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "Google Drive senkronizasyonu basliyor."

# MariaDB yedeklerini senkronize et
rclone sync "$MYSQL_DIR" "${REMOTE}/mysql/" --log-file="$LOG_FILE" --log-level INFO

# wp-content yedeklerini senkronize et
rclone sync "$FILES_DIR" "${REMOTE}/files/" --log-file="$LOG_FILE" --log-level INFO

# Traefik sertifika yedeklerini senkronize et
rclone sync "$TRAEFIK_DIR" "${REMOTE}/traefik/" --log-file="$LOG_FILE" --log-level INFO

# 30 gunden eski dosyalari temizle
rclone delete "${REMOTE}" --min-age 30d --log-file="$LOG_FILE" --log-level INFO

log "Google Drive senkronizasyonu tamamlandi."
```

```bash
chmod +x /root/scripts/sync-to-gdrive.sh
```

---

## 4. Kurtarma Prosedureri

### 4.1 Senaryo 1: Hetzner Snapshot'tan Tam Sunucu Kurtarma

Bu senaryo sunucunun tamamen kullanilmaz hale geldigi durumlarda kullanilir (disk arizasi, yanlis yapilandirma, hacklenmis sunucu vb.).

**Adimlar:**

1. Hetzner Cloud Console > **Servers > inanctekstil-prod**
2. Sunucuyu durdur: **Power > Power Off**
3. **Snapshots** sekmesine git
4. Kurtarmak istedigin snapshot'i sec
5. **Restore** butonuna tikla (mevcut diski uzerine yazar)
6. Sunucuyu baslat: **Power > Power On**
7. SSH ile baglan ve servislerin calistigini dogrula:

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158

# Docker servisleri kontrol et
cd /opt/inanctekstil
docker compose ps

# Tum konteynerler ayakta mi?
docker compose ps --format "table {{.Name}}\t{{.Status}}"

# Web sitesini kontrol et
curl -I https://inanctekstil.store
```

> **Not:** Snapshot geri yukleme mevcut diski tamamen uzerine yazar. Snapshot alindindan bu yana yapilan tum degisiklikler kaybolur. Mumkunse once mevcut veritabaninin bir dump'ini al.

**Alternatif: Yeni Sunucuya Kurtarma**

Mevcut sunucuyu bozmadan yeni bir sunucu olusturup test etmek icin:

1. Hetzner Cloud Console > **Servers > Create Server**
2. **Image** bolumunde **Snapshots** sekmesini sec
3. Ilgili snapshot'i sec
4. Yeni sunucuyu olustur
5. Yeni sunucuda her seyin calistigini dogrula
6. DNS A kaydini yeni sunucunun IP'sine yonlendir
7. Eski sunucuyu sil

### 4.2 Senaryo 2: Veritabani Kurtarma (MariaDB Dump'tan)

Bu senaryo veritabaninin bozuldugu veya yanlis bir degisiklik yapildigi durumlarda kullanilir. Sunucu kendisi saglam.

#### Yerel Yedekten Kurtarma

```bash
# .env dosyasindan degiskenleri yukle
source /opt/inanctekstil/.env
cd /opt/inanctekstil

# Mevcut veritabaninin yedeginini al (guvenlik icin)
docker compose exec -T mariadb mysqldump \
    --user="$MYSQL_USER" \
    --password="$MYSQL_PASSWORD" \
    --single-transaction \
    "$MYSQL_DATABASE" | gzip > /root/backups/mysql/pre-restore-$(date +%Y%m%d_%H%M).sql.gz

# Mevcut yedekleri listele
ls -lh /root/backups/mysql/

# Yedegi geri yukle (ornek dosya adi ile)
gunzip -c /root/backups/mysql/inanctekstil_db_2026-03-13_0200.sql.gz | \
    docker compose exec -T mariadb mysql \
    --user="$MYSQL_USER" \
    --password="$MYSQL_PASSWORD" \
    "$MYSQL_DATABASE"
```

#### Harici Depolamadan Kurtarma (S3)

```bash
# S3'teki yedekleri listele
s3cmd ls s3://inanctekstil-backups/mysql/

# Yedegi indir
s3cmd get s3://inanctekstil-backups/mysql/inanctekstil_db_2026-03-13_0200.sql.gz /tmp/

# Geri yukle
source /opt/inanctekstil/.env
cd /opt/inanctekstil
gunzip -c /tmp/inanctekstil_db_2026-03-13_0200.sql.gz | \
    docker compose exec -T mariadb mysql \
    --user="$MYSQL_USER" \
    --password="$MYSQL_PASSWORD" \
    "$MYSQL_DATABASE"

# Gecici dosyayi temizle
rm /tmp/inanctekstil_db_2026-03-13_0200.sql.gz
```

#### Harici Depolamadan Kurtarma (Google Drive)

```bash
# Google Drive'daki yedekleri listele
rclone ls gdrive:inanctekstil-backups/mysql/

# Yedegi indir
rclone copy gdrive:inanctekstil-backups/mysql/inanctekstil_db_2026-03-13_0200.sql.gz /tmp/

# Geri yukle
source /opt/inanctekstil/.env
cd /opt/inanctekstil
gunzip -c /tmp/inanctekstil_db_2026-03-13_0200.sql.gz | \
    docker compose exec -T mariadb mysql \
    --user="$MYSQL_USER" \
    --password="$MYSQL_PASSWORD" \
    "$MYSQL_DATABASE"
```

#### Kurtarma Sonrasi Kontroller

```bash
cd /opt/inanctekstil

# WordPress'in calistigini dogrula
docker compose exec wordpress wp db check --allow-root

# Veritabani tablolarini listele
docker compose exec wordpress wp db tables --allow-root

# Site URL'sinin dogru oldugunu kontrol et
docker compose exec wordpress wp option get siteurl --allow-root
docker compose exec wordpress wp option get home --allow-root

# Redis object cache'i temizle
docker compose exec wordpress wp cache flush --allow-root

# Redis'i de temizle
docker compose exec redis redis-cli FLUSHALL
```

### 4.3 Senaryo 3: wp-content Kurtarma (Docker Volume)

Tema, eklenti veya medya dosyalari bozulduysa/silindiyse:

```bash
cd /opt/inanctekstil

# Mevcut wp-content'in yedeginini al
docker compose exec -T wordpress tar -czf - -C /var/www/html wp-content > \
    /root/backups/files/wp-content-pre-restore-$(date +%Y%m%d_%H%M).tar.gz

# Yedegi ac
mkdir -p /tmp/wp-restore
tar -xzf /root/backups/files/wp-content_2026-03-13_0230.tar.gz -C /tmp/wp-restore

# Konteynera geri yukle
docker compose cp /tmp/wp-restore/wp-content wordpress:/var/www/html/

# Dosya izinlerini duzelt
docker compose exec wordpress chown -R www-data:www-data /var/www/html/wp-content
docker compose exec wordpress find /var/www/html/wp-content -type d -exec chmod 755 {} \;
docker compose exec wordpress find /var/www/html/wp-content -type f -exec chmod 644 {} \;

# Temizlik
rm -rf /tmp/wp-restore

# Kontrol et
docker compose exec wordpress wp plugin list --allow-root
docker compose exec wordpress wp theme list --allow-root
```

### 4.4 Senaryo 4: Traefik SSL Sertifika Kurtarma

Let's Encrypt sertifikalari kaybolursa:

```bash
# Yedekten geri yukle
cp /root/backups/traefik/acme_2026-03-13_0245.json /opt/inanctekstil/traefik/acme.json
chmod 600 /opt/inanctekstil/traefik/acme.json

# Traefik'i yeniden baslat
cd /opt/inanctekstil
docker compose restart traefik
```

> **Not:** acme.json kaybolursa ve yedek yoksa endiselenme -- Traefik yeniden baslatildiginda Let's Encrypt'ten yeni sertifika otomatik olarak alacaktir.

### 4.5 Senaryo 5: Sifirdan Tam Kurtarma (Felaket Senaryosu)

Sunucu ve snapshot'lar tamamen kaybolmus, sadece harici yedekler kalmis:

1. **Yeni Hetzner sunucu olustur** ([server-setup.md](server-setup.md) Bolum 1-2)
2. **Docker ve Docker Compose kur** (Bolum 3)
3. **Proje dizinini olustur ve yapilandir** (Bolum 4-8):

```bash
mkdir -p /opt/inanctekstil/traefik /opt/inanctekstil/wordpress

# .env, docker-compose.yml, traefik.yml, uploads.ini dosyalarini olustur
# (server-setup.md'deki iceriklerle)
```

4. **Servisleri baslat:**

```bash
cd /opt/inanctekstil
docker compose up -d
```

5. **Veritabanini geri yukle:**

```bash
# Harici depolamadan yedegi indir
s3cmd get s3://inanctekstil-backups/mysql/inanctekstil_db_LATEST.sql.gz /tmp/
# veya
rclone copy gdrive:inanctekstil-backups/mysql/inanctekstil_db_LATEST.sql.gz /tmp/

# MariaDB'nin baslamasini bekle (birkac saniye)
sleep 10

# Veritabanini geri yukle
source /opt/inanctekstil/.env
cd /opt/inanctekstil
gunzip -c /tmp/inanctekstil_db_LATEST.sql.gz | \
    docker compose exec -T mariadb mysql \
    --user="$MYSQL_USER" \
    --password="$MYSQL_PASSWORD" \
    "$MYSQL_DATABASE"
```

6. **wp-content dosyalarini geri yukle:**

```bash
# Harici depolamadan yedegi indir
s3cmd get s3://inanctekstil-backups/files/wp-content_LATEST.tar.gz /tmp/
# veya
rclone copy gdrive:inanctekstil-backups/files/wp-content_LATEST.tar.gz /tmp/

# Yedegi ac ve konteynera yukle
mkdir -p /tmp/wp-restore
tar -xzf /tmp/wp-content_LATEST.tar.gz -C /tmp/wp-restore
docker compose cp /tmp/wp-restore/wp-content wordpress:/var/www/html/

# Izinleri duzelt
docker compose exec wordpress chown -R www-data:www-data /var/www/html/wp-content

# Temizlik
rm -rf /tmp/wp-restore
```

7. **DNS kayitlarini dogrula** (IP degismisse A kaydini guncelle)
8. **SSL sertifikasi:** Traefik otomatik olarak Let's Encrypt'ten yeni sertifika alacaktir
9. **Redis cache'i etkinlestir:**

```bash
docker compose exec wordpress wp redis enable --allow-root
```

10. **Tum guvenlik ayarlarini yeniden uygula** ([security.md](security.md))
11. **Site'yi test et:**

```bash
curl -I https://inanctekstil.store
docker compose exec wordpress wp option get siteurl --allow-root
```

---

## 5. Yedekleme Dogrulama

Yedekler alinsa bile calisiyor mu duzenli olarak kontrol etmek gerekir.

### 5.1 Aylik Kurtarma Testi

Her ay bir kez:

1. Yerel MariaDB yedeginin acilabildigini kontrol et:

```bash
gunzip -t /root/backups/mysql/$(ls -t /root/backups/mysql/ | head -1)
echo $?  # 0 = basarili
```

2. Yedek veritabanini test veritabanina yukle:

```bash
source /opt/inanctekstil/.env
cd /opt/inanctekstil

# Test veritabani olustur
docker compose exec -T mariadb mysql --user=root --password="${MYSQL_ROOT_PASSWORD}" \
    -e "CREATE DATABASE IF NOT EXISTS inanctekstil_test;"

# Yedegi yukle
gunzip -c /root/backups/mysql/$(ls -t /root/backups/mysql/ | head -1) | \
    docker compose exec -T mariadb mysql --user=root --password="${MYSQL_ROOT_PASSWORD}" inanctekstil_test

# Tablolari kontrol et
docker compose exec -T mariadb mysql --user=root --password="${MYSQL_ROOT_PASSWORD}" \
    -e "SELECT COUNT(*) FROM inanctekstil_test.inct_posts;"

# Test veritabanini sil
docker compose exec -T mariadb mysql --user=root --password="${MYSQL_ROOT_PASSWORD}" \
    -e "DROP DATABASE inanctekstil_test;"
```

3. Harici depolamadaki yedeklerin erisilebilir oldugunu dogrula:

```bash
s3cmd ls s3://inanctekstil-backups/mysql/ | tail -5
# veya
rclone ls gdrive:inanctekstil-backups/mysql/ | tail -5
```

### 5.2 Yedekleme Izleme Scripti

`/root/scripts/backup-monitor.sh` olustur:

```bash
#!/bin/bash
# Yedekleme izleme scripti -- cron ile gunluk calisir
# Son yedeklemenin basariyla alindigini dogrular

LOG_FILE="/var/log/backup-monitor.log"
MYSQL_DIR="/root/backups/mysql"
FILES_DIR="/root/backups/files"
TRAEFIK_DIR="/root/backups/traefik"
ALERT_EMAIL="info@inanctekstil.store"
TODAY=$(date '+%Y-%m-%d')

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

ERRORS=""

# MariaDB yedegini kontrol et
LATEST_MYSQL=$(find "$MYSQL_DIR" -name "*.sql.gz" -mtime -1 | head -1)
if [ -z "$LATEST_MYSQL" ]; then
    ERRORS="${ERRORS}HATA: Son 24 saatte MariaDB yedegi bulunamadi!\n"
    log "HATA: MariaDB yedegi eksik!"
else
    SIZE=$(stat -c%s "$LATEST_MYSQL" 2>/dev/null || stat -f%z "$LATEST_MYSQL")
    if [ "$SIZE" -lt 1024 ]; then
        ERRORS="${ERRORS}HATA: MariaDB yedegi cok kucuk ($SIZE bytes) -- muhtemelen bos!\n"
        log "HATA: MariaDB yedegi cok kucuk: $SIZE bytes"
    else
        log "OK: MariaDB yedegi mevcut: $LATEST_MYSQL ($(du -h "$LATEST_MYSQL" | cut -f1))"
    fi
fi

# wp-content yedegini kontrol et
LATEST_FILES=$(find "$FILES_DIR" -name "*.tar.gz" -mtime -1 | head -1)
if [ -z "$LATEST_FILES" ]; then
    ERRORS="${ERRORS}HATA: Son 24 saatte wp-content yedegi bulunamadi!\n"
    log "HATA: wp-content yedegi eksik!"
else
    log "OK: wp-content yedegi mevcut: $LATEST_FILES ($(du -h "$LATEST_FILES" | cut -f1))"
fi

# Traefik sertifika yedegini kontrol et
LATEST_TRAEFIK=$(find "$TRAEFIK_DIR" -name "acme_*.json" -mtime -1 | head -1)
if [ -z "$LATEST_TRAEFIK" ]; then
    ERRORS="${ERRORS}UYARI: Son 24 saatte Traefik sertifika yedegi bulunamadi!\n"
    log "UYARI: Traefik sertifika yedegi eksik!"
else
    log "OK: Traefik yedegi mevcut: $LATEST_TRAEFIK"
fi

# Docker konteynerlerinin calistigini kontrol et
cd /opt/inanctekstil
RUNNING=$(docker compose ps --format "{{.Name}}" --filter "status=running" 2>/dev/null | wc -l)
if [ "$RUNNING" -lt 4 ]; then
    ERRORS="${ERRORS}HATA: Bazi Docker konteynerleri calismiyordr! ($RUNNING/4 aktif)\n"
    log "HATA: Docker konteynerleri: $RUNNING/4 aktif"
fi

# Disk alani kontrolu
DISK_USAGE=$(df /root/backups --output=pcent | tail -1 | tr -d ' %')
if [ "$DISK_USAGE" -gt 80 ]; then
    ERRORS="${ERRORS}UYARI: Disk kullanimi %${DISK_USAGE} -- yedekleme alani azaliyor!\n"
    log "UYARI: Disk kullanimi %${DISK_USAGE}"
fi

# Hata varsa e-posta gonder
if [ -n "$ERRORS" ]; then
    echo -e "Inanc Tekstil Yedekleme Uyarisi\n\n${ERRORS}\nSunucu: $(hostname)\nTarih: ${TODAY}" | \
        mail -s "[UYARI] Yedekleme Sorunu - inanctekstil.store" "$ALERT_EMAIL"
    log "Uyari e-postasi gonderildi."
fi
```

```bash
chmod +x /root/scripts/backup-monitor.sh
```

Cron'a ekle:

```
# Gunluk yedekleme kontrolu - 04:00
0 4 * * * /root/scripts/backup-monitor.sh
```

---

## 6. Tam Cron Ozeti

Tum yedekleme ile ilgili cron job'lari tek bakista:

```
# Gunluk MariaDB yedekleme
0 2 * * * /root/scripts/mysql-backup.sh

# Gunluk wp-content volume yedekleme
30 2 * * * /root/scripts/files-backup.sh

# Gunluk Traefik sertifika yedekleme
45 2 * * * /root/scripts/traefik-backup.sh

# Gunluk harici depolamaya senkronizasyon
0 3 * * * /root/scripts/sync-to-s3.sh

# Haftalik Hetzner snapshot (Pazar)
0 3 * * 0 /root/scripts/hetzner-snapshot.sh

# Gunluk yedekleme dogrulama
0 4 * * * /root/scripts/backup-monitor.sh
```

Zaman akisi:

```
02:00  MariaDB dump alinir (docker compose exec)
02:30  wp-content Docker volume arsivlenir
02:45  Traefik acme.json yedeklenir
03:00  Tum yedekler S3/GDrive'a senkronize edilir
03:00  (Sadece Pazar) Hetzner snapshot alinir
04:00  Yedekleme dogrulama scripti calisir
```

---

## 7. Dizin Yapisi

```
/opt/inanctekstil/                    # Docker Compose proje dizini
  ├── docker-compose.yml
  ├── .env
  ├── traefik/
  │   ├── traefik.yml
  │   └── acme.json                   # Let's Encrypt sertifikalari
  └── wordpress/
      └── uploads.ini

/root/
  ├── scripts/
  │   ├── mysql-backup.sh             # MariaDB dump (docker compose exec)
  │   ├── files-backup.sh             # wp-content volume yedekleme
  │   ├── traefik-backup.sh           # Traefik sertifika yedekleme
  │   ├── sync-to-s3.sh              # veya sync-to-gdrive.sh
  │   ├── hetzner-snapshot.sh
  │   └── backup-monitor.sh
  └── backups/
      ├── mysql/                      # Son 14 gun MariaDB dump'lari
      │   ├── inanctekstil_db_2026-03-14_0200.sql.gz
      │   ├── inanctekstil_db_2026-03-13_0200.sql.gz
      │   └── ...
      ├── files/                      # Son 14 gun wp-content arsivleri
      │   ├── wp-content_2026-03-14_0230.tar.gz
      │   ├── wp-content_2026-03-13_0230.tar.gz
      │   └── ...
      └── traefik/                    # Son 14 gun Traefik sertifika yedekleri
          ├── acme_2026-03-14_0245.json
          ├── acme_2026-03-13_0245.json
          └── ...
```
