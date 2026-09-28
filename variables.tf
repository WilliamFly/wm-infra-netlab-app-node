variable "base_image_path" {
  description = "Path to the Ubuntu 24.04 cloud image to import as this VM's base volume"
  type        = string
}

variable "storage_pool" {
  description = "libvirt storage pool to use"
  type        = string
  default     = "default"
}

variable "ssh_public_key" {
  description = "SSH public key installed for the admin user via cloud-init"
  type        = string
}

variable "app_vcpu" {
  description = "vCPUs for the app VM"
  type        = number
  default     = 1
}

variable "app_memory_mb" {
  description = "Memory (MB) for the app VM"
  type        = number
  default     = 1024
}

variable "app_disk_size_gb" {
  description = "Disk size (GB) for the app VM's cloned volume"
  type        = number
  default     = 20
}

variable "db_host" {
  description = "Static IP of the shared DB VM (data-net)"
  type        = string
  default     = "10.0.3.20"
}

variable "db_name" {
  description = "Postgres database name"
  type        = string
  default     = "netlab_app"
}

variable "db_app_user" {
  description = "Postgres application role/user"
  type        = string
  default     = "app_user"
}

variable "db_app_password" {
  description = "Postgres application role password"
  type        = string
  sensitive   = true
}
