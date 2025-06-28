#!/bin/bash

# Script NO interactivo para configurar SPA en S3 + CloudFront (frontend)
# Requiere AWS CLI y jq instalados

set -e

BUCKET="emotioxv2-frontend-bucket"
DIST_ID="E3MCIWNMF6ES2R"

# 1. Configurar S3 para servir index.html en errores
aws s3 website s3://$BUCKET/ --index-document index.html --error-document index.html

echo "[1/4] S3 configurado para SPA."

# 2. Descargar configuración actual de CloudFront
echo "Descargando configuración actual de CloudFront..."
aws cloudfront get-distribution-config --id $DIST_ID > dist-config-raw.json
ETAG=$(cat dist-config-raw.json | grep ETag | head -1 | awk -F '"' '{print $4}')

# 3. Extraer solo el bloque DistributionConfig y modificar CustomErrorResponses
if ! command -v jq &> /dev/null; then
  echo "[ERROR] jq no está instalado. Instálalo con 'brew install jq' o 'sudo apt install jq' y vuelve a correr el script."
  exit 1
fi

cat dist-config-raw.json | jq '.DistributionConfig | (.CustomErrorResponses.Items) |= [
  {"ErrorCode":403,"ResponsePagePath":"/index.html","ResponseCode":"200","ErrorCachingMinTTL":0},
  {"ErrorCode":404,"ResponsePagePath":"/index.html","ResponseCode":"200","ErrorCachingMinTTL":0}
] | (.CustomErrorResponses.Quantity) |= 2' > dist-config-spa.json

# 4. Subir la configuración modificada
echo "Actualizando configuración de CloudFront..."
aws cloudfront update-distribution --id $DIST_ID --if-match $ETAG --distribution-config file://dist-config-spa.json

echo "[3/4] CloudFront actualizado con páginas de error personalizadas para SPA."

# 5. Invalidar caché de CloudFront
echo "Invalidando caché de CloudFront..."
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"

echo "[4/4] ¡Listo! SPA configurado correctamente en S3 + CloudFront (frontend)."
echo "Prueba acceder a rutas internas directamente en tu dominio CloudFront."
