#!/bin/bash
set -e

# Cargar variables dinámicas
source scripts/envs-source.sh

# === 1. Actualizar o agregar la variable en frontend/.env.production ===
echo "Actualizando NEXT_PUBLIC_API_URL en $FRONTEND_ENV..."
if grep -q '^NEXT_PUBLIC_API_URL=' "$FRONTEND_ENV"; then
  sed -i '' "s|^NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=$API_URL|" "$FRONTEND_ENV"
else
  echo "NEXT_PUBLIC_API_URL=$API_URL" >> "$FRONTEND_ENV"
fi

echo "Actualizando NEXT_PUBLIC_API_URL en $PUBLIC_TESTS_ENV..."
if grep -q '^NEXT_PUBLIC_API_URL=' "$PUBLIC_TESTS_ENV"; then
  sed -i '' "s|^NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=$API_URL|" "$PUBLIC_TESTS_ENV"
else
  echo "NEXT_PUBLIC_API_URL=$API_URL" >> "$PUBLIC_TESTS_ENV"
fi

echo "✅ Variable NEXT_PUBLIC_API_URL actualizada en ambos .env.production"
