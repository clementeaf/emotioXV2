#!/bin/bash

# Script para eliminar todos los items de WelcomeScreen, ThankYouScreen y EyeTracking en DynamoDB
# Tabla: emotioxv2-backend-table-dev
# Requiere AWS CLI configurado y permisos de borrado

TABLE="emotioxv2-backend-table-dev"
SKS=("WELCOME_SCREEN" "THANK_YOU_SCREEN" "EYE_TRACKING_CONFIG")

for SK in "${SKS[@]}"; do
  echo "Buscando items con sk=$SK..."
  IDS=$(aws dynamodb scan \
    --table-name "$TABLE" \
    --filter-expression "sk = :sk" \
    --expression-attribute-values '{":sk": {"S": "'$SK'"}}' \
    --projection-expression "id" \
    --output text | awk '{print $2}')

  if [ -z "$IDS" ]; then
    echo "No se encontraron items para sk=$SK."
    continue
  fi

  for ID in $IDS; do
    echo "Eliminando id=$ID sk=$SK..."
    aws dynamodb delete-item \
      --table-name "$TABLE" \
      --key '{"id": {"S": "'$ID'"}, "sk": {"S": "'$SK'"}}'
  done

done

echo "\n✅ Eliminación completada."
