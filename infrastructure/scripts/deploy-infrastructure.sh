#!/bin/bash
# Infrastructure Deployment Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
ENVIRONMENT=${1:-production}
ACTION=${2:-plan}
TERRAFORM_DIR="./infrastructure/terraform"

echo -e "${GREEN}True Label Infrastructure Deployment${NC}"
echo -e "${GREEN}=====================================NC}"
echo "Environment: ${ENVIRONMENT}"
echo "Action: ${ACTION}"
echo ""

# Check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..."
    
    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        echo -e "${RED}Error: Terraform is not installed${NC}"
        echo "Please install Terraform: https://www.terraform.io/downloads"
        exit 1
    fi
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}Error: AWS CLI is not installed${NC}"
        echo "Please install AWS CLI: https://aws.amazon.com/cli/"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}Error: AWS credentials not configured${NC}"
        echo "Please run: aws configure"
        exit 1
    fi
    
    # Check terraform.tfvars
    if [ ! -f "${TERRAFORM_DIR}/terraform.tfvars" ]; then
        echo -e "${RED}Error: terraform.tfvars not found${NC}"
        echo "Please copy terraform.tfvars.example to terraform.tfvars and update values"
        exit 1
    fi
    
    echo -e "${GREEN}✓ All prerequisites met${NC}"
}

# Initialize Terraform
init_terraform() {
    echo "Initializing Terraform..."
    cd ${TERRAFORM_DIR}
    
    # Create S3 bucket for state if it doesn't exist
    BUCKET_NAME="truelabel-terraform-state"
    REGION=$(grep 'aws_region' terraform.tfvars | cut -d'"' -f2)
    
    if ! aws s3 ls "s3://${BUCKET_NAME}" 2>&1 | grep -q 'NoSuchBucket'; then
        echo "State bucket already exists"
    else
        echo "Creating S3 bucket for Terraform state..."
        aws s3 mb "s3://${BUCKET_NAME}" --region ${REGION}
        aws s3api put-bucket-versioning \
            --bucket ${BUCKET_NAME} \
            --versioning-configuration Status=Enabled
        aws s3api put-bucket-encryption \
            --bucket ${BUCKET_NAME} \
            --server-side-encryption-configuration '{"Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]}'
    fi
    
    # Create DynamoDB table for state locking
    if ! aws dynamodb describe-table --table-name truelabel-terraform-locks &> /dev/null; then
        echo "Creating DynamoDB table for state locking..."
        aws dynamodb create-table \
            --table-name truelabel-terraform-locks \
            --attribute-definitions AttributeName=LockID,AttributeType=S \
            --key-schema AttributeName=LockID,KeyType=HASH \
            --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
            --region ${REGION}
    fi
    
    terraform init -upgrade
    echo -e "${GREEN}✓ Terraform initialized${NC}"
}

# Validate Terraform configuration
validate_terraform() {
    echo "Validating Terraform configuration..."
    terraform validate
    terraform fmt -check
    echo -e "${GREEN}✓ Configuration is valid${NC}"
}

# Plan infrastructure changes
plan_infrastructure() {
    echo "Planning infrastructure changes..."
    terraform plan -out=tfplan -var="environment=${ENVIRONMENT}"
    echo -e "${GREEN}✓ Plan created successfully${NC}"
    echo ""
    echo -e "${YELLOW}Review the plan above. To apply changes, run:${NC}"
    echo "./deploy-infrastructure.sh ${ENVIRONMENT} apply"
}

# Apply infrastructure changes
apply_infrastructure() {
    if [ ! -f "tfplan" ]; then
        echo -e "${RED}Error: No plan file found. Run 'plan' first${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}WARNING: This will create/modify infrastructure in AWS${NC}"
    read -p "Are you sure you want to continue? (yes/no): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled"
        exit 0
    fi
    
    echo "Applying infrastructure changes..."
    terraform apply tfplan
    
    # Save outputs
    echo "Saving outputs..."
    terraform output -json > outputs.json
    
    echo -e "${GREEN}✓ Infrastructure deployed successfully${NC}"
    
    # Display important outputs
    echo ""
    echo "Important Information:"
    echo "====================="
    echo "ALB DNS: $(terraform output -raw alb_dns_name)"
    echo "CloudFront Domain: $(terraform output -raw cloudfront_domain_name)"
    echo "Bastion IP: $(terraform output -raw bastion_public_ip)"
    echo "ECR Repository: $(terraform output -raw ecr_repository_url)"
}

# Destroy infrastructure
destroy_infrastructure() {
    echo -e "${RED}WARNING: This will DESTROY all infrastructure${NC}"
    echo "This action cannot be undone!"
    read -p "Type 'DESTROY' to confirm: " -r
    
    if [[ $REPLY != "DESTROY" ]]; then
        echo "Destruction cancelled"
        exit 0
    fi
    
    echo "Destroying infrastructure..."
    terraform destroy -auto-approve -var="environment=${ENVIRONMENT}"
    echo -e "${GREEN}✓ Infrastructure destroyed${NC}"
}

# Main execution
cd "$(dirname "$0")/../.."

check_prerequisites
init_terraform

case ${ACTION} in
    plan)
        validate_terraform
        plan_infrastructure
        ;;
    apply)
        apply_infrastructure
        ;;
    destroy)
        destroy_infrastructure
        ;;
    validate)
        validate_terraform
        ;;
    output)
        terraform output
        ;;
    *)
        echo -e "${RED}Error: Invalid action '${ACTION}'${NC}"
        echo "Usage: $0 [environment] [plan|apply|destroy|validate|output]"
        exit 1
        ;;
esac