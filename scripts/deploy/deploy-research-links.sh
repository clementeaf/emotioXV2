#!/bin/bash

# Deploy Research Links to S3
# This script handles the deployment of the Research Links application to AWS S3

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Research Links deployment to S3...${NC}"

# Check required environment variables
if [ -z "$BUCKET" ]; then
    echo -e "${RED}Error: BUCKET environment variable is not set${NC}"
    exit 1
fi

if [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo -e "${RED}Error: CLOUDFRONT_DISTRIBUTION_ID environment variable is not set${NC}"
    exit 1
fi

REGION=${REGION:-us-east-1}
BUILD_DIR="researchLinks/dist"

# Verify build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${RED}Error: Build directory $BUILD_DIR does not exist${NC}"
    echo "Please run 'npm run build' in the researchLinks directory first"
    exit 1
fi

# Verify index.html exists
if [ ! -f "$BUILD_DIR/index.html" ]; then
    echo -e "${RED}Error: index.html not found in $BUILD_DIR${NC}"
    exit 1
fi

echo -e "${YELLOW}Deployment Configuration:${NC}"
echo "  Bucket: $BUCKET"
echo "  Region: $REGION"
echo "  CloudFront Distribution: $CLOUDFRONT_DISTRIBUTION_ID"
echo "  Build Directory: $BUILD_DIR"

# Upload static assets with long-term caching
echo -e "${YELLOW}Uploading static assets...${NC}"
aws s3 sync "$BUILD_DIR" "s3://$BUCKET" \
    --region "$REGION" \
    --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "index.html" \
    --exclude "*.json" \
    --exclude "*.map" \
    --exclude ".DS_Store" \
    --exclude "*.md"

# Upload HTML files with no-cache headers
echo -e "${YELLOW}Uploading HTML files...${NC}"
find "$BUILD_DIR" -name "*.html" -type f | while read -r file; do
    relative_path=${file#$BUILD_DIR/}
    echo "  Uploading: $relative_path"
    aws s3 cp "$file" "s3://$BUCKET/$relative_path" \
        --region "$REGION" \
        --cache-control "no-cache, no-store, must-revalidate" \
        --content-type "text/html"
done

# Upload JSON files with no-cache headers
echo -e "${YELLOW}Uploading JSON files...${NC}"
find "$BUILD_DIR" -name "*.json" -type f 2>/dev/null | while read -r file; do
    relative_path=${file#$BUILD_DIR/}
    echo "  Uploading: $relative_path"
    aws s3 cp "$file" "s3://$BUCKET/$relative_path" \
        --region "$REGION" \
        --cache-control "no-cache, no-store, must-revalidate" \
        --content-type "application/json"
done || true

# Set proper MIME types for common file extensions
echo -e "${YELLOW}Setting MIME types...${NC}"

# JavaScript files
aws s3 cp "s3://$BUCKET" "s3://$BUCKET" \
    --region "$REGION" \
    --exclude "*" \
    --include "*.js" \
    --recursive \
    --metadata-directive REPLACE \
    --content-type "application/javascript" \
    --cache-control "public, max-age=31536000" || true

# CSS files
aws s3 cp "s3://$BUCKET" "s3://$BUCKET" \
    --region "$REGION" \
    --exclude "*" \
    --include "*.css" \
    --recursive \
    --metadata-directive REPLACE \
    --content-type "text/css" \
    --cache-control "public, max-age=31536000" || true

# SVG files
aws s3 cp "s3://$BUCKET" "s3://$BUCKET" \
    --region "$REGION" \
    --exclude "*" \
    --include "*.svg" \
    --recursive \
    --metadata-directive REPLACE \
    --content-type "image/svg+xml" \
    --cache-control "public, max-age=31536000" || true

# Configure S3 bucket for static website hosting (if not already configured)
echo -e "${YELLOW}Configuring S3 bucket for static website hosting...${NC}"
aws s3 website "s3://$BUCKET" \
    --region "$REGION" \
    --index-document index.html \
    --error-document index.html || true

# Invalidate CloudFront cache
echo -e "${YELLOW}Invalidating CloudFront cache...${NC}"
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

echo -e "${GREEN}CloudFront invalidation created: $INVALIDATION_ID${NC}"

# Wait for invalidation to complete (optional)
if [ "${WAIT_FOR_INVALIDATION:-false}" = "true" ]; then
    echo -e "${YELLOW}Waiting for CloudFront invalidation to complete...${NC}"
    aws cloudfront wait invalidation-completed \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --id "$INVALIDATION_ID"
    echo -e "${GREEN}CloudFront invalidation completed${NC}"
fi

# Verify deployment
echo -e "${YELLOW}Verifying deployment...${NC}"

# Check if index.html is accessible
if aws s3 ls "s3://$BUCKET/index.html" --region "$REGION" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ index.html successfully uploaded${NC}"
else
    echo -e "${RED}✗ index.html not found in S3${NC}"
    exit 1
fi

# Get CloudFront domain
CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution \
    --id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --query 'Distribution.DomainName' \
    --output text)

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo ""
echo -e "${GREEN}Access URLs:${NC}"
echo "  S3: https://$BUCKET.s3.$REGION.amazonaws.com"
echo "  CloudFront: https://$CLOUDFRONT_DOMAIN"
echo ""
echo -e "${YELLOW}Note: CloudFront invalidation may take a few minutes to propagate globally.${NC}"