# Terraform Outputs

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

# ALB Outputs
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

# CloudFront Outputs
output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.domain_name
}

# RDS Outputs
output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "rds_database_name" {
  description = "RDS database name"
  value       = aws_db_instance.main.db_name
}

# Redis Outputs
output "redis_primary_endpoint" {
  description = "Redis primary endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
  sensitive   = true
}

output "redis_reader_endpoint" {
  description = "Redis reader endpoint"
  value       = aws_elasticache_replication_group.redis.reader_endpoint_address
  sensitive   = true
}

# S3 Outputs
output "s3_uploads_bucket" {
  description = "Name of the S3 uploads bucket"
  value       = aws_s3_bucket.uploads.id
}

output "s3_backups_bucket" {
  description = "Name of the S3 backups bucket"
  value       = aws_s3_bucket.backups.id
}

output "s3_static_bucket" {
  description = "Name of the S3 static assets bucket"
  value       = aws_s3_bucket.static_assets.id
}

# ECR Output
output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.api.repository_url
}

# ECS Outputs
output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.api.name
}

# Bastion Outputs
output "bastion_public_ip" {
  description = "Public IP address of the Bastion host"
  value       = aws_eip.bastion.public_ip
}

output "bastion_instance_id" {
  description = "Instance ID of the Bastion host"
  value       = aws_instance.bastion.id
}

# Secrets Manager Outputs
output "secrets_arns" {
  description = "ARNs of secrets in Secrets Manager"
  value = {
    db_password    = aws_secretsmanager_secret.db_password.arn
    jwt_secret     = aws_secretsmanager_secret.jwt_secret.arn
    redis_password = aws_secretsmanager_secret.redis_password.arn
    api_keys       = aws_secretsmanager_secret.api_keys.arn
    email_config   = aws_secretsmanager_secret.email_config.arn
  }
  sensitive = true
}

# CloudWatch Outputs
output "cloudwatch_log_groups" {
  description = "CloudWatch log group names"
  value = {
    ecs        = aws_cloudwatch_log_group.ecs.name
    vpc_flow   = aws_cloudwatch_log_group.flow_log.name
    redis_slow = aws_cloudwatch_log_group.redis_slow.name
  }
}

# SNS Topic Output
output "sns_alert_topic_arn" {
  description = "ARN of the SNS alerts topic"
  value       = aws_sns_topic.alerts.arn
}

# WAF Outputs
output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = var.enable_waf ? aws_wafv2_web_acl.main[0].id : null
}

# DNS Outputs
output "dns_records" {
  description = "DNS records to be configured"
  value = {
    root = {
      type  = "CNAME"
      value = aws_cloudfront_distribution.main.domain_name
    }
    www = {
      type  = "CNAME"
      value = aws_cloudfront_distribution.main.domain_name
    }
    api = {
      type  = "CNAME"
      value = aws_lb.main.dns_name
    }
  }
}

# Environment Info
output "environment_info" {
  description = "Environment configuration summary"
  value = {
    environment = var.environment
    region      = var.aws_region
    domain      = var.domain_name
    project     = var.project_name
  }
}