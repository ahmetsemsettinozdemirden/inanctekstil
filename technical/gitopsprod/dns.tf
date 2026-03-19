resource "hcloud_zone" "main" {
  name = var.domain
  ttl  = 3600
  mode = "primary"
}

# --- A Records ---

# Shopify root domain
resource "hcloud_zone_record" "root" {
  zone  = hcloud_zone.main.id
  name  = "@"
  type  = "A"
  value = "23.227.38.65"
}

# Shopify www subdomain
resource "hcloud_zone_record" "www" {
  zone  = hcloud_zone.main.id
  name  = "www"
  type  = "CNAME"
  value = "shops.myshopify.com."
}

# Hetzner server — PMS app
resource "hcloud_zone_record" "pms" {
  zone  = hcloud_zone.main.id
  name  = "pms"
  type  = "A"
  value = "5.75.165.158"
}

# Hetzner server — Curtain configurator checkout API
resource "hcloud_zone_record" "app" {
  zone  = hcloud_zone.main.id
  name  = "app"
  type  = "A"
  value = "5.75.165.158"
}

# --- MX Records (Google Workspace) ---

resource "hcloud_zone_record" "mx_primary" {
  zone  = hcloud_zone.main.id
  name  = "@"
  type  = "MX"
  value = "1 aspmx.l.google.com."
}

resource "hcloud_zone_record" "mx_alt1" {
  zone  = hcloud_zone.main.id
  name  = "@"
  type  = "MX"
  value = "5 alt1.aspmx.l.google.com."
}

resource "hcloud_zone_record" "mx_alt2" {
  zone  = hcloud_zone.main.id
  name  = "@"
  type  = "MX"
  value = "5 alt2.aspmx.l.google.com."
}

resource "hcloud_zone_record" "mx_alt3" {
  zone  = hcloud_zone.main.id
  name  = "@"
  type  = "MX"
  value = "10 alt3.aspmx.l.google.com."
}

resource "hcloud_zone_record" "mx_alt4" {
  zone  = hcloud_zone.main.id
  name  = "@"
  type  = "MX"
  value = "10 alt4.aspmx.l.google.com."
}

# --- TXT Records ---

resource "hcloud_zone_record" "google_site_verification" {
  zone  = hcloud_zone.main.id
  name  = "@"
  type  = "TXT"
  value = "\"google-site-verification=G9nOXNt0Srf9QA2-Wz74zuzTNfTSI54tAPfs-_epc_I\""
}

resource "hcloud_zone_record" "facebook_domain_verification" {
  zone  = hcloud_zone.main.id
  name  = "@"
  type  = "TXT"
  value = "\"facebook-domain-verification=a88frdgxv5jt1kwa7kosgx34hf7wre\""
}

resource "hcloud_zone_record" "spf" {
  zone  = hcloud_zone.main.id
  name  = "@"
  type  = "TXT"
  value = "\"v=spf1 include:_spf.google.com include:send.resend.com ~all\""
}

resource "hcloud_zone_record" "dmarc" {
  zone  = hcloud_zone.main.id
  name  = "_dmarc"
  type  = "TXT"
  value = "\"v=DMARC1; p=none; rua=mailto:dmarc@inanctekstil.store\""
}

# --- DKIM Records ---

# Google Workspace DKIM (actual value from current DNS)
resource "hcloud_zone_record" "google_dkim" {
  zone  = hcloud_zone.main.id
  name  = "google._domainkey"
  type  = "TXT"
  value = "\"v=DKIM1;k=rsa;p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAulwb5OpvApe8mbQQhv14fPjUuL3aZZ9LZ7RdMC/Xk2LRkaTV1qaktoPBEF7LpABIfegEMMpMUUdCMHlwiTWrUHBMFBu2+ghM5oEP6HRqikICZhreyOdwMo/rtl9GkMVnt2YRPTuOgAZcNEi3jcfl+heFjfrfI6cJuuFatAjwIim+SW3UxGkRLKNUHCPcb86T/D9\" \"gY79PWpBQiAUC8XZqhg2+tJLhOEJa4Ue0ciLPgOASyK5hO/Bbxn9fcdiIX5BMdLHdEmBCN0QFW7YAWHTMeDDANUyeqTQFGXJCIrZkBFdHYRQrHDUd7e2b+k0iTRRn1BTovTO2yB6NkO+ZmGbwDQIDAQAB\""
}

# --- Shopify Email Authentication (DKIM) ---

resource "hcloud_zone_record" "shopify_dkim1" {
  zone  = hcloud_zone.main.id
  name  = "btf._domainkey"
  type  = "CNAME"
  value = "dkim1.95a11744dddb.p708.email.myshopify.com."
}

resource "hcloud_zone_record" "shopify_dkim2" {
  zone  = hcloud_zone.main.id
  name  = "btf2._domainkey"
  type  = "CNAME"
  value = "dkim2.95a11744dddb.p708.email.myshopify.com."
}

resource "hcloud_zone_record" "shopify_mailer" {
  zone  = hcloud_zone.main.id
  name  = "mailerbtf"
  type  = "CNAME"
  value = "95a11744dddb.p708.email.myshopify.com."
}

# Resend records — will be added after Resend domain verification
# Uncomment and fill values from Resend dashboard when ready:
#
# resource "hcloud_zone_record" "resend_dkim" {
#   zone  = hcloud_zone.main.id
#   name  = "resend._domainkey"
#   type  = "CNAME"
#   value = "value-from-resend-dashboard"
# }
