resource "libvirt_volume" "ubuntu_base" {
  name   = "wm-netlab-app-node-ubuntu-24.04-base"
  pool   = var.storage_pool
  source = var.base_image_path
  format = "qcow2"
}

resource "libvirt_volume" "app_disk" {
  name           = "wm-netlab-app-node-disk"
  pool           = var.storage_pool
  base_volume_id = libvirt_volume.ubuntu_base.id
  size           = var.app_disk_size_gb * 1024 * 1024 * 1024
  format         = "qcow2"
}

data "template_file" "app_user_data" {
  template = file("${path.module}/cloud-init/app-user-data.yaml.tftpl")
  vars = {
    ssh_public_key = var.ssh_public_key
  }
}

data "template_file" "app_network_config" {
  template = file("${path.module}/cloud-init/app-network-config.yaml.tftpl")
}

resource "libvirt_cloudinit_disk" "app_cloudinit" {
  name           = "wm-netlab-app-node-cloudinit.iso"
  pool           = var.storage_pool
  user_data      = data.template_file.app_user_data.rendered
  network_config = data.template_file.app_network_config.rendered
}

resource "libvirt_domain" "app" {
  name   = "wm-netlab-app-node"
  vcpu   = var.app_vcpu
  memory = var.app_memory_mb

  disk {
    volume_id = libvirt_volume.app_disk.id
  }

  network_interface {
    network_name   = "wm-netlab-private"
    mac            = "52:54:00:ab:04:01"
    wait_for_lease = false
  }

  cloudinit = libvirt_cloudinit_disk.app_cloudinit.id

  console {
    type        = "pty"
    target_type = "serial"
    target_port = "0"
  }

  autostart = true
}

output "app_vm_ip" {
  value = "10.0.2.21"
}
