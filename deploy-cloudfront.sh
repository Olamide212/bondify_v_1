#!/bin/bash

# CloudFront CDN Deployment Script for Bondify
# This script helps deploy CloudFront distribution for S3 assets

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="bondify-cloudfront-cdn"
TEMPLATE_FILE="cloudfront-template.yaml"
ENVIRONMENT="prod"
PRICE_CLASS="PriceClass_All"

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if AWS CLI is configured
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi

    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI is not configured. Please run 'aws configure' first."
        exit 1
    fi
}

# Function to get S3 bucket name
get_s3_bucket() {
    read -p "Enter your S3 bucket name (default: bondify-assets): " bucket_name
    bucket_name=${bucket_name:-bondify-assets}
    echo $bucket_name
}

# Function to deploy CloudFormation stack
deploy_cloudformation() {
    local bucket_name=$1

    print_info "Deploying CloudFront distribution..."

    aws cloudformation deploy \
        --template-file $TEMPLATE_FILE \
        --stack-name $STACK_NAME \
        --parameter-overrides \
            S3BucketName=$bucket_name \
            PriceClass=$PRICE_CLASS \
            Environment=$ENVIRONMENT \
        --capabilities CAPABILITY_IAM \
        --no-fail-on-empty-changeset

    if [ $? -eq 0 ]; then
        print_success "CloudFront distribution deployed successfully!"
    else
        print_error "Failed to deploy CloudFront distribution"
        exit 1
    fi
}

# Function to get CloudFront domain
get_cloudfront_domain() {
    local domain=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomain`].OutputValue' \
        --output text)

    if [ -z "$domain" ]; then
        print_error "Failed to get CloudFront domain"
        exit 1
    fi

    echo $domain
}

# Function to update S3 bucket policy
update_s3_bucket_policy() {
    local bucket_name=$1
    local distribution_id=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' \
        --output text)

    if [ -z "$distribution_id" ]; then
        print_error "Failed to get Distribution ID"
        exit 1
    fi

    print_info "Updating S3 bucket policy for CloudFront access..."

    # Get the Origin Access Control ARN
    local oac_arn=$(aws cloudfront get-origin-access-control \
        --id $(aws cloudformation describe-stack-resources \
            --stack-name $STACK_NAME \
            --query 'StackResources[?ResourceType==`AWS::CloudFront::OriginAccessControl`].PhysicalResourceId' \
            --output text) \
        --query 'OriginAccessControl.OriginAccessControlConfig.SigningBehavior' \
        --output text 2>/dev/null || echo "always")

    # Create bucket policy
    cat > bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity $(aws cloudformation describe-stack-resources --stack-name $STACK_NAME --query 'StackResources[?ResourceType==`AWS::CloudFront::OriginAccessControl`].PhysicalResourceId' --output text)"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$bucket_name/*"
    }
  ]
}
EOF

    aws s3api put-bucket-policy \
        --bucket $bucket_name \
        --policy file://bucket-policy.json

    rm bucket-policy.json

    print_success "S3 bucket policy updated"
}

# Function to test the setup
test_setup() {
    local domain=$1
    local bucket_name=$2

    print_info "Testing CloudFront setup..."

    # Upload a test file
    echo "CloudFront CDN Test" > test.txt
    aws s3 cp test.txt s3://$bucket_name/test-cdn.txt --acl public-read

    # Test direct S3 access
    print_info "Testing direct S3 access..."
    if curl -s "https://$bucket_name.s3.amazonaws.com/test-cdn.txt" > /dev/null; then
        print_success "Direct S3 access works"
    else
        print_warning "Direct S3 access failed (expected with OAC)"
    fi

    # Test CloudFront access
    print_info "Testing CloudFront access..."
    if curl -s "https://$domain/test-cdn.txt" | grep -q "CloudFront CDN Test"; then
        print_success "CloudFront access works!"
    else
        print_error "CloudFront access failed"
    fi

    # Clean up test file
    aws s3 rm s3://$bucket_name/test-cdn.txt
    rm test.txt
}

# Function to generate environment configuration
generate_env_config() {
    local domain=$1

    print_info "Generating environment configuration..."
    print_info "Add this to your backend .env file:"
    echo ""
    echo "AWS_CLOUDFRONT_DOMAIN=https://$domain"
    echo ""
    print_success "Environment configuration generated"
}

# Main function
main() {
    print_info "CloudFront CDN Setup for Bondify Assets"
    echo ""

    # Check prerequisites
    check_aws_cli

    # Get S3 bucket name
    BUCKET_NAME=$(get_s3_bucket)

    # Confirm deployment
    read -p "Deploy CloudFront distribution for bucket '$BUCKET_NAME'? (y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        print_info "Deployment cancelled"
        exit 0
    fi

    # Deploy CloudFormation stack
    deploy_cloudformation $BUCKET_NAME

    # Update S3 bucket policy
    update_s3_bucket_policy $BUCKET_NAME

    # Get CloudFront domain
    CLOUDFRONT_DOMAIN=$(get_cloudfront_domain)

    # Test setup
    test_setup $CLOUDFRONT_DOMAIN $BUCKET_NAME

    # Generate environment config
    generate_env_config $CLOUDFRONT_DOMAIN

    print_success "CloudFront CDN setup completed!"
    print_info "Your assets will now be served via: https://$CLOUDFRONT_DOMAIN"
    print_info "Don't forget to update your backend environment variables and redeploy."
}

# Run main function
main "$@"