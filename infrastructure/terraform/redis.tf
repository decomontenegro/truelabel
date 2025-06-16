# ElastiCache Redis Configuration

# Redis Subnet Group
resource "aws_elasticache_subnet_group" "redis" {
  name       = "${var.project_name}-redis-subnet-${var.environment}"
  subnet_ids = aws_subnet.private[*].id
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-redis-subnet-group-${var.environment}"
  })
}

# Redis Parameter Group
resource "aws_elasticache_parameter_group" "redis7" {
  name   = "${var.project_name}-redis7-${var.environment}"
  family = "redis7"
  
  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }
  
  parameter {
    name  = "timeout"
    value = "300"
  }
  
  parameter {
    name  = "tcp-keepalive"
    value = "60"
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-redis-params-${var.environment}"
  })
}

# Redis Password
resource "random_password" "redis_password" {
  length  = 32
  special = false # Redis doesn't support special characters in passwords
}

# Store Redis password in Secrets Manager
resource "aws_secretsmanager_secret" "redis_password" {
  name = "${var.project_name}-redis-password-${var.environment}"
  
  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "redis_password" {
  secret_id     = aws_secretsmanager_secret.redis_password.id
  secret_string = random_password.redis_password.result
}

# Redis Replication Group (Cluster Mode Disabled)
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${var.project_name}-redis-${var.environment}"
  replication_group_description = "Redis cluster for ${var.project_name} ${var.environment}"
  
  engine               = "redis"
  engine_version       = "7.0"
  node_type           = var.redis_node_type
  num_cache_clusters  = var.redis_num_cache_nodes
  port                = 6379
  
  subnet_group_name = aws_elasticache_subnet_group.redis.name
  security_group_ids = [aws_security_group.redis.id]
  
  parameter_group_name = aws_elasticache_parameter_group.redis7.name
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                = random_password.redis_password.result
  
  automatic_failover_enabled = var.redis_num_cache_nodes > 1 ? true : false
  multi_az_enabled          = var.redis_num_cache_nodes > 1 ? true : false
  
  snapshot_retention_limit = 5
  snapshot_window         = "03:00-05:00"
  maintenance_window      = "sun:05:00-sun:07:00"
  
  notification_topic_arn = aws_sns_topic.alerts.arn
  
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_slow.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-redis-${var.environment}"
  })
}

# CloudWatch Log Group for Redis
resource "aws_cloudwatch_log_group" "redis_slow" {
  name              = "/aws/elasticache/redis/${var.project_name}-${var.environment}/slow-log"
  retention_in_days = 7
  
  tags = local.common_tags
}

# CloudWatch Alarms for Redis
resource "aws_cloudwatch_metric_alarm" "redis_cpu" {
  alarm_name          = "${var.project_name}-redis-cpu-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "This metric monitors Redis CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.redis.id
  }
  
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "redis_memory" {
  alarm_name          = "${var.project_name}-redis-memory-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors Redis memory usage"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.redis.id
  }
  
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "redis_evictions" {
  alarm_name          = "${var.project_name}-redis-evictions-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Evictions"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1000"
  alarm_description   = "This metric monitors Redis evictions"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.redis.id
  }
  
  tags = local.common_tags
}

# Outputs for Redis
output "redis_endpoint" {
  value = aws_elasticache_replication_group.redis.primary_endpoint_address
  description = "Redis primary endpoint"
}

output "redis_port" {
  value = aws_elasticache_replication_group.redis.port
  description = "Redis port"
}