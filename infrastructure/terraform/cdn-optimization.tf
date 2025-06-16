# CDN Optimization and Advanced Configuration

# CloudFront Response Headers Policy
resource "aws_cloudfront_response_headers_policy" "security_headers" {
  name = "${var.project_name}-security-headers-${var.environment}"
  
  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = 63072000
      include_subdomains         = true
      preload                    = true
      override                   = true
    }
    
    content_type_options {
      override = true
    }
    
    frame_options {
      frame_option = "DENY"
      override     = true
    }
    
    xss_protection {
      mode_block = true
      protection = true
      override   = true
    }
    
    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
    
    content_security_policy {
      content_security_policy = "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.${var.domain_name} wss://api.${var.domain_name}; frame-ancestors 'none';"
      override = true
    }
  }
  
  cors_config {
    access_control_allow_credentials = false
    
    access_control_allow_headers {
      items = ["*"]
    }
    
    access_control_allow_methods {
      items = ["GET", "HEAD", "PUT", "POST", "PATCH", "DELETE", "OPTIONS"]
    }
    
    access_control_allow_origins {
      items = ["https://${var.domain_name}", "https://www.${var.domain_name}"]
    }
    
    access_control_max_age_sec = 86400
    origin_override            = true
  }
  
  custom_headers_config {
    items {
      header   = "X-Frame-Options"
      value    = "DENY"
      override = true
    }
    
    items {
      header   = "X-Content-Type-Options"
      value    = "nosniff"
      override = true
    }
    
    items {
      header   = "Permissions-Policy"
      value    = "geolocation=(), microphone=(), camera=()"
      override = true
    }
  }
}

# CloudFront Cache Policy for Static Assets
resource "aws_cloudfront_cache_policy" "static_assets" {
  name = "${var.project_name}-static-cache-${var.environment}"
  
  default_ttl = 86400    # 1 day
  max_ttl     = 31536000 # 1 year
  min_ttl     = 1
  
  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_gzip = true
    enable_accept_encoding_brotli = true
    
    headers_config {
      header_behavior = "none"
    }
    
    cookies_config {
      cookie_behavior = "none"
    }
    
    query_strings_config {
      query_string_behavior = "none"
    }
  }
}

# CloudFront Cache Policy for API
resource "aws_cloudfront_cache_policy" "api" {
  name = "${var.project_name}-api-cache-${var.environment}"
  
  default_ttl = 0
  max_ttl     = 0
  min_ttl     = 0
  
  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_gzip = true
    enable_accept_encoding_brotli = true
    
    headers_config {
      header_behavior = "whitelist"
      headers {
        items = ["Authorization", "Content-Type", "Accept", "X-Requested-With"]
      }
    }
    
    cookies_config {
      cookie_behavior = "all"
    }
    
    query_strings_config {
      query_string_behavior = "all"
    }
  }
}

# Origin Request Policy
resource "aws_cloudfront_origin_request_policy" "api" {
  name = "${var.project_name}-api-origin-${var.environment}"
  
  headers_config {
    header_behavior = "whitelist"
    headers {
      items = ["Accept", "Accept-Language", "Content-Type", "User-Agent", "X-Forwarded-For"]
    }
  }
  
  cookies_config {
    cookie_behavior = "all"
  }
  
  query_strings_config {
    query_string_behavior = "all"
  }
}

