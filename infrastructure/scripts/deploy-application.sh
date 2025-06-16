#!/bin/bash
# Application Deployment Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT=${1:-production}
VERSION=${2:-latest}

echo -e "${BLUE}True Label Application Deployment${NC}"
echo -e "${BLUE}=================================${NC}"
echo "Environment: ${ENVIRONMENT}"
echo "Version: ${VERSION}"
echo ""

# Load infrastructure outputs
if [ ! -f "infrastructure/terraform/outputs.json" ]; then
    echo -e "${RED}Error: Infrastructure outputs not found${NC}"
    echo "Please deploy infrastructure first"
    exit 1
fi

# Extract values from Terraform outputs
ECR_URL=$(cat infrastructure/terraform/outputs.json | jq -r '.ecr_repository_url.value')
ECS_CLUSTER=$(cat infrastructure/terraform/outputs.json | jq -r '.ecs_cluster_name.value')
ECS_SERVICE=$(cat infrastructure/terraform/outputs.json | jq -r '.ecs_service_name.value')
S3_STATIC_BUCKET=$(cat infrastructure/terraform/outputs.json | jq -r '.s3_static_bucket.value')
CLOUDFRONT_ID=$(cat infrastructure/terraform/outputs.json | jq -r '.cloudfront_distribution_id.value')

# Build and push Docker image
build_and_push_api() {
    echo -e "${YELLOW}Building API Docker image...${NC}"
    
    cd server
    
    # Build image
    docker build \
        --platform linux/amd64 \
        -t ${ECR_URL}:${VERSION} \
        -t ${ECR_URL}:latest \
        -f Dockerfile.production \
        .
    
    # Login to ECR
    aws ecr get-login-password --region ${AWS_REGION} | \
        docker login --username AWS --password-stdin ${ECR_URL%/*}
    
    # Push image
    docker push ${ECR_URL}:${VERSION}
    docker push ${ECR_URL}:latest
    
    cd ..
    echo -e "${GREEN}✓ API image pushed successfully${NC}"
}

# Build and deploy frontend
build_and_deploy_frontend() {
    echo -e "${YELLOW}Building frontend...${NC}"
    
    cd client
    
    # Install dependencies
    npm ci
    
    # Build with production environment
    VITE_API_BASE_URL="https://api.${DOMAIN_NAME}/api/v1" \
    VITE_QR_BASE_URL="https://${DOMAIN_NAME}" \
    VITE_ENVIRONMENT="production" \
    npm run build
    
    # Upload to S3
    echo "Uploading to S3..."
    aws s3 sync dist/ s3://${S3_STATIC_BUCKET}/ \
        --delete \
        --cache-control "public, max-age=31536000" \
        --exclude "index.html" \
        --exclude "*.json"
    
    # Upload HTML and JSON files with different cache settings
    aws s3 sync dist/ s3://${S3_STATIC_BUCKET}/ \
        --exclude "*" \
        --include "index.html" \
        --include "*.json" \
        --cache-control "public, max-age=0, must-revalidate"
    
    cd ..
    echo -e "${GREEN}✓ Frontend deployed to S3${NC}"
}

# Run database migrations
run_migrations() {
    echo -e "${YELLOW}Running database migrations...${NC}"
    
    # Get database connection details from Secrets Manager
    DB_SECRET=$(aws secretsmanager get-secret-value \
        --secret-id truelabel-db-connection-${ENVIRONMENT} \
        --query 'SecretString' \
        --output text)
    
    DATABASE_URL=$(echo $DB_SECRET | jq -r '.url')
    
    cd server
    
    # Run migrations
    DATABASE_URL=${DATABASE_URL} npx prisma migrate deploy
    
    # Generate Prisma client
    npx prisma generate
    
    cd ..
    echo -e "${GREEN}✓ Migrations completed${NC}"
}

# Update ECS service
update_ecs_service() {
    echo -e "${YELLOW}Updating ECS service...${NC}"
    
    # Force new deployment
    aws ecs update-service \
        --cluster ${ECS_CLUSTER} \
        --service ${ECS_SERVICE} \
        --force-new-deployment \
        --desired-count 3
    
    # Wait for deployment to stabilize
    echo "Waiting for service to stabilize..."
    aws ecs wait services-stable \
        --cluster ${ECS_CLUSTER} \
        --services ${ECS_SERVICE}
    
    echo -e "${GREEN}✓ ECS service updated${NC}"
}

# Invalidate CloudFront cache
invalidate_cdn() {
    echo -e "${YELLOW}Invalidating CloudFront cache...${NC}"
    
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id ${CLOUDFRONT_ID} \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)
    
    echo "Invalidation ID: ${INVALIDATION_ID}"
    echo -e "${GREEN}✓ Cache invalidation started${NC}"
}

# Health check
health_check() {
    echo -e "${YELLOW}Running health checks...${NC}"
    
    # Check API health
    API_URL="https://api.${DOMAIN_NAME}/health"
    if curl -f -s ${API_URL} > /dev/null; then
        echo -e "${GREEN}✓ API is healthy${NC}"
    else
        echo -e "${RED}✗ API health check failed${NC}"
        exit 1
    fi
    
    # Check frontend
    FRONTEND_URL="https://${DOMAIN_NAME}"
    if curl -f -s ${FRONTEND_URL} > /dev/null; then
        echo -e "${GREEN}✓ Frontend is accessible${NC}"
    else
        echo -e "${RED}✗ Frontend check failed${NC}"
        exit 1
    fi
}

# Create deployment tag
create_deployment_tag() {
    echo -e "${YELLOW}Creating deployment tag...${NC}"
    
    # Create git tag
    git tag -a "deploy-${ENVIRONMENT}-${VERSION}-$(date +%Y%m%d%H%M%S)" \
        -m "Deployment to ${ENVIRONMENT} - Version ${VERSION}"
    
    # Push tag
    git push origin --tags
    
    echo -e "${GREEN}✓ Deployment tag created${NC}"
}

# Send deployment notification
send_notification() {
    echo -e "${YELLOW}Sending deployment notification...${NC}"
    
    # Get SNS topic ARN
    SNS_TOPIC=$(cat infrastructure/terraform/outputs.json | jq -r '.sns_alert_topic_arn.value')
    
    aws sns publish \
        --topic-arn ${SNS_TOPIC} \
        --subject "Deployment Complete - ${ENVIRONMENT}" \
        --message "Deployment of version ${VERSION} to ${ENVIRONMENT} completed successfully at $(date)"
    
    echo -e "${GREEN}✓ Notification sent${NC}"
}

# Main deployment flow
main() {
    echo "Starting deployment..."
    echo ""
    
    # Pre-deployment checks
    if [ -z "${AWS_REGION}" ]; then
        export AWS_REGION="sa-east-1"
    fi
    
    if [ -z "${DOMAIN_NAME}" ]; then
        echo -e "${RED}Error: DOMAIN_NAME environment variable not set${NC}"
        exit 1
    fi
    
    # Execute deployment steps
    build_and_push_api
    echo ""
    
    build_and_deploy_frontend
    echo ""
    
    run_migrations
    echo ""
    
    update_ecs_service
    echo ""
    
    invalidate_cdn
    echo ""
    
    # Wait a bit for services to stabilize
    sleep 30
    
    health_check
    echo ""
    
    create_deployment_tag
    echo ""
    
    send_notification
    echo ""
    
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Deployment completed successfully! 🎉${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Application URLs:"
    echo "- Frontend: https://${DOMAIN_NAME}"
    echo "- API: https://api.${DOMAIN_NAME}"
    echo ""
}

# Run main function
main