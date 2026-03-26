# Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the production Hetzner VPS and Docker stack against the 17 security issues identified in the March 2026 audit, without causing service downtime.

**Architecture:** Tasks are ordered from zero-risk to higher-risk. Each task can be executed independently. Phase 1 tasks require no service restarts. Phase 2 tasks require brief (~5s) per-container restarts. Phase 3 tasks are architectural and require planned maintenance windows. Every task includes a verification command that confirms success before you move on.

**Tech Stack:** Ubuntu 24.04, Docker Compose v2, Traefik v3, Bun 1.2, PostgreSQL 16-alpine, fail2ban, UFW, Terraform (HCloud + HetznerDNS providers)

**Server:** `5.75.165.158` — SSH as `root` using `ssh -i ~/.ssh/inanctekstil root@5.75.165.158`

**Working directory (local):** `/Users/semsettin/workspace/inanc-tekstil/`

---

## Pre-flight: Verify SSH Session Safety

Before any SSH-related change, always keep **two active SSH sessions open** — the existing one plus a second. If the second session opens successfully after a config change, the change is safe. Never close the first session until you've verified the second one works.

```bash
# Open second session in a new terminal tab before any SSH config change:
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 echo "second session OK"
```

---

## Phase 1 — Zero Downtime (no restarts, no rebuilds)

### Task 1: Install and Configure fail2ban

**Severity addressed:** CRITICAL — active brute force attacks in progress

**Files:**
- Create on server: `/etc/fail2ban/jail.local`
- No local files changed

This installs fail2ban and configures it to ban IPs after 5 failed SSH attempts for 1 hour. Safe to install on a live server — it adds iptables rules and does not touch existing services.

- [ ] **Step 1: Install fail2ban**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "apt-get install -y fail2ban"
```

Expected: `Setting up fail2ban` in output, exit 0.

- [ ] **Step 2: Create jail.local config**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5
banaction = iptables-multiport

[sshd]
enabled  = true
port     = ssh
logpath  = %(sshd_log)s
backend  = %(sshd_backend)s
maxretry = 3
bantime  = 86400
EOF"
```

- [ ] **Step 3: Enable and start fail2ban**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "
systemctl enable fail2ban &&
systemctl start fail2ban
"
```

- [ ] **Step 4: Verify fail2ban is active and SSH jail is running**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "fail2ban-client status sshd"
```

Expected output contains:
```
Status for the jail: sshd
|- Filter
|  |- Currently failed: <N>
|  `- Total failed:     <N>
`- Actions
   |- Currently banned: <N>
```

- [ ] **Step 5: Verify service is enabled at boot**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "systemctl is-enabled fail2ban"
```

Expected: `enabled`

- [ ] **Step 6: Commit** (nothing to commit locally — server-only change, document in git)

```bash
git add docs/superpowers/plans/2026-03-26-security-hardening.md
git commit -m "ops: document security hardening plan"
```

---

### Task 2: Remove Stale WordPress Cron Job

**Severity addressed:** HIGH — cron fires every 5 minutes against non-existent container

**Files:**
- Modify on server: root crontab

- [ ] **Step 1: View current crontab**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "crontab -l"
```

Expected to see two lines:
```
*/5 * * * * cd /opt/inanctekstil && docker compose exec -T wordpress wp cron event run --due-now --allow-root > /dev/null 2>&1
0 2 * * * /opt/backups/daily-backup.sh
```

- [ ] **Step 2: Remove the wordpress cron line, keep the backup cron**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "
crontab -l | grep -v 'wordpress' | crontab -
"
```

- [ ] **Step 3: Verify only backup cron remains**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "crontab -l"
```

Expected:
```
0 2 * * * /opt/backups/daily-backup.sh
```

No `wordpress` line.

---

### Task 3: Fix docker-compose.yml File Permissions

**Severity addressed:** MEDIUM — file is world-readable and owned by macOS UID 501

