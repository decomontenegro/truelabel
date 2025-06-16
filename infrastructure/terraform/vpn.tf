# VPN Configuration for Administrative Access

# Client VPN Endpoint
resource "aws_ec2_client_vpn_endpoint" "admin" {
  description            = "${var.project_name}-admin-vpn-${var.environment}"
  server_certificate_arn = aws_acm_certificate.vpn_server.arn
  client_cidr_block      = "10.100.0.0/16"
  split_tunnel           = true
  dns_servers            = ["10.0.0.2"]
  
  authentication_options {
    type                       = "certificate-authentication"
    root_certificate_chain_arn = aws_acm_certificate.vpn_ca.arn
  }
  
  connection_log_options {
    enabled               = true
    cloudwatch_log_group  = aws_cloudwatch_log_group.vpn.name
    cloudwatch_log_stream = aws_cloudwatch_log_stream.vpn.name
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-admin-vpn-${var.environment}"
  })
}

# VPN Network Association
resource "aws_ec2_client_vpn_network_association" "vpn" {
  count                  = length(aws_subnet.private)
  client_vpn_endpoint_id = aws_ec2_client_vpn_endpoint.admin.id
  subnet_id              = aws_subnet.private[count.index].id
}

# VPN Authorization Rules
resource "aws_ec2_client_vpn_authorization_rule" "all" {
  client_vpn_endpoint_id = aws_ec2_client_vpn_endpoint.admin.id
  target_network_cidr    = aws_vpc.main.cidr_block
  authorize_all_groups   = false
  access_group_id        = aws_iam_group.vpn_users.id
  description            = "Allow VPN users to access VPC"
}

resource "aws_ec2_client_vpn_authorization_rule" "admin_only" {
  for_each = toset([
    aws_subnet.private[0].cidr_block, # RDS subnet
    aws_subnet.private[1].cidr_block  # Redis subnet
  ])
  
  client_vpn_endpoint_id = aws_ec2_client_vpn_endpoint.admin.id
  target_network_cidr    = each.value
  access_group_id        = aws_iam_group.vpn_admins.id
  description            = "Admin access to sensitive resources"
}

# VPN Route
resource "aws_ec2_client_vpn_route" "vpn" {
  count                  = length(aws_subnet.private)
  client_vpn_endpoint_id = aws_ec2_client_vpn_endpoint.admin.id
  destination_cidr_block = "0.0.0.0/0"
  target_vpc_subnet_id   = aws_ec2_client_vpn_network_association.vpn[count.index].subnet_id
  description            = "Internet access through VPN"
}

# CloudWatch Log Group for VPN
resource "aws_cloudwatch_log_group" "vpn" {
  name              = "/aws/vpn/${var.project_name}-${var.environment}"
  retention_in_days = 30
  
  tags = local.common_tags
}

resource "aws_cloudwatch_log_stream" "vpn" {
  name           = "connection-log"
  log_group_name = aws_cloudwatch_log_group.vpn.name
}

# IAM Groups for VPN Access
resource "aws_iam_group" "vpn_users" {
  name = "${var.project_name}-vpn-users-${var.environment}"
  path = "/vpn/"
}

resource "aws_iam_group" "vpn_admins" {
  name = "${var.project_name}-vpn-admins-${var.environment}"
  path = "/vpn/"
}

# IAM Policy for VPN Users
resource "aws_iam_group_policy" "vpn_users" {
  name  = "${var.project_name}-vpn-users-policy-${var.environment}"
  group = aws_iam_group.vpn_users.name
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeClientVpnConnections",
          "ec2:DescribeClientVpnEndpoints"
        ]
        Resource = "*"
      }
    ]
  })
}

