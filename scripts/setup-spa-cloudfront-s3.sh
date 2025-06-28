#!/bin/bash

# Script interactivo para configurar SPA en S3 + CloudFront
# Requiere AWS CLI configurado y permisos suficientes

set -e

echo "--- Configuración SPA S3 + CloudFront ---"
read -p "Nombre del bucket S3 (ej: emotioxv2-frontend): " BUCKET
read -p "ID de la distribución CloudFront (ej: E1234567890ABC): " DIST_ID

# 1. Configurar S3 para servir index.html en errores
aws s3 website s3://$BUCKET/ --index-document index.html --error-document index.html

echo "[1/4] S3 configurado para SPA."

# 2. Descargar configuración actual de CloudFront
echo "Descargando configuración actual de CloudFront..."
aws cloudfront get-distribution-config --id $DIST_ID > dist-config.json
ETAG=$(cat dist-config.json | grep ETag | head -1 | awk -F '"' '{print $4}')

# 3. Modificar CustomErrorResponses en la config (JSON)
# Usamos jq para editar el JSON
if ! command -v jq &> /dev/null; then
  echo "[ERROR] jq no está instalado. Instálalo con 'brew install jq' o 'sudo apt install jq' y vuelve a correr el script."
  exit 1
fi

cat dist-config.json | jq '(.DistributionConfig.CustomErrorResponses.Items) |= [
  {"ErrorCode":403,"ResponsePagePath":"/index.html","ResponseCode":"200","ErrorCachingMinTTL":0},
  {"ErrorCode":404,"ResponsePagePath":"/index.html","ResponseCode":"200","ErrorCachingMinTTL":0}
] | (.DistributionConfig.CustomErrorResponses.Quantity) |= 2' > dist-config-spa.json

# 4. Subir la configuración modificada
echo "Actualizando configuración de CloudFront..."
aws cloudfront update-distribution --id $DIST_ID --if-match $ETAG --distribution-config file://dist-config-spa.json

echo "[3/4] CloudFront actualizado con páginas de error personalizadas para SPA."

# 5. Invalidar caché de CloudFront
echo "Invalidando caché de CloudFront..."
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"

echo "[4/4] ¡Listo! SPA configurado correctamente en S3 + CloudFront."
echo "Prueba acceder a rutas internas directamente en tu dominio CloudFront."