**Files:**
- Modify on server: `/opt/inanctekstil/docker-compose.yml` (permissions only)

- [ ] **Step 1: Check current permissions**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "ls -la /opt/inanctekstil/"
```

Expected: `-rw-r--r-- 1 501 staff` for docker-compose.yml

- [ ] **Step 2: Set correct ownership and permissions**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "
chown root:root /opt/inanctekstil/docker-compose.yml &&
chmod 640 /opt/inanctekstil/docker-compose.yml
"
```

`640` = root can read/write, root group can read, others cannot read.

- [ ] **Step 3: Verify**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "ls -la /opt/inanctekstil/docker-compose.yml"
```

Expected: `-rw-r----- 1 root root`

- [ ] **Step 4: Verify Docker Compose still works**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "cd /opt/inanctekstil && docker compose ps"
```

Expected: all containers shown as running/healthy.

---

### Task 4: Harden SSH Configuration

**Severity addressed:** HIGH — password auth open to world, X11Forwarding enabled

**Files:**
- Create on server: `/etc/ssh/sshd_config.d/hardening.conf`

**CRITICAL: Keep your current SSH session open during this entire task. Open a second terminal before Step 3.**

- [ ] **Step 1: Open a second SSH session in a new terminal to use as safety net**

In a NEW terminal tab/window:
```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "echo 'second session alive'"
```

Expected: `second session alive`. Keep this terminal open.

- [ ] **Step 2: Create the hardening config**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "cat > /etc/ssh/sshd_config.d/hardening.conf << 'EOF'
# Disable password authentication (key-only)
PasswordAuthentication no
KbdInteractiveAuthentication no

# Explicitly allow root with key only (no password)
PermitRootLogin prohibit-password

# Disable unnecessary features
X11Forwarding no
AllowTcpForwarding no
EOF"
```

- [ ] **Step 3: Validate config syntax before reloading**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "sshd -t"
```

Expected: no output, exit code 0. If there's an error, fix it before continuing.

- [ ] **Step 4: Reload SSH daemon (does NOT disconnect existing sessions)**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "systemctl reload ssh"
```

- [ ] **Step 5: Verify key login still works by opening a THIRD SSH session**

In a NEW terminal tab:
```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "echo 'third session works — hardening successful'"
```

Expected: `third session works — hardening successful`

If this fails, immediately run from one of the existing sessions:
```bash
rm /etc/ssh/sshd_config.d/hardening.conf && systemctl reload ssh
```

- [ ] **Step 6: Verify password auth is rejected**

```bash
ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no root@5.75.165.158 2>&1 | head -3
```

Expected: `Permission denied (publickey)` or connection timeout — NOT a password prompt.

- [ ] **Step 7: Verify config is active**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "sshd -T | grep -E 'passwordauthentication|x11forwarding|permitrootlogin'"
```

Expected:
```
passwordauthentication no
x11forwarding no
permitrootlogin prohibit-password
```

---

### Task 5: Fix DMARC Policy (DNS)

**Severity addressed:** MEDIUM — `p=none` means spoofed emails are delivered

**Files:**
- Modify local: `technical/gitopsprod/dns.tf` line 105

Change from `p=none` (monitor only) to `p=quarantine` (send to spam). Do NOT jump straight to `p=reject` — quarantine is the safe intermediate step.

- [ ] **Step 1: Edit dns.tf**

In `technical/gitopsprod/dns.tf`, change line 105:

```hcl
# Before:
value = "\"v=DMARC1; p=none; rua=mailto:dmarc@inanctekstil.store\""

# After:
value = "\"v=DMARC1; p=quarantine; rua=mailto:dmarc@inanctekstil.store\""
```

- [ ] **Step 2: Plan the change**

```bash
cd technical/gitopsprod
terraform plan -var-file=terraform.tfvars
```

Expected: exactly 1 resource change — `hcloud_zone_record.dmarc` update in-place. No deletions, no new resources.