# Update CloudFront Distribution with optimized behaviors
resource "aws_cloudfront_distribution" "optimized" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name} CDN Optimized - ${var.environment}"
  default_root_object = "index.html"
  price_class         = "PriceClass_All"
  http_version        = "http2and3"
  
  aliases = [var.domain_name, "www.${var.domain_name}"]
  
  # S3 Origin for Static Assets
  origin {
    domain_name = aws_s3_bucket.static_assets.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.static_assets.id}"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
    
    origin_shield {
      enabled              = true
      origin_shield_region = var.aws_region
    }
  }
  
  # ALB Origin for API with Connection Settings
  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "ALB-${aws_lb.main.id}"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
      
      origin_keepalive_timeout = 60
      origin_read_timeout      = 60
      origin_connect_timeout   = 10
    }
    
    custom_header {
      name  = "X-CloudFront-Secret"
      value = random_password.cloudfront_secret.result
    }
  }
  
  # Default Cache Behavior (Static Assets) with Compression
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "S3-${aws_s3_bucket.static_assets.id}"
    
    cache_policy_id            = aws_cloudfront_cache_policy.static_assets.id
    origin_request_policy_id   = data.aws_cloudfront_origin_request_policy.cors_s3.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
    
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    
    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.url_rewrite.arn
    }
  }
  
  # Optimized behaviors for different asset types
  ordered_cache_behavior {
    path_pattern     = "*.js"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.static_assets.id}"
    
    cache_policy_id            = aws_cloudfront_cache_policy.static_assets.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
    
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }
  
  ordered_cache_behavior {
    path_pattern     = "*.css"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.static_assets.id}"
    
    cache_policy_id            = aws_cloudfront_cache_policy.static_assets.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
    
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }
  
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "ALB-${aws_lb.main.id}"
    
    cache_policy_id            = aws_cloudfront_cache_policy.api.id
    origin_request_policy_id   = aws_cloudfront_origin_request_policy.api.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
    
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }
  
  # Custom Error Pages with Caching
  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }
  
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }
  
  custom_error_response {
    error_code            = 500
    error_caching_min_ttl = 0
  }
  
  custom_error_response {
    error_code            = 502
    error_caching_min_ttl = 0
  }
  
  custom_error_response {
    error_code            = 503
    error_caching_min_ttl = 0
  }
  
  custom_error_response {
    error_code            = 504
    error_caching_min_ttl = 0
  }
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cloudfront.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
  
  web_acl_id = var.enable_waf ? aws_wafv2_web_acl.cloudfront[0].arn : null
  
  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.cloudfront_logs.bucket_domain_name
    prefix          = "cloudfront/"
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-cloudfront-optimized-${var.environment}"
  })
  
  depends_on = [aws_acm_certificate_validation.cloudfront]
}

# CloudFront Function for URL rewriting
resource "aws_cloudfront_function" "url_rewrite" {
  name    = "${var.project_name}-url-rewrite-${var.environment}"
  runtime = "cloudfront-js-1.0"
  publish = true
  
  code = <<EOF
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    
    // Check if URI is a file
    if (!uri.includes('.')) {
        // For React Router - redirect all non-file requests to index.html
        request.uri = '/index.html';
    }
    
    // Add cache busting for specific paths
    if (uri.startsWith('/assets/') && !uri.includes('?v=')) {
        request.querystring = 'v=${timestamp()}';
    }
    
    return request;
}
EOF
}

# Cloudflare Configuration
resource "cloudflare_zone_settings_override" "truelabel" {
  zone_id = var.cloudflare_zone_id
  
  settings {
    # Security
    security_level       = "high"
    challenge_ttl        = 1800
    security_header {
      enabled            = true
      include_subdomains = true
      max_age            = 31536000
      nosniff            = true
      preload            = true
    }
    
    # Performance
    brotli                  = "on"
    minify {
      css  = "on"
      html = "on"
      js   = "on"
    }
    rocket_loader           = "on"
    automatic_https_rewrites = "on"
    http2                   = "on"
    http3                   = "on"
    zero_rtt                = "on"
    
    # Caching
    browser_cache_ttl       = 14400
    cache_level             = "aggressive"
    development_mode        = "off"
    
    # Network
    ipv6                    = "on"
    websockets              = "on"
    opportunistic_encryption = "on"
    opportunistic_onion     = "on"
    
    # SSL/TLS
    ssl                     = "strict"
    min_tls_version         = "1.2"
    tls_1_3                 = "on"
    automatic_https_rewrites = "on"
    always_use_https        = "on"
  }
}

# Cloudflare Rate Limiting Rules
resource "cloudflare_rate_limit" "api_limit" {
  zone_id = var.cloudflare_zone_id
  
  threshold = 100
  period    = 60
  
  match {
    request {
      url_pattern = "${var.domain_name}/api/*"
    }
  }
  
  action {
    mode    = "challenge"
    timeout = 600
  }
  
  correlate {
    by = "nat"
  }
  
  disabled = false
}

resource "cloudflare_rate_limit" "auth_limit" {
  zone_id = var.cloudflare_zone_id
  
  threshold = 5
  period    = 300
  
  match {
    request {
      url_pattern = "${var.domain_name}/api/v1/auth/*"
    }
  }
  
  action {
    mode    = "ban"
    timeout = 3600
  }
  
  disabled = false
}

# Cloudflare Workers for Edge Computing (Optional)
resource "cloudflare_worker_script" "edge_cache" {
  name    = "${var.project_name}-edge-cache"
  content = file("${path.module}/workers/edge-cache.js")
}

resource "cloudflare_worker_route" "api_cache" {
  zone_id     = var.cloudflare_zone_id
  pattern     = "${var.domain_name}/api/v1/public/*"
  script_name = cloudflare_worker_script.edge_cache.name
}

# Data source for AWS managed origin request policy
data "aws_cloudfront_origin_request_policy" "cors_s3" {
  name = "Managed-CORS-S3Origin"
}