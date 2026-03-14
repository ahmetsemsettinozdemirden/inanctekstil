output "server_ipv4" {
  description = "Server public IPv4 address"
  value       = hcloud_server.web.ipv4_address
}

output "server_ipv6" {
  description = "Server public IPv6 address"
  value       = hcloud_server.web.ipv6_address
}

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

output "ssh_command" {
  description = "SSH connection command"
  value       = "ssh -i ~/.ssh/inanctekstil root@${hcloud_server.web.ipv4_address}"
}