- [ ] **Step 3: Apply**

```bash
terraform apply -var-file=terraform.tfvars
```

Type `yes` when prompted.

- [ ] **Step 4: Verify DNS propagation (wait ~60s)**

```bash
dig TXT _dmarc.inanctekstil.store +short
```

Expected: `"v=DMARC1; p=quarantine; rua=mailto:dmarc@inanctekstil.store"`

- [ ] **Step 5: Commit**

```bash
git add technical/gitopsprod/dns.tf
git commit -m "ops(security): tighten DMARC policy from p=none to p=quarantine"
```

---

## Phase 2 — Brief Container Restarts (~5–30s downtime per service)

### Task 6: Fix PostgreSQL Backup Script

**Severity addressed:** CRITICAL — both PostgreSQL databases have never been backed up; all DB backup files are 0 bytes

**Files:**
- Modify on server: `/opt/backups/daily-backup.sh`

The current script references `mariadb` (WordPress era, long deleted). Replace with `pg_dump` calls for both `pms` and `curtain` databases.

- [ ] **Step 1: Test pg_dump works for both databases now**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "
docker exec postgres pg_dump -U pms pms | head -5 &&
echo '--- pms dump OK ---' &&
docker exec curtain-db pg_dump -U curtain curtain | head -5 &&
echo '--- curtain dump OK ---'
"
```

Expected: PostgreSQL dump header lines for both, no errors.

- [ ] **Step 2: Replace the backup script**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158"cat > /opt/backups/daily-backup.sh << 'SCRIPT'
#!/bin/bash
set -euo pipefail
DATE=\$(date +%Y-%m-%d)
BACKUP_DIR=/opt/backups

# PostgreSQL dump — pms database
docker exec postgres pg_dump -U pms pms | gzip > \"\$BACKUP_DIR/db-pms-\$DATE.sql.gz\"

# PostgreSQL dump — curtain database
docker exec curtain-db pg_dump -U curtain curtain | gzip > \"\$BACKUP_DIR/db-curtain-\$DATE.sql.gz\"

# Traefik acme.json backup (TLS private keys)
cp /opt/inanctekstil/traefik/acme.json \"\$BACKUP_DIR/acme-\$DATE.json\"
chmod 600 \"\$BACKUP_DIR/acme-\$DATE.json\"

# Cleanup: keep last 14 days
find \$BACKUP_DIR -name 'db-pms-*.sql.gz' -mtime +14 -delete
find \$BACKUP_DIR -name 'db-curtain-*.sql.gz' -mtime +14 -delete
find \$BACKUP_DIR -name 'acme-*.json' -mtime +14 -delete

# Remove old zero-byte legacy files
find \$BACKUP_DIR -name 'db-*.sql' -size 0 -delete
find \$BACKUP_DIR -name 'wp-content-*.tar.gz' -delete

echo "\$(date): Backup completed (pms + curtain + acme)" >> /var/log/backup.log
SCRIPT"
```

- [ ] **Step 3: Make executable**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "chmod 750 /opt/backups/daily-backup.sh"
```

- [ ] **Step 4: Run backup manually and verify output**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "/opt/backups/daily-backup.sh && echo 'backup ran OK'"
```

Expected: `backup ran OK`, no errors.

- [ ] **Step 5: Verify backup files have content**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "
ls -lh /opt/backups/db-pms-*.sql.gz | tail -1 &&
ls -lh /opt/backups/db-curtain-*.sql.gz | tail -1 &&
echo 'sizes look good?'
"
```

Expected: both files exist and are non-zero (pms should be several KB at minimum).

- [ ] **Step 6: Verify backup is restorable (dry-run)**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "
TODAY=\$(date +%Y-%m-%d)
zcat /opt/backups/db-pms-\$TODAY.sql.gz | head -5
"
```

