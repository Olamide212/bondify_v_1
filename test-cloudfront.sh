#!/bin/bash

# CloudFront CDN Test Script
# Tests if CloudFront is properly configured and serving assets

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BACKEND_URL="http://localhost:5000"
TEST_IMAGE_KEY="test/cloudfront-test-image.jpg"

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

# Check if backend is running
check_backend() {
    print_info "Checking if backend is running..."
    if curl -s "$BACKEND_URL/api/health" > /dev/null 2>&1; then
        print_success "Backend is running"
        return 0
    else
        print_error "Backend is not running on $BACKEND_URL"
        print_info "Please start the backend first: cd backend && npm start"
        exit 1
    fi
}

# Test image upload
test_image_upload() {
    print_info "Testing image upload..."

    # Create a simple test image (1x1 pixel PNG)
    echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > test-image.png

    # Upload via API
    response=$(curl -s -X POST \
        -H "Content-Type: multipart/form-data" \
        -F "file=@test-image.png" \
        "$BACKEND_URL/api/upload/image")

    # Clean up
    rm test-image.png

    # Check response
    if echo "$response" | grep -q "url"; then
        uploaded_url=$(echo "$response" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
        print_success "Image uploaded successfully"
        echo "$uploaded_url"
    else
        print_error "Image upload failed"
        echo "Response: $response"
        exit 1
    fi
}

# Test CloudFront vs S3 performance
test_cdn_performance() {
    local image_url=$1

    print_info "Testing CDN performance..."

    # Check if URL uses CloudFront
    if echo "$image_url" | grep -q "cloudfront.net"; then
        print_success "URL is using CloudFront CDN"

        # Test response time
        response_time=$(curl -s -w "%{time_total}" -o /dev/null "$image_url")
        print_info "Response time: ${response_time}s"

        # Check cache headers
        cache_status=$(curl -s -I "$image_url" | grep -i "x-cache" | head -1)
        if echo "$cache_status" | grep -q "Hit"; then
            print_success "Cache hit - asset served from edge location"
        else
            print_warning "Cache miss - asset served from origin"
        fi

        # Check if image loads
        if curl -s "$image_url" | head -c 100 | grep -q "PNG"; then
            print_success "Image loads correctly via CloudFront"
        else
            print_error "Image failed to load via CloudFront"
        fi

    elif echo "$image_url" | grep -q "s3."; then
        print_warning "URL is using direct S3 (not CloudFront)"
        print_info "Consider setting up CloudFront CDN for better performance"
        print_info "Run: ./deploy-cloudfront.sh"
    else
        print_info "URL format not recognized"
    fi
}

# Main test function
main() {
    echo "🧪 CloudFront CDN Test Suite"
    echo "============================"
    echo ""

    check_backend

    uploaded_url=$(test_image_upload)

    test_cdn_performance "$uploaded_url"

    echo ""
    print_success "Test completed!"
}

# Run tests
main "$@"