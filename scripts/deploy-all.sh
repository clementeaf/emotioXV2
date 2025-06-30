#!/bin/bash
set -e

# === CONFIGURACIÓN INICIAL ===
# Cambia estos valores según tu entorno
API_URL="https://tu-api-lambda.amazonaws.com/dev" # Actualiza tras deploy de backendv2
PUBLIC_TESTS_CLOUDFRONT_URL="https://d2s9nr0bm47yl1.cloudfront.net/"

# === 1. Actualizar la URL de backendv2 en ambos frontends ===
echo "\n[1/5] Actualizando NEXT_PUBLIC_API_URL en ambos .env.production..."
FRONTEND_ENV=frontend/.env.production
PUBLIC_TESTS_ENV=public-tests/.env.production
if grep -q '^NEXT_PUBLIC_API_URL=' "$FRONTEND_ENV"; then
  sed -i '' "s|^NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=$API_URL|" "$FRONTEND_ENV"
else
  echo "NEXT_PUBLIC_API_URL=$API_URL" >> "$FRONTEND_ENV"
fi
if grep -q '^NEXT_PUBLIC_API_URL=' "$PUBLIC_TESTS_ENV"; then
  sed -i '' "s|^NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=$API_URL|" "$PUBLIC_TESTS_ENV"
else
  echo "NEXT_PUBLIC_API_URL=$API_URL" >> "$PUBLIC_TESTS_ENV"
fi

# === 2. Deploy de public-tests (SPA) ===
echo "\n[2/5] Deploy de public-tests (SPA) a S3 + CloudFront..."
bash scripts/deploy-public-tests-s3.sh

# === 3. Actualizar la URL de public-tests en el frontend principal ===
echo "\n[3/5] Actualizando NEXT_PUBLIC_PUBLIC_TESTS_URL en frontend/.env.production..."
if grep -q '^NEXT_PUBLIC_PUBLIC_TESTS_URL=' "$FRONTEND_ENV"; then
  sed -i '' "s|^NEXT_PUBLIC_PUBLIC_TESTS_URL=.*|NEXT_PUBLIC_PUBLIC_TESTS_URL=$PUBLIC_TESTS_CLOUDFRONT_URL|" "$FRONTEND_ENV"
else
  echo "NEXT_PUBLIC_PUBLIC_TESTS_URL=$PUBLIC_TESTS_CLOUDFRONT_URL" >> "$FRONTEND_ENV"
fi

# === 4. Deploy del frontend principal (SSR) ===
echo "\n[4/5] Deploy del frontend SSR en EC2..."
bash scripts/deploy-frontend-ssr-ec2.sh

# === 5. Resumen final ===
echo "\n[5/5] Deploy completo de todo el stack.\n"
echo "- API_URL usado: $API_URL"
echo "- Public-tests URL: $PUBLIC_TESTS_CLOUDFRONT_URL"
echo "- Frontend y public-tests consumen URLs dinámicas y actualizadas."