Expected: valid PostgreSQL dump header like `-- PostgreSQL database dump`.

- [ ] **Step 7: Clean up legacy 0-byte files from old script**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "
ls -lh /opt/backups/ | grep -E '\\.sql$|\\.tar\\.gz$'
"
```

Confirm these are zero bytes, then they'll be cleaned on next backup run.

---

### Task 7: Update Docker Packages

**Severity addressed:** MEDIUM — docker-ce, docker-ce-cli, docker-compose-plugin have pending security/bug fix releases

**Impact:** Docker daemon restarts. All containers will stop briefly (seconds) and restart automatically due to `restart: unless-stopped`.

- [ ] **Step 1: Check which services are currently healthy before upgrade**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "docker ps --format 'table {{.Names}}\t{{.Status}}'"
```

Record the current state. All should be `Up X days (healthy)` or `Up X days`.

- [ ] **Step 2: Apply Docker updates only**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "
apt-get install -y \
  docker-ce \
  docker-ce-cli \
  docker-compose-plugin \
  docker-ce-rootless-extras
"
```

Expected: upgrade messages, docker daemon restart, exit 0.

- [ ] **Step 3: Wait 30 seconds for containers to restart, then verify**

```bash
sleep 30
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "docker ps --format 'table {{.Names}}\t{{.Status}}'"
```

Expected: all 7 containers running. If any are missing, check logs:
```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "docker logs <container-name> --tail 20"
```

- [ ] **Step 4: Verify production endpoints are responding**

```bash
curl -sf -o /dev/null -w "%{http_code}" https://pms.inanctekstil.store/ && echo " pms OK" || echo " pms FAIL"
curl -sf -o /dev/null -w "%{http_code}" https://app.inanctekstil.store/ && echo " curtain-app OK" || echo " curtain-app FAIL"
curl -sf -o /dev/null -w "%{http_code}" https://hooks.inanctekstil.store/health && echo " analytics OK" || echo " analytics FAIL"
curl -sf -o /dev/null -w "%{http_code}" https://visualizer.inanctekstil.store/ && echo " visualizer OK" || echo " visualizer FAIL"
```

Expected: HTTP responses (pms will be 401 basic auth challenge = correct).

- [ ] **Step 5: Also update OS packages with pending security fixes**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "
apt-get install -y coreutils libnftables1 nftables
"
```

---

## Phase 3 — Container Hardening (per-service rebuild + restart, ~30s downtime each)

### Task 8: Run Application Containers as Non-Root Users

**Severity addressed:** CRITICAL — all app containers currently run as root inside the container

**Approach:** The `oven/bun:1.2` and `oven/bun:1.2-alpine` base images include a built-in `bun` user (UID 1000). Add `USER bun` to each Dockerfile. Each service is rebuilt and restarted individually.

**Files on server:**
- Modify: `/opt/pms/Dockerfile`
- Modify: `/opt/curtain-checkout-api/Dockerfile`
- Modify: `/opt/room-visualizer/Dockerfile`
- Modify: `/opt/analytics-forwarder/Dockerfile`

**Files in local repo (keep in sync):**
- Modify: `technical/room-visualizer/Dockerfile` (if it exists)

**Note on `/opt/products` volume:** The products directory is currently owned by UID 501 on the host. The `bun` user inside the container has UID 1000. We fix this by changing the host directory ownership to 1000 before restarting the pms container.

---

#### Task 8a: Harden analytics-forwarder (lowest risk, no shared volumes)

- [ ] **Step 1: Check current Dockerfile**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "cat /opt/analytics-forwarder/Dockerfile"
```

- [ ] **Step 2: Add USER instruction**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "cat > /opt/analytics-forwarder/Dockerfile << 'EOF'
FROM oven/bun:1.2-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

FROM base
COPY --from=deps /app/node_modules ./node_modules
COPY src/ ./src/
COPY package.json ./

USER bun
EXPOSE 3000
CMD ["bun", "src/server.ts"]
EOF"
```

