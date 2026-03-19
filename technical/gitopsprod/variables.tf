variable "hcloud_token" {
  description = "Hetzner Cloud API token"
  type        = string
  sensitive   = true
}

variable "ssh_public_key_path" {
  description = "Path to SSH public key"
  type        = string
  default     = "~/.ssh/inanctekstil.pub"
}

variable "server_type" {
  description = "Hetzner Cloud server type"
  type        = string
  default     = "cx23"
}

variable "server_location" {
  description = "Hetzner Cloud datacenter location"
  type        = string
  default     = "nbg1"
}

variable "domain" {
  description = "Domain name"
  type        = string
  default     = "inanctekstil.store"
}
