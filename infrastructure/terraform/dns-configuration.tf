# DNS Configuration for Multi-Provider Setup

# Route53 Hosted Zone (Optional - for advanced features)
resource "aws_route53_zone" "main" {
  count = var.use_route53 ? 1 : 0
  name  = var.domain_name
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-zone-${var.environment}"
  })
}

# Primary DNS Records in Cloudflare
resource "cloudflare_record" "root" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  value   = aws_cloudfront_distribution.main.domain_name
  type    = "CNAME"
  ttl     = 1
  proxied = true
  
  comment = "Main domain - ${var.environment}"
}

resource "cloudflare_record" "www" {
  zone_id = var.cloudflare_zone_id
  name    = "www"
  value   = aws_cloudfront_distribution.main.domain_name
  type    = "CNAME"
  ttl     = 1
  proxied = true
  
  comment = "WWW subdomain - ${var.environment}"
}

resource "cloudflare_record" "api" {
  zone_id = var.cloudflare_zone_id
  name    = "api"
  value   = aws_lb.main.dns_name
  type    = "CNAME"
  ttl     = 1
  proxied = true
  
  comment = "API endpoint - ${var.environment}"
}

# Email Records
resource "cloudflare_record" "mx" {
  zone_id  = var.cloudflare_zone_id
  name     = "@"
  value    = "mail.${var.domain_name}"
  type     = "MX"
  ttl      = 3600
  priority = 10
  
  comment = "Email server"
}

resource "cloudflare_record" "spf" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  value   = "v=spf1 include:_spf.google.com include:amazonses.com ~all"
  type    = "TXT"
  ttl     = 3600
  
  comment = "SPF record for email authentication"
}

resource "cloudflare_record" "dmarc" {
  zone_id = var.cloudflare_zone_id
  name    = "_dmarc"
  value   = "v=DMARC1; p=quarantine; rua=mailto:dmarc@${var.domain_name}; ruf=mailto:dmarc@${var.domain_name}; fo=1"
  type    = "TXT"
  ttl     = 3600
  
  comment = "DMARC policy"
}

# SES Domain Verification
resource "aws_ses_domain_identity" "main" {
  domain = var.domain_name
}

resource "cloudflare_record" "ses_verification" {
  zone_id = var.cloudflare_zone_id
  name    = "_amazonses"
  value   = aws_ses_domain_identity.main.verification_token
  type    = "TXT"
  ttl     = 600
  
  comment = "AWS SES verification"
}

resource "aws_ses_domain_dkim" "main" {
  domain = aws_ses_domain_identity.main.domain
}

resource "cloudflare_record" "dkim" {
  count   = 3
  zone_id = var.cloudflare_zone_id
  name    = "${element(aws_ses_domain_dkim.main.dkim_tokens, count.index)}._domainkey"
  value   = "${element(aws_ses_domain_dkim.main.dkim_tokens, count.index)}.dkim.amazonses.com"
  type    = "CNAME"
  ttl     = 600
  
  comment = "AWS SES DKIM ${count.index + 1}"
}

# Environment-specific subdomains
resource "cloudflare_record" "staging" {
  count   = var.environment == "production" ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = "staging"
  value   = "staging.${var.domain_name}.s3-website-${var.aws_region}.amazonaws.com"
  type    = "CNAME"
  ttl     = 1
  proxied = true
  
  comment = "Staging environment"
}

resource "cloudflare_record" "dev" {
  count   = var.environment == "production" ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = "dev"
  value   = "dev.${var.domain_name}.s3-website-${var.aws_region}.amazonaws.com"
  type    = "CNAME"
  ttl     = 1
  proxied = true
  
  comment = "Development environment"
}

# Monitoring subdomain
resource "cloudflare_record" "monitoring" {
  zone_id = var.cloudflare_zone_id
  name    = "status"
  value   = "stats.uptimerobot.com"
  type    = "CNAME"
  ttl     = 1
  proxied = false
  
  comment = "Status page"
}

