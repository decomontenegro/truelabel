# Bastion Host Configuration

# Bastion Host Key Pair
resource "aws_key_pair" "bastion" {
  key_name   = "${var.project_name}-bastion-${var.environment}"
  public_key = file("~/.ssh/id_rsa.pub") # Update this path or use a variable
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-bastion-key-${var.environment}"
  })
}

# Bastion Host Instance
resource "aws_instance" "bastion" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = "t3.micro"
  key_name              = aws_key_pair.bastion.key_name
  vpc_security_group_ids = [aws_security_group.bastion.id]
  subnet_id             = aws_subnet.public[0].id
  
  user_data = base64encode(templatefile("${path.module}/templates/bastion-userdata.sh", {
    project_name = var.project_name
    environment  = var.environment
  }))
  
  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
  }
  
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-bastion-${var.environment}"
  })
}

# Elastic IP for Bastion
resource "aws_eip" "bastion" {
  instance = aws_instance.bastion.id
  domain   = "vpc"
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-bastion-eip-${var.environment}"
  })
}

# Data source for latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]
  
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
  
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Session Manager Configuration
resource "aws_iam_role" "bastion_ssm" {
  name = "${var.project_name}-bastion-ssm-${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "bastion_ssm" {
  role       = aws_iam_role.bastion_ssm.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "bastion" {
  name = "${var.project_name}-bastion-profile-${var.environment}"
  role = aws_iam_role.bastion_ssm.name
}

# CloudWatch Alarm for Bastion
resource "aws_cloudwatch_metric_alarm" "bastion_cpu" {
  alarm_name          = "${var.project_name}-bastion-cpu-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors Bastion CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    InstanceId = aws_instance.bastion.id
  }
  
  tags = local.common_tags
}