- [ ] **Step 3: Rebuild and restart**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "
cd /opt/inanctekstil &&
docker compose up -d --build analytics-forwarder
"
```

- [ ] **Step 4: Verify container user and health**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "
docker exec analytics-forwarder whoami &&
docker inspect analytics-forwarder --format 'Status: {{.State.Status}}'
"
```

Expected: `bun` (not `root`), status `running`.

- [ ] **Step 5: Verify endpoint**

```bash
curl -sf https://hooks.inanctekstil.store/health
```

Expected: HTTP 200 response.

---

#### Task 8b: Harden curtain-app

- [ ] **Step 1: Add USER instruction**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "cat > /opt/curtain-checkout-api/Dockerfile << 'EOF'
FROM oven/bun:1.2-alpine
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile
COPY src ./src
USER bun
EXPOSE 3001
CMD ["bun", "src/server.ts"]
EOF"
```

- [ ] **Step 2: Rebuild and restart**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "
cd /opt/inanctekstil &&
docker compose up -d --build curtain-app
"
```

- [ ] **Step 3: Verify**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "docker exec curtain-app whoami"
```

Expected: `bun`

```bash
curl -sf -o /dev/null -w "%{http_code}" https://app.inanctekstil.store/
```

Expected: 200 or 404 (any non-5xx response is fine — confirms the service is running).

---

#### Task 8c: Harden room-visualizer

- [ ] **Step 1: Add USER instruction (uses glibc image, not alpine)**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "cat > /opt/room-visualizer/Dockerfile << 'EOF'
FROM oven/bun:1.2
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile
COPY src ./src
COPY baml_client ./baml_client
USER bun
EXPOSE 3000
CMD ["bun", "src/index.ts"]
EOF"
```

- [ ] **Step 2: Rebuild and restart**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "
cd /opt/inanctekstil &&
docker compose up -d --build room-visualizer
"
```

- [ ] **Step 3: Verify**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "docker exec room-visualizer whoami"
```

Expected: `bun`

```bash
curl -sf -o /dev/null -w "%{http_code}" https://visualizer.inanctekstil.store/
```

Expected: 200 or similar non-5xx.

---

#### Task 8d: Harden pms (requires /opt/products ownership fix)

The `pms` container mounts `/opt/products` read-only (product images). We need that directory to be readable by UID 1000 (the `bun` user).

- [ ] **Step 1: Check current ownership of /opt/products**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "ls -la /opt/products/ | head -5"
```

- [ ] **Step 2: Fix ownership so UID 1000 can read the directory**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "
chown -R 1000:1000 /opt/products
"
```

- [ ] **Step 3: Verify permissions**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "ls -la /opt/products/ | head -5"
```

Expected: `1000 1000` as owner/group.

- [ ] **Step 4: Add USER instruction to pms Dockerfile**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "cat > /opt/pms/Dockerfile << 'EOF'
FROM oven/bun:1.2-alpine AS base
WORKDIR /app

# Backend deps
FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Frontend deps + build
FROM base AS frontend
COPY frontend/package.json frontend/bun.lock* ./frontend/
RUN cd frontend && bun install --frozen-lockfile
COPY frontend ./frontend
RUN cd frontend && bun run build

# Final image
FROM base AS app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=frontend /app/frontend/dist ./frontend/dist
COPY . .

USER bun
EXPOSE 3000
CMD ["bun", "src/server.ts"]
EOF"
```

- [ ] **Step 5: Rebuild and restart**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "
cd /opt/inanctekstil &&
docker compose up -d --build pms
"
```

- [ ] **Step 6: Verify user, health, and product access**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "
docker exec pms whoami &&
docker exec pms ls /app/products | head -5
"
```

Expected: `bun`, and a list of product directories.

- [ ] **Step 7: Verify PMS is accessible**

