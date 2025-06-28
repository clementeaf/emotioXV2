#!/bin/bash
set -e

BUCKET_NAME="emotioxv2-public-tests-bucket"
CLOUDFRONT_DIST_ID="E74AT36863Y15"
PUBLIC_TESTS_DIR="public-tests"
BUILD_DIR="dist"

# 1. Build de public-tests
cd "$PUBLIC_TESTS_DIR"
echo "[1/3] Instalando dependencias..."
npm ci
echo "[2/3] Construyendo public-tests..."
npm run build
cd ..

# 2. Subir a S3
echo "[3/3] Subiendo archivos a S3..."
aws s3 sync "$PUBLIC_TESTS_DIR/$BUILD_DIR" s3://$BUCKET_NAME --delete

# 3. Invalidar caché de CloudFront
echo "Invalidando caché de CloudFront..."
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DIST_ID --paths "/*"

echo "\n✅ Deploy completo a S3 + CloudFront (public-tests)"
