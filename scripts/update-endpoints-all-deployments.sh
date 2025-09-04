#!/bin/bash

# Update endpoints in all deployments
# This script updates the dynamic endpoints in all deployment environments

set -e

echo "🔄 Actualizando endpoints en todos los despliegues activos..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required environment variables are set
if [ -z "$AWS_REGION" ]; then
    export AWS_REGION="us-east-1"
    print_warning "AWS_REGION not set, using default: us-east-1"
fi

# Update Amplify frontend (if configured)
if [ -n "$AMPLIFY_FRONTEND_APP_ID" ]; then
    echo "📱 Updating Amplify Frontend endpoints..."
    
    # Trigger Amplify build to update with new endpoints
    if aws amplify start-job \
        --app-id "$AMPLIFY_FRONTEND_APP_ID" \
        --branch-name main \
        --job-type RELEASE \
        --region "$AWS_REGION" > /dev/null 2>&1; then
        print_status "Amplify frontend build triggered"
    else
        print_warning "Could not trigger Amplify frontend build"
    fi
else
    print_warning "AMPLIFY_FRONTEND_APP_ID not configured, skipping Amplify frontend update"
fi

# Update Amplify public-tests (if configured)
if [ -n "$AMPLIFY_PUBLIC_TESTS_APP_ID" ]; then
    echo "📱 Updating Amplify Public Tests endpoints..."
    
    # Trigger Amplify build to update with new endpoints
    if aws amplify start-job \
        --app-id "$AMPLIFY_PUBLIC_TESTS_APP_ID" \
        --branch-name main \
        --job-type RELEASE \
        --region "$AWS_REGION" > /dev/null 2>&1; then
        print_status "Amplify public-tests build triggered"
    else
        print_warning "Could not trigger Amplify public-tests build"
    fi
else
    print_warning "AMPLIFY_PUBLIC_TESTS_APP_ID not configured, skipping Amplify public-tests update"
fi

# Update CloudFront distributions (if configured)
if [ -n "$CLOUDFRONT_FRONTEND_DIST_ID" ]; then
    echo "🌐 Invalidating CloudFront cache for frontend..."
    
    if aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_FRONTEND_DIST_ID" \
        --paths "/*" \
        --region "$AWS_REGION" > /dev/null 2>&1; then
        print_status "CloudFront frontend cache invalidated"
    else
        print_warning "Could not invalidate CloudFront frontend cache"
    fi
else
    print_warning "CLOUDFRONT_FRONTEND_DIST_ID not configured, skipping frontend cache invalidation"
fi

if [ -n "$CLOUDFRONT_PUBLIC_TESTS_DIST_ID" ]; then
    echo "🌐 Invalidating CloudFront cache for public-tests..."
    
    if aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_PUBLIC_TESTS_DIST_ID" \
        --paths "/*" \
        --region "$AWS_REGION" > /dev/null 2>&1; then
        print_status "CloudFront public-tests cache invalidated"
    else
        print_warning "Could not invalidate CloudFront public-tests cache"
    fi
else
    print_warning "CLOUDFRONT_PUBLIC_TESTS_DIST_ID not configured, skipping public-tests cache invalidation"
fi

# Update S3 buckets with new endpoints (if configured)
if [ -n "$FRONTEND_S3_BUCKET" ]; then
    echo "📦 Updating S3 frontend endpoints..."
    
    if [ -f "frontend/src/api/endpoints.js" ]; then
        aws s3 cp frontend/src/api/endpoints.js s3://"$FRONTEND_S3_BUCKET"/config/endpoints.js --region "$AWS_REGION" || print_warning "Could not update S3 frontend endpoints"
        print_status "S3 frontend endpoints updated"
    else
        print_warning "frontend/src/api/endpoints.js not found"
    fi
else
    print_warning "FRONTEND_S3_BUCKET not configured, skipping S3 frontend update"
fi

if [ -n "$PUBLIC_TESTS_S3_BUCKET" ]; then
    echo "📦 Updating S3 public-tests endpoints..."
    
    if [ -f "public-tests/src/config/endpoints.js" ]; then
        aws s3 cp public-tests/src/config/endpoints.js s3://"$PUBLIC_TESTS_S3_BUCKET"/config/endpoints.js --region "$AWS_REGION" || print_warning "Could not update S3 public-tests endpoints"
        print_status "S3 public-tests endpoints updated"
    else
        print_warning "public-tests/src/config/endpoints.js not found"
    fi
else
    print_warning "PUBLIC_TESTS_S3_BUCKET not configured, skipping S3 public-tests update"
fi

# Send webhook notification (if configured)
if [ -n "$WEBHOOK_URL" ]; then
    echo "📡 Sending webhook notification..."
    
    if curl -s -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d '{"message": "EmotioXV2 endpoints updated", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > /dev/null 2>&1; then
        print_status "Webhook notification sent"
    else
        print_warning "Could not send webhook notification"
    fi
else
    print_warning "WEBHOOK_URL not configured, skipping webhook notification"
fi

print_status "Endpoint update process completed!"
echo "🎯 All configured deployments have been notified of endpoint changes"