# CAA Records for SSL Certificate Authority Authorization
resource "cloudflare_record" "caa_letsencrypt" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  type    = "CAA"
  ttl     = 3600
  
  data {
    flags = "0"
    tag   = "issue"
    value = "letsencrypt.org"
  }
  
  comment = "Allow Let's Encrypt certificates"
}

resource "cloudflare_record" "caa_amazon" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  type    = "CAA"
  ttl     = 3600
  
  data {
    flags = "0"
    tag   = "issue"
    value = "amazon.com"
  }
  
  comment = "Allow Amazon certificates"
}

resource "cloudflare_record" "caa_digicert" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  type    = "CAA"
  ttl     = 3600
  
  data {
    flags = "0"
    tag   = "issue"
    value = "digicert.com"
  }
  
  comment = "Allow DigiCert certificates"
}

# Cloudflare SSL/TLS Configuration
resource "cloudflare_certificate_pack" "advanced" {
  zone_id = var.cloudflare_zone_id
  type    = "advanced"
  hosts = [
    var.domain_name,
    "*.${var.domain_name}"
  ]
  
  validation_method     = "txt"
  validity_days         = 365
  certificate_authority = "lets_encrypt"
}

# Custom SSL for specific subdomains
resource "cloudflare_custom_ssl" "api" {
  zone_id = var.cloudflare_zone_id
  
  custom_ssl_options {
    certificate = file("${path.module}/certs/api-cert.pem")
    private_key = file("${path.module}/certs/api-key.pem")
    bundle_method = "ubiquitous"
    type = "legacy_custom"
  }
}

# Origin CA Certificate for secure connection between Cloudflare and Origin
resource "cloudflare_origin_ca_certificate" "main" {
  csr                  = tls_cert_request.origin.cert_request_pem
  hostnames            = [var.domain_name, "*.${var.domain_name}"]
  request_type         = "origin-rsa"
  requested_validity   = 5475 # 15 years
}

resource "tls_private_key" "origin" {
  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "tls_cert_request" "origin" {
  private_key_pem = tls_private_key.origin.private_key_pem
  
  subject {
    common_name  = var.domain_name
    organization = var.project_name
  }
  
  dns_names = [var.domain_name, "*.${var.domain_name}"]
}

# Store Origin Certificate in ACM for ALB
resource "aws_acm_certificate" "origin" {
  private_key       = tls_private_key.origin.private_key_pem
  certificate_body  = cloudflare_origin_ca_certificate.main.certificate
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-origin-cert-${var.environment}"
  })
}

# Cloudflare Firewall Rules for Domain Protection
resource "cloudflare_firewall_rule" "block_bad_bots" {
  zone_id     = var.cloudflare_zone_id
  description = "Block known bad bots"
  expression  = "(cf.client.bot) and not (cf.verified_bot)"
  action      = "block"
}

resource "cloudflare_firewall_rule" "challenge_suspicious" {
  zone_id     = var.cloudflare_zone_id
  description = "Challenge suspicious requests"
  expression  = "(cf.threat_score > 20)"
  action      = "challenge"
}

# DNS Monitoring
resource "aws_route53_health_check" "domain" {
  fqdn              = var.domain_name
  port              = 443
  type              = "HTTPS"
  resource_path     = "/"
  failure_threshold = "3"
  request_interval  = "30"
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-domain-health-${var.environment}"
  })
}

# Outputs for DNS Configuration
output "dns_configuration" {
  description = "DNS configuration instructions"
  value = {
    cloudflare_nameservers = [
      "ns1.cloudflare.com",
      "ns2.cloudflare.com"
    ]
    records_created = {
      root = cloudflare_record.root.hostname
      www  = cloudflare_record.www.hostname
      api  = cloudflare_record.api.hostname
    }
    ssl_configuration = {
      mode = "Full (Strict)"
      min_tls_version = "1.2"
      origin_certificate = cloudflare_origin_ca_certificate.main.id
    }
  }
}