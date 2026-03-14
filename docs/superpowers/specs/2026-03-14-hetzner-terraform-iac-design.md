# Hetzner Terraform IaC Design Spec

## Overview

Infrastructure as Code setup for İnanç Tekstil e-commerce platform using Terraform to manage Hetzner Cloud resources (server, firewall, SSH key) and Hetzner Cloud DNS (zone, records).

**Repository:** `/Users/semsettin/workspace/inanc-tekstil/gitopsprod/`
**Hetzner Project:** inanctekstil

## Project Structure

```
gitopsprod/
├── .gitignore              # .tfstate, .tfvars, .terraform/
├── terraform.tfvars        # Variable values (gitignored)
├── variables.tf            # Variable declarations
├── versions.tf             # Terraform + provider versions + provider config
├── main.tf                 # Server, SSH key, firewall
├── dns.tf                  # Hetzner Cloud DNS zone + all records
├── outputs.tf              # Server IP, nameservers
└── README.md               # Setup and usage instructions
```

## Providers

| Provider | Registry | Version | Purpose | Token |
|----------|----------|---------|---------|-------|
| hetznercloud/hcloud | registry.terraform.io | ~> 1.60 | Server, firewall, SSH key, DNS zone, DNS records | Hetzner Cloud API token |

## Resources

### Server (main.tf)

**hcloud_ssh_key:**
- Name: `inanctekstil`
- Public key: read from `~/.ssh/inanctekstil.pub`

**hcloud_server:**
- Name: `inanctekstil-prod`
- Server type: `cx23` (2 vCPU, 4GB RAM, 40GB SSD, €3.62/month)
- Image: `ubuntu-24.04`
- Location: `nbg1` (Nuremberg, Germany)
- SSH key: reference to hcloud_ssh_key
- Firewall: reference to hcloud_firewall
- Labels: `role=web`, `project=inanctekstil`

**hcloud_firewall:**
- Name: `inanctekstil-web-fw`
- Rules (inbound):
  - TCP 22 (SSH) — from any
  - TCP 80 (HTTP) — from any
  - TCP 443 (HTTPS) — from any

### DNS (dns.tf)

**hcloud_zone:**
- Name: `inanctekstil.store`
- TTL: 3600

**hcloud_zone_record — A records:**
- `@` → server IPv4 (from hcloud_server output)
- `www` → server IPv4

**hcloud_zone_record — MX records (Google Workspace):**
- `@` → `aspmx.l.google.com` (priority 1)
- `@` → `alt1.aspmx.l.google.com` (priority 5)
- `@` → `alt2.aspmx.l.google.com` (priority 5)
- `@` → `alt3.aspmx.l.google.com` (priority 10)
- `@` → `alt4.aspmx.l.google.com` (priority 10)

**hcloud_zone_record — TXT records:**
- `@` → Google site verification
- `@` → SPF: `v=spf1 include:_spf.google.com include:send.resend.com ~all`
- `_dmarc` → DMARC: `v=DMARC1; p=none; rua=mailto:dmarc-reports@inanctekstil.store`
- `google._domainkey` → Google Workspace DKIM (actual value from DNS)

**Resend records:** Commented out in dns.tf, to be added after Resend domain verification.

Note: TXT record values must be wrapped in escaped double quotes (`"\"value\""`) per Hetzner Cloud DNS API requirement. DKIM records exceeding 255 characters must be split into multiple quoted strings.

## Variables

| Variable | Type | Description | Source |
|----------|------|-------------|--------|
| hcloud_token | string (sensitive) | Hetzner Cloud API token | terraform.tfvars |
| ssh_public_key_path | string | Path to SSH public key | default: ~/.ssh/inanctekstil.pub |
| server_type | string | Hetzner server type | default: cx23 |
| server_location | string | Hetzner datacenter | default: nbg1 |
| domain | string | Domain name | default: inanctekstil.store |

## Outputs

| Output | Description |
|--------|-------------|
| server_ipv4 | Server public IPv4 address |
| server_ipv6 | Server public IPv6 address |
| dns_nameservers | Hetzner DNS nameservers (to set at Namecheap) |
| site_url | Website URL (https://inanctekstil.store) |
| ssh_command | SSH connection command |

## Secrets Handling

- API token stored in `terraform.tfvars` (gitignored)
- `.gitignore` excludes: `*.tfstate`, `*.tfstate.backup`, `*.tfvars`, `.terraform/`, `*.tfplan`
- SSH private key never stored in repo or state

## What Terraform Does NOT Manage

- Docker / Docker Compose stack installation (post-provision via SSH)
- WordPress / WooCommerce setup
- SSL certificates (Let's Encrypt via Traefik)
- Google Workspace / Resend / PayTR account creation

## Post-Apply Steps

1. Note server IP from `terraform output`
2. Update Namecheap nameservers to Hetzner: hydrogen.ns.hetzner.com, oxygen.ns.hetzner.com, helium.ns.hetzner.de
3. SSH into server: `ssh -i ~/.ssh/inanctekstil root@<IP>`
4. Install Docker + Docker Compose, deploy Traefik + WordPress + MariaDB + Redis stack
5. Follow infrastructure docs in docs/infrastructure/
