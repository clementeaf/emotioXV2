#!/bin/bash
set -e

# === CONFIGURACIÓN ===
BUCKET_NAME=emotioxv2-public-tests-bucket
CLOUDFRONT_DIST_ID=E2X8HCFI5FM1EC
PUBLIC_TESTS_DIR=public-tests
BUILD_DIR=dist

# === 1. Build de public-tests ===
echo "[1/4] Instalando dependencias..."
cd "$PUBLIC_TESTS_DIR"
npm ci
echo "[2/4] Construyendo public-tests..."
npm run build
cd ..

# === 2. Subir a S3 ===
echo "[3/4] Subiendo archivos a S3..."
aws s3 sync "$PUBLIC_TESTS_DIR/$BUILD_DIR" s3://$BUCKET_NAME --delete

# === 3. Invalidar caché de CloudFront ===
echo "[4/4] Invalidando caché de CloudFront..."
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DIST_ID --paths "/*"

# === 4. Imprimir URL pública ===
PUBLIC_URL="https://$BUCKET_NAME.s3.amazonaws.com/index.html"
CLOUDFRONT_URL="https://d2zt8ia21te5mv.cloudfront.net/"
echo "\n✅ Deploy completo. URL pública S3: $PUBLIC_URL"
echo "✅ URL CloudFront: $CLOUDFRONT_URL"
echo "\nPuedes inyectar esta URL en el frontend principal usando la variable NEXT_PUBLIC_PUBLIC_TESTS_URL."
