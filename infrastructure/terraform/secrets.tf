# Secrets Manager Configuration

# JWT Secret
resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name = "${var.project_name}-jwt-secret-${var.environment}"
  
  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = random_password.jwt_secret.result
}

# API Keys
resource "aws_secretsmanager_secret" "api_keys" {
  name = "${var.project_name}-api-keys-${var.environment}"
  
  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "api_keys" {
  secret_id = aws_secretsmanager_secret.api_keys.id
  secret_string = jsonencode({
    sendgrid_api_key = "your-sendgrid-api-key"
    slack_webhook_url = "your-slack-webhook-url"
    sentry_dsn = "your-sentry-dsn"
    google_maps_api_key = "your-google-maps-api-key"
  })
}

# Email Configuration
resource "aws_secretsmanager_secret" "email_config" {
  name = "${var.project_name}-email-config-${var.environment}"
  
  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "email_config" {
  secret_id = aws_secretsmanager_secret.email_config.id
  secret_string = jsonencode({
    from_email = "noreply@${var.domain_name}"
    from_name = "True Label"
    smtp_host = "email-smtp.${var.aws_region}.amazonaws.com"
    smtp_port = 587
    smtp_user = aws_iam_access_key.ses_user.id
    smtp_pass = aws_iam_access_key.ses_user.ses_smtp_password_v4
  })
}

# SES User for SMTP
resource "aws_iam_user" "ses_user" {
  name = "${var.project_name}-ses-user-${var.environment}"
  
  tags = local.common_tags
}

resource "aws_iam_access_key" "ses_user" {
  user = aws_iam_user.ses_user.name
}

resource "aws_iam_user_policy" "ses_user_policy" {
  name = "${var.project_name}-ses-policy-${var.environment}"
  user = aws_iam_user.ses_user.name
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      }
    ]
  })
}

# Secrets Rotation Lambda Function
resource "aws_iam_role" "secrets_rotation" {
  name = "${var.project_name}-secrets-rotation-${var.environment}"
  
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
  
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "secrets_rotation_basic" {
  role       = aws_iam_role.secrets_rotation.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "secrets_rotation_policy" {
  name = "${var.project_name}-secrets-rotation-policy-${var.environment}"
  role = aws_iam_role.secrets_rotation.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetSecretValue",
          "secretsmanager:PutSecretValue",
          "secretsmanager:UpdateSecretVersionStage"
        ]
        Resource = [
          aws_secretsmanager_secret.db_password.arn,
          aws_secretsmanager_secret.jwt_secret.arn,
          aws_secretsmanager_secret.redis_password.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetRandomPassword"
        ]
        Resource = "*"
      }
    ]
  })
}