```bash
curl -sf -o /dev/null -w "%{http_code}" https://pms.inanctekstil.store/
```

Expected: `401` (basic auth challenge — confirms service is running and Traefik is routing it correctly).

- [ ] **Step 8: Sync Dockerfiles back to local repo**

```bash
scp -i ~/.ssh/inanctekstil root@5.75.165.158:/opt/analytics-forwarder/Dockerfile technical/analytics-forwarder/Dockerfile
scp -i ~/.ssh/inanctekstil root@5.75.165.158:/opt/curtain-checkout-api/Dockerfile technical/curtain-checkout-api/Dockerfile
scp -i ~/.ssh/inanctekstil root@5.75.165.158:/opt/room-visualizer/Dockerfile technical/room-visualizer/Dockerfile
scp -i ~/.ssh/inanctekstil root@5.75.165.158:/opt/pms/Dockerfile technical/pms/Dockerfile
```

Adjust paths as needed if these Dockerfiles already exist locally.

- [ ] **Step 9: Commit**

```bash
git add technical/
git commit -m "ops(security): run all app containers as non-root bun user"
```

---

## Phase 4 — Architectural Changes

### Task 9: Replace Docker Socket in Traefik with Socket Proxy

**Severity addressed:** HIGH — Traefik has `docker.sock` mounted; socket access = root on host

