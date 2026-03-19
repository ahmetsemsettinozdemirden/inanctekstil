output "dns_nameservers" {
  description = "Set these nameservers at Namecheap"
  value = [
    "hydrogen.ns.hetzner.com",
    "oxygen.ns.hetzner.com",
    "helium.ns.hetzner.de",
  ]
}

output "site_url" {
  description = "Website URL"
  value       = "https://${var.domain}"
}
