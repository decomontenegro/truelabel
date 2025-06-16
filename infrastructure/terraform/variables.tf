# Variables for True Label Infrastructure

variable "environment" {
  description = "Environment name (production, staging)"
  type        = string
  default     = "production"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "sa-east-1" # São Paulo
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "truelabel"
}

# Domain Configuration
variable "domain_name" {
  description = "Main domain name"
  type        = string
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID"
  type        = string
  sensitive   = true
}

variable "cloudflare_api_token" {
  description = "Cloudflare API Token"
  type        = string
  sensitive   = true
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
}

# ECS Configuration
variable "api_cpu" {
  description = "CPU units for API service"
  type        = number
  default     = 1024 # 1 vCPU
}

variable "api_memory" {
  description = "Memory for API service (MB)"
  type        = number
  default     = 2048 # 2GB
}

variable "api_desired_count" {
  description = "Desired number of API instances"
  type        = number
  default     = 3
}

variable "api_min_count" {
  description = "Minimum number of API instances"
  type        = number
  default     = 2
}

variable "api_max_count" {
  description = "Maximum number of API instances"
  type        = number
  default     = 10
}

# RDS Configuration
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.medium"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage (GB)"
  type        = number
  default     = 100
}

variable "db_max_allocated_storage" {
  description = "RDS max allocated storage (GB)"
  type        = number
  default     = 500
}

variable "db_backup_retention_period" {
  description = "Database backup retention period (days)"
  type        = number
  default     = 30
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "truelabel_admin"
  sensitive   = true
}

# Redis Configuration
variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t4g.small"
}

variable "redis_num_cache_nodes" {
  description = "Number of Redis cache nodes"
  type        = number
  default     = 2
}

# S3 Configuration
variable "enable_s3_versioning" {
  description = "Enable S3 versioning"
  type        = bool
  default     = true
}

variable "s3_lifecycle_days" {
  description = "S3 lifecycle transition to IA storage (days)"
  type        = number
  default     = 90
}

# Security
variable "allowed_ips" {
  description = "List of allowed IPs for administrative access"
  type        = list(string)
  default     = []
}

variable "enable_waf" {
  description = "Enable AWS WAF"
  type        = bool
  default     = true
}

# Monitoring
variable "enable_detailed_monitoring" {
  description = "Enable detailed CloudWatch monitoring"
  type        = bool
  default     = true
}

variable "alarm_email" {
  description = "Email for CloudWatch alarms"
  type        = string
}

# Cost Control
variable "enable_spot_instances" {
  description = "Use Spot instances for non-critical workloads"
  type        = bool
  default     = false
}