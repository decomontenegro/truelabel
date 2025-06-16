# True Label Infrastructure - Main Configuration

terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
  
  backend "s3" {
    bucket = "truelabel-terraform-state"
    key    = "production/terraform.tfstate"
    region = "sa-east-1"
    encrypt = true
    dynamodb_table = "truelabel-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment = var.environment
      Project     = "TrueLabel"
      ManagedBy   = "Terraform"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

# Local variables
locals {
  common_tags = {
    Environment = var.environment
    Project     = "TrueLabel"
    CreatedAt   = timestamp()
  }
  
  azs = slice(data.aws_availability_zones.available.names, 0, 3)
}