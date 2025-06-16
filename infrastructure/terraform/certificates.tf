# ACM Certificates Configuration

# Main Certificate
resource "aws_acm_certificate" "main" {
  domain_name       = var.domain_name
  validation_method = "DNS"
  
  subject_alternative_names = [
    "*.${var.domain_name}",
    "api.${var.domain_name}",
    "www.${var.domain_name}"
  ]
  
  lifecycle {
    create_before_destroy = true
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-certificate-${var.environment}"
  })
}

# Certificate Validation
resource "aws_acm_certificate_validation" "main" {
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for record in cloudflare_record.cert_validation : record.hostname]
  
  depends_on = [cloudflare_record.cert_validation]
}

# Cloudflare DNS Records for Certificate Validation
resource "cloudflare_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }
  
  zone_id = var.cloudflare_zone_id
  name    = each.value.name
  value   = trimsuffix(each.value.record, ".")
  type    = each.value.type
  ttl     = 60
  proxied = false
}

# Additional Domain Certificates (if any)
variable "additional_domains" {
  description = "Additional domains for certificates"
  type        = list(string)
  default     = []
}

resource "aws_acm_certificate" "additional" {
  count = length(var.additional_domains)
  
  domain_name       = var.additional_domains[count.index]
  validation_method = "DNS"
  
  lifecycle {
    create_before_destroy = true
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-certificate-${var.additional_domains[count.index]}-${var.environment}"
  })
}

resource "aws_acm_certificate_validation" "additional" {
  count = length(var.additional_domains)
  
  certificate_arn = aws_acm_certificate.additional[count.index].arn
}

# CloudFront Certificate (must be in us-east-1)
resource "aws_acm_certificate" "cloudfront" {
  provider = aws.us_east_1
  
  domain_name       = var.domain_name
  validation_method = "DNS"
  
  subject_alternative_names = [
    "*.${var.domain_name}",
    "cdn.${var.domain_name}",
    "assets.${var.domain_name}"
  ]
  
  lifecycle {
    create_before_destroy = true
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-cloudfront-certificate-${var.environment}"
  })
}

# Provider for us-east-1 (required for CloudFront certificates)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
  
  default_tags {
    tags = {
      Environment = var.environment
      Project     = "TrueLabel"
      ManagedBy   = "Terraform"
    }
  }
}

# Certificate Validation for CloudFront
resource "aws_acm_certificate_validation" "cloudfront" {
  provider = aws.us_east_1
  
  certificate_arn = aws_acm_certificate.cloudfront.arn
}