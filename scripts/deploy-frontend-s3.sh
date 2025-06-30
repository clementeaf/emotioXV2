#!/bin/bash
set -e

# CONFIGURACIÓN (MODIFICA ESTOS VALORES)
BUCKET_NAME="emotioxv2-frontend-bucket"   # Cambia si quieres otro nombre
CLOUDFRONT_DIST_ID="E3MCIWNMF6ES2R"        # Pon aquí el ID real de tu distribución
FRONTEND_DIR="frontend"                   # Directorio del frontend
BUILD_DIR="out"                           # "dist" para Vite, "out" para Next.js export

# 1. Build del frontend
cd "$FRONTEND_DIR"
echo "[1/3] Instalando dependencias..."
npm ci
echo "[2/3] Construyendo el frontend (Next.js export)..."
npm run build
cd ..

# 2. Subir a S3
echo "[3/3] Subiendo archivos a S3..."
aws s3 sync "$FRONTEND_DIR/$BUILD_DIR" s3://$BUCKET_NAME --delete

# 3. Invalidar caché de CloudFront
echo "Invalidando caché de CloudFront..."
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DIST_ID --paths "/*"

echo "\n✅ Deploy completo a S3 + CloudFront (Next.js export)"
