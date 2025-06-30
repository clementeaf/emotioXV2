#!/bin/bash
set -e

# === CONFIGURACIÓN ===
FRONTEND_ENV=frontend/.env.production
PUBLIC_TESTS_CLOUDFRONT_URL="https://d2s9nr0bm47yl1.cloudfront.net/"

# === 1. Actualizar o agregar la variable en el .env.production del frontend ===
if grep -q '^NEXT_PUBLIC_PUBLIC_TESTS_URL=' "$FRONTEND_ENV"; then
  sed -i '' "s|^NEXT_PUBLIC_PUBLIC_TESTS_URL=.*|NEXT_PUBLIC_PUBLIC_TESTS_URL=$PUBLIC_TESTS_CLOUDFRONT_URL|" "$FRONTEND_ENV"
else
  echo "NEXT_PUBLIC_PUBLIC_TESTS_URL=$PUBLIC_TESTS_CLOUDFRONT_URL" >> "$FRONTEND_ENV"
fi

echo "✅ Variable NEXT_PUBLIC_PUBLIC_TESTS_URL actualizada en $FRONTEND_ENV"