**Approach:** Add a `socket-proxy` container (Tecnativa's well-known read-only proxy) that exposes only the container/network list endpoints Traefik needs. Traefik connects to it via TCP. Remove the `docker.sock` volume mount from Traefik.

**Impact:** Traefik restart (~5s). All services will continue running — Traefik will just reconnect via the proxy. TLS certificates are stored in `acme.json` (volume mount unchanged), so no certificate loss.

**Files:**
- Modify on server: `/opt/inanctekstil/docker-compose.yml`

- [ ] **Step 1: Verify the socket-proxy image is available**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "docker pull tecnativa/docker-socket-proxy:latest && echo 'pull OK'"
```

- [ ] **Step 2: Backup current docker-compose.yml**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "cp /opt/inanctekstil/docker-compose.yml /opt/inanctekstil/docker-compose.yml.bak"
```

- [ ] **Step 3: Add socket-proxy service and update Traefik in docker-compose.yml**

Edit `/opt/inanctekstil/docker-compose.yml` on the server. Replace the `traefik` service block and add `socket-proxy`:

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "cat > /tmp/docker-compose-patch.py << 'PYEOF'
import re, sys

compose = open('/opt/inanctekstil/docker-compose.yml').read()

# Replace traefik volumes section to remove docker.sock
old_traefik_volumes = """    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik/traefik.yml:/traefik.yml:ro
      - ./traefik/acme.json:/acme.json
      - traefik-logs:/var/log/traefik
    networks:
      - web"""

new_traefik_volumes = """    volumes:
      - ./traefik/traefik.yml:/traefik.yml:ro
      - ./traefik/acme.json:/acme.json
      - traefik-logs:/var/log/traefik
    networks:
      - web
      - socket-proxy-net
    depends_on:
      - socket-proxy"""

compose = compose.replace(old_traefik_volumes, new_traefik_volumes)
open('/opt/inanctekstil/docker-compose.yml', 'w').write(compose)
print('traefik volumes patched')
PYEOF
python3 /tmp/docker-compose-patch.py"
```

Then add the socket-proxy service and network. Because the compose file is complex, use a targeted append approach:

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "
# Insert socket-proxy service before the 'postgres:' service line
sed -i '/^  postgres:/i\\  socket-proxy:\n    image: tecnativa/docker-socket-proxy:latest\n    container_name: socket-proxy\n    restart: unless-stopped\n    environment:\n      CONTAINERS: 1\n      NETWORKS: 1\n      SERVICES: 1\n      TASKS: 1\n    volumes:\n      - /var/run/docker.sock:/var/run/docker.sock:ro\n    networks:\n      - socket-proxy-net\n    security_opt:\n      - no-new-privileges:true\n' /opt/inanctekstil/docker-compose.yml
"
```

Add the new network to the networks section:

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "
# Add socket-proxy-net to networks block
sed -i '/^networks:/a\\  socket-proxy-net:\n    name: socket-proxy-net\n    internal: true' /opt/inanctekstil/docker-compose.yml
"
```

- [ ] **Step 4: Update Traefik's traefik.yml to use TCP endpoint instead of socket**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "cat > /opt/inanctekstil/traefik/traefik.yml << 'EOF'
api:
  dashboard: false

entryPoints:
  web:
    address: \":80\"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: \":443\"

certificatesResolvers:
  letsencrypt:
    acme:
      email: info@inanctekstil.store
      storage: /acme.json
      httpChallenge:
        entryPoint: web

providers:
  docker:
    endpoint: \"tcp://socket-proxy:2375\"
    exposedByDefault: false
    network: web

log:
  level: WARN

accessLog:
  filePath: /var/log/traefik/access.log
  bufferingSize: 100
EOF"
```

- [ ] **Step 5: Validate the compose file syntax**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "cd /opt/inanctekstil && docker compose config > /dev/null && echo 'compose syntax OK'"
```

Expected: `compose syntax OK`. If error, restore backup:
```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "cp /opt/inanctekstil/docker-compose.yml.bak /opt/inanctekstil/docker-compose.yml"
```

- [ ] **Step 6: Start socket-proxy first, then restart Traefik**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "
cd /opt/inanctekstil &&
docker compose up -d socket-proxy &&
sleep 3 &&
docker compose up -d traefik
"
```

- [ ] **Step 7: Verify Traefik is running and routing correctly**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "docker ps --filter name=traefik --filter name=socket-proxy"
```

Expected: both containers `Up`.

```bash
curl -sf -o /dev/null -w "%{http_code}" https://pms.inanctekstil.store/ && echo " pms OK"
curl -sf -o /dev/null -w "%{http_code}" https://app.inanctekstil.store/ && echo " curtain-app OK"
curl -sf -o /dev/null -w "%{http_code}" https://hooks.inanctekstil.store/health && echo " analytics OK"
curl -sf -o /dev/null -w "%{http_code}" https://visualizer.inanctekstil.store/ && echo " visualizer OK"
```

All expected to respond (any non-network-error response).

- [ ] **Step 8: Verify Traefik no longer has docker.sock mounted**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "
docker inspect traefik --format '{{range .Mounts}}{{.Source}}{{println}}{{end}}' | grep -v docker.sock && echo 'no docker.sock — good' || echo 'WARNING: docker.sock still mounted'
"
```

Expected: `no docker.sock — good`

- [ ] **Step 9: Sync updated compose file to local repo**

```bash
scp -i ~/.ssh/inanctekstil root@5.75.165.158:/opt/inanctekstil/docker-compose.yml technical/gitopsprod/docker-compose.yml
```

- [ ] **Step 10: Commit**

```bash
git add technical/gitopsprod/docker-compose.yml technical/gitopsprod/traefik/traefik.yml
git commit -m "ops(security): replace docker.sock in traefik with read-only socket proxy"
```

---

### Task 10: Scope room-visualizer AWS Credentials

**Severity addressed:** LOW/MEDIUM — room-visualizer has AWS keys + Shopify token + Fal key; too much blast radius

**Approach:** Create a restricted AWS IAM policy that grants only the permissions `room-visualizer` actually needs (Bedrock invoke model calls in the configured region). Rotate the existing key in the `.env` to use the restricted one.

**Files:**
- AWS IAM console: create new policy + user
- Modify on server: `/opt/inanctekstil/.env`

- [ ] **Step 1: Identify what Bedrock permissions room-visualizer actually uses**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "
grep -r 'bedrock\|aws\|AWS' /opt/room-visualizer/src/ --include='*.ts' -l
"
```

Read the relevant files to confirm the exact API calls made (e.g., `InvokeModel`, `InvokeModelWithResponseStream`).

- [ ] **Step 2: In AWS IAM Console, create a restricted policy**

Policy name: `inanctekstil-room-visualizer-bedrock`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:us-east-1::foundation-model/*"
    }
  ]
}
```

Adjust region and resource ARN to match the value of `AWS_REGION` in `.env`.

- [ ] **Step 3: Create a new IAM user `inanctekstil-room-visualizer` with this policy only**

Attach only the above policy. Generate access keys. Note the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.

- [ ] **Step 4: Update the server .env with new restricted keys**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "
# Edit .env to replace AWS keys
# Use your preferred editor or sed:
# Replace AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY with the new restricted keys
nano /opt/inanctekstil/.env
"
```

- [ ] **Step 5: Restart room-visualizer to pick up new keys**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "
cd /opt/inanctekstil &&
docker compose up -d room-visualizer
"
```

- [ ] **Step 6: Test a real visualizer request**

```bash
curl -sf -o /dev/null -w "%{http_code}" https://visualizer.inanctekstil.store/
```

Then test an actual visualization from the Shopify storefront to confirm Bedrock calls work.

- [ ] **Step 7: Revoke the old shared AWS access key**

In AWS IAM Console, navigate to the old IAM user → Security credentials → deactivate then delete the key that was replaced.

---

## Post-Implementation Verification Checklist

Run this after all tasks are complete to confirm the full security posture:

```bash
# 1. fail2ban active
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "fail2ban-client status sshd | grep 'Currently banned'"

# 2. No stale cron
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "crontab -l"
# Should NOT contain 'wordpress'

# 3. SSH hardened
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "sshd -T | grep -E 'passwordauthentication|x11forwarding|permitrootlogin'"
# Expected: passwordauthentication no, x11forwarding no, permitrootlogin prohibit-password

# 4. Containers not root
for c in pms curtain-app room-visualizer analytics-forwarder; do
  echo -n "$c: "
  ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "docker exec $c whoami"
done
# Expected: bun for all

# 5. Traefik has no docker.sock
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "docker inspect traefik --format '{{range .Mounts}}{{.Source}}{{println}}{{end}}'"
# Should NOT contain /var/run/docker.sock

# 6. Backups working
ssh -i ~/.ssh/inanctekstil root@5.75.165.158 "ls -lh /opt/backups/db-pms-*.sql.gz | tail -1"
# Expected: non-zero file size

# 7. DMARC
dig TXT _dmarc.inanctekstil.store +short
# Expected: p=quarantine

# 8. All services up
curl -sf -o /dev/null -w "pms: %{http_code}\n" https://pms.inanctekstil.store/
curl -sf -o /dev/null -w "curtain-app: %{http_code}\n" https://app.inanctekstil.store/
curl -sf -o /dev/null -w "hooks: %{http_code}\n" https://hooks.inanctekstil.store/health
curl -sf -o /dev/null -w "visualizer: %{http_code}\n" https://visualizer.inanctekstil.store/
```

---

## Issues NOT Addressed in This Plan (Intentionally Deferred)

| Issue | Reason deferred |
|-------|----------------|
| Terraform remote state backend | Requires provisioning S3/GCS bucket; no immediate security risk since `.tfstate` is gitignored and kept locally |
| TLS certs backed up off-server | Requires setting up off-server storage (S3, Hetzner Object Storage); medium effort with low urgency given Let's Encrypt cert rotation |
| `curtain-app` auth middleware | Unknown if this API is intended to be public; requires product decision before adding auth |
| Read-only container filesystems | Bun runtime may need temp write access; needs testing per service to avoid runtime failures |
| SSH IP allowlist | You don't have a static IP; would lock you out from non-home networks |
