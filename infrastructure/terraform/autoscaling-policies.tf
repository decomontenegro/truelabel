# Advanced Auto Scaling Policies

# Target Tracking - Request Count
resource "aws_appautoscaling_policy" "ecs_request_count" {
  name               = "${var.project_name}-ecs-request-scaling-${var.environment}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace
  
  target_tracking_scaling_policy_configuration {
    target_value = 1000.0
    
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label = "${aws_lb.main.arn_suffix}/${aws_lb_target_group.api.arn_suffix}"
    }
    
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Step Scaling - Response Time Based
resource "aws_cloudwatch_metric_alarm" "response_time_high" {
  alarm_name          = "${var.project_name}-response-time-high-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "0.5"
  alarm_description   = "Triggers when response time is high"
  
  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
    TargetGroup  = aws_lb_target_group.api.arn_suffix
  }
}

resource "aws_appautoscaling_policy" "ecs_step_scaling_up" {
  name               = "${var.project_name}-ecs-step-scaling-up-${var.environment}"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace
  
  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown               = 60
    metric_aggregation_type = "Average"
    
    step_adjustment {
      metric_interval_lower_bound = 0
      metric_interval_upper_bound = 10
      scaling_adjustment          = 1
    }
    
    step_adjustment {
      metric_interval_lower_bound = 10
      metric_interval_upper_bound = 20
      scaling_adjustment          = 2
    }
    
    step_adjustment {
      metric_interval_lower_bound = 20
      scaling_adjustment          = 3
    }
  }
  
  depends_on = [aws_appautoscaling_target.ecs]
}

# Scheduled Scaling - Business Hours
resource "aws_appautoscaling_scheduled_action" "scale_up_business_hours" {
  name               = "${var.project_name}-scale-up-business-${var.environment}"
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  schedule           = "cron(0 7 ? * MON-FRI *)" # 7 AM Mon-Fri
  timezone           = "America/Sao_Paulo"
  
  scalable_target_action {
    min_capacity = 3
    max_capacity = 15
  }
}

resource "aws_appautoscaling_scheduled_action" "scale_down_night" {
  name               = "${var.project_name}-scale-down-night-${var.environment}"
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  schedule           = "cron(0 22 ? * * *)" # 10 PM every day
  timezone           = "America/Sao_Paulo"
  
  scalable_target_action {
    min_capacity = 1
    max_capacity = 5
  }
}

# RDS Read Replica Auto Scaling (Aurora would be better for this)
resource "aws_cloudwatch_metric_alarm" "rds_read_replica_lag" {
  count               = var.environment == "production" ? 1 : 0
  alarm_name          = "${var.project_name}-rds-replica-lag-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ReplicaLag"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Average"
  threshold           = "1000" # 1 second
  alarm_description   = "Read replica lag is too high"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.read_replica[0].identifier
  }
}

# Custom Metrics for Business Logic Scaling
resource "aws_cloudwatch_log_metric_filter" "api_queue_depth" {
  name           = "${var.project_name}-queue-depth"
  log_group_name = aws_cloudwatch_log_group.ecs.name
  pattern        = "[timestamp, request_id, queue_depth > 50]"
  
  metric_transformation {
    name      = "QueueDepth"
    namespace = "${var.project_name}/API"
    value     = "$queue_depth"
  }
}

resource "aws_cloudwatch_metric_alarm" "queue_depth_high" {
  alarm_name          = "${var.project_name}-queue-depth-high-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "QueueDepth"
  namespace           = "${var.project_name}/API"
  period              = "60"
  statistic           = "Average"
  threshold           = "100"
  alarm_description   = "Queue depth is high, scale up workers"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"
}

# Predictive Scaling Configuration (using CloudWatch Insights)
resource "aws_cloudwatch_event_rule" "predictive_scaling" {
  name                = "${var.project_name}-predictive-scaling-${var.environment}"
  description         = "Trigger predictive scaling analysis"
  schedule_expression = "rate(1 hour)"
}

