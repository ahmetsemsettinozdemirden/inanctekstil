resource "hcloud_ssh_key" "inanctekstil" {
  name       = "inanctekstil"
  public_key = file(pathexpand(var.ssh_public_key_path))
}

resource "hcloud_firewall" "web" {
  name = "inanctekstil-web-fw"

  rule {
    description = "SSH"
    direction   = "in"
    protocol    = "tcp"
    port        = "22"
    source_ips  = ["0.0.0.0/0", "::/0"]
  }

  rule {
    description = "HTTP"
    direction   = "in"
    protocol    = "tcp"
    port        = "80"
    source_ips  = ["0.0.0.0/0", "::/0"]
  }

  rule {
    description = "HTTPS"
    direction   = "in"
    protocol    = "tcp"
    port        = "443"
    source_ips  = ["0.0.0.0/0", "::/0"]
  }
}

resource "hcloud_server" "web" {
  name        = "inanctekstil-web"
  server_type = var.server_type
  image       = "ubuntu-24.04"
  location    = var.server_location

  ssh_keys = [hcloud_ssh_key.inanctekstil.id]

  firewall_ids = [hcloud_firewall.web.id]

  backups = true

  labels = {
    project = "inanctekstil"
    role    = "web"
  }

  lifecycle {
    # The hcloud provider doesn't capture ssh_keys on import, causing a forced recreation diff.
    # SSH keys are injected via cloud-init at boot and can't be changed on a running server anyway.
    ignore_changes = [ssh_keys]
  }
}