# Self-Signed Certificate for VPN (Production should use proper CA)
resource "tls_private_key" "vpn_ca" {
  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "tls_self_signed_cert" "vpn_ca" {
  private_key_pem = tls_private_key.vpn_ca.private_key_pem
  
  subject {
    common_name  = "${var.project_name} VPN CA"
    organization = var.project_name
  }
  
  validity_period_hours = 8760 # 1 year
  is_ca_certificate     = true
  
  allowed_uses = [
    "cert_signing",
    "key_encipherment",
    "digital_signature",
  ]
}

resource "aws_acm_certificate" "vpn_ca" {
  private_key      = tls_private_key.vpn_ca.private_key_pem
  certificate_body = tls_self_signed_cert.vpn_ca.cert_pem
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-vpn-ca-${var.environment}"
  })
}

# Server Certificate
resource "tls_private_key" "vpn_server" {
  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "tls_cert_request" "vpn_server" {
  private_key_pem = tls_private_key.vpn_server.private_key_pem
  
  subject {
    common_name  = "vpn.${var.domain_name}"
    organization = var.project_name
  }
  
  dns_names = ["vpn.${var.domain_name}"]
}

resource "tls_locally_signed_cert" "vpn_server" {
  cert_request_pem   = tls_cert_request.vpn_server.cert_request_pem
  ca_private_key_pem = tls_private_key.vpn_ca.private_key_pem
  ca_cert_pem        = tls_self_signed_cert.vpn_ca.cert_pem
  
  validity_period_hours = 8760
  
  allowed_uses = [
    "key_encipherment",
    "digital_signature",
    "server_auth",
  ]
}

resource "aws_acm_certificate" "vpn_server" {
  private_key       = tls_private_key.vpn_server.private_key_pem
  certificate_body  = tls_locally_signed_cert.vpn_server.cert_pem
  certificate_chain = tls_self_signed_cert.vpn_ca.cert_pem
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-vpn-server-${var.environment}"
  })
}

# Security Group for VPN Connections
resource "aws_security_group" "vpn" {
  name_prefix = "${var.project_name}-vpn-"
  description = "Security group for VPN connections"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    description = "Allow VPN traffic"
    from_port   = 443
    to_port     = 443
    protocol    = "udp"
    cidr_blocks = var.allowed_ips
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-vpn-sg-${var.environment}"
  })
}

# Alternative: WireGuard VPN on EC2
resource "aws_instance" "wireguard" {
  count                  = var.use_wireguard ? 1 : 0
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.micro"
  key_name              = aws_key_pair.bastion.key_name
  vpc_security_group_ids = [aws_security_group.wireguard[0].id]
  subnet_id             = aws_subnet.public[0].id
  
  user_data = base64encode(templatefile("${path.module}/templates/wireguard-setup.sh", {
    vpn_port     = 51820
    vpn_cidr     = "10.200.0.0/24"
    dns_servers  = "10.0.0.2"
    allowed_ips  = var.allowed_ips
    domain_name  = var.domain_name
  }))
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-wireguard-${var.environment}"
  })
}

# Security Group for WireGuard
resource "aws_security_group" "wireguard" {
  count       = var.use_wireguard ? 1 : 0
  name_prefix = "${var.project_name}-wireguard-"
  description = "Security group for WireGuard VPN"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    description = "WireGuard VPN"
    from_port   = 51820
    to_port     = 51820
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    description = "SSH from allowed IPs"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ips
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-wireguard-sg-${var.environment}"
  })
}

# Elastic IP for WireGuard
resource "aws_eip" "wireguard" {
  count    = var.use_wireguard ? 1 : 0
  instance = aws_instance.wireguard[0].id
  domain   = "vpc"
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-wireguard-eip-${var.environment}"
  })
}

# Data source for Ubuntu AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical
  
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
  
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Outputs
output "vpn_endpoint_id" {
  value       = aws_ec2_client_vpn_endpoint.admin.id
  description = "Client VPN endpoint ID"
}

output "vpn_dns_name" {
  value       = aws_ec2_client_vpn_endpoint.admin.dns_name
  description = "VPN endpoint DNS name"
}

output "wireguard_ip" {
  value       = var.use_wireguard ? aws_eip.wireguard[0].public_ip : null
  description = "WireGuard VPN public IP"
}

# Variable for VPN choice
variable "use_wireguard" {
  description = "Use WireGuard instead of AWS Client VPN"
  type        = bool
  default     = false
}