resource "aws_cloudwatch_event_target" "predictive_scaling_lambda" {
  rule      = aws_cloudwatch_event_rule.predictive_scaling.name
  target_id = "PredictiveScalingLambda"
  arn       = aws_lambda_function.predictive_scaling.arn
}

# Lambda for Predictive Scaling
resource "aws_lambda_function" "predictive_scaling" {
  filename         = "${path.module}/lambda/predictive-scaling.zip"
  function_name    = "${var.project_name}-predictive-scaling-${var.environment}"
  role            = aws_iam_role.predictive_scaling_lambda.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 60
  memory_size     = 256
  
  environment {
    variables = {
      ECS_CLUSTER_NAME = aws_ecs_cluster.main.name
      ECS_SERVICE_NAME = aws_ecs_service.api.name
      LOOKBACK_HOURS   = "168" # 1 week
      FORECAST_HOURS   = "24"
    }
  }
  
  tags = local.common_tags
}

resource "aws_iam_role" "predictive_scaling_lambda" {
  name = "${var.project_name}-predictive-scaling-lambda-${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "predictive_scaling_lambda" {
  name = "${var.project_name}-predictive-scaling-policy-${var.environment}"
  role = aws_iam_role.predictive_scaling_lambda.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:GetMetricData",
          "ecs:DescribeServices",
          "ecs:UpdateService",
          "application-autoscaling:PutScalingPolicy",
          "application-autoscaling:RegisterScalableTarget"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# Multi-Region Load Balancing (Active-Passive)
resource "aws_route53_health_check" "primary_alb" {
  count             = var.enable_multi_region ? 1 : 0
  fqdn              = aws_lb.main.dns_name
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = "3"
  request_interval  = "30"
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-primary-health-check-${var.environment}"
  })
}

# Capacity Provider for Spot Instances (Cost Optimization)
resource "aws_ecs_capacity_provider" "spot" {
  count = var.enable_spot_instances ? 1 : 0
  name  = "${var.project_name}-spot-${var.environment}"
  
  auto_scaling_group_provider {
    auto_scaling_group_arn = aws_autoscaling_group.ecs_spot[0].arn
    
    managed_scaling {
      maximum_scaling_step_size = 10
      minimum_scaling_step_size = 1
      status                    = "ENABLED"
      target_capacity           = 90
    }
    
    managed_termination_protection = "ENABLED"
  }
  
  tags = local.common_tags
}

# Blue/Green Deployment Configuration
resource "aws_codedeploy_deployment_group" "ecs" {
  app_name               = aws_codedeploy_app.main.name
  deployment_group_name  = "${var.project_name}-ecs-${var.environment}"
  service_role_arn      = aws_iam_role.codedeploy.arn
  deployment_config_name = "CodeDeployDefault.ECSAllAtOnceBlueGreen"
  
  blue_green_deployment_config {
    terminate_blue_instances_on_deployment_success {
      action                                          = "TERMINATE"
      termination_wait_time_in_minutes               = 5
    }
    
    deployment_ready_option {
      action_on_timeout = "CONTINUE_DEPLOYMENT"
    }
    
    green_fleet_provisioning_option {
      action = "COPY_AUTO_SCALING_GROUP"
    }
  }
  
  load_balancer_info {
    target_group_pair_info {
      prod_traffic_route {
        listener_arns = [aws_lb_listener.https.arn]
      }
      
      test_traffic_route {
        listener_arns = [aws_lb_listener.test[0].arn]
      }
      
      target_group {
        name = aws_lb_target_group.api.name
      }
      
      target_group {
        name = aws_lb_target_group.api_canary[0].name
      }
    }
  }
  
  ecs_service {
    cluster_name = aws_ecs_cluster.main.name
    service_name = aws_ecs_service.api.name
  }
}

resource "aws_codedeploy_app" "main" {
  compute_platform = "ECS"
  name            = "${var.project_name}-${var.environment}"
}