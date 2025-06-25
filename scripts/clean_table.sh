#!/bin/bash

# Tabla principal (contiene todos los modelos excepto usuarios)
TABLE_NAME="emotioxv2-backend-table-dev"
REGION="us-east-1"

echo "Obteniendo elementos de la tabla $TABLE_NAME..."

# Obtener todos los IDs y SKs
ITEMS=$(aws dynamodb scan --table-name $TABLE_NAME --attributes-to-get id sk --query "Items" --output json)

# Contar elementos
COUNT=$(echo $ITEMS | jq length)
echo "Se encontraron $COUNT elementos para eliminar."

# Iterar sobre cada elemento y eliminarlo
echo $ITEMS | jq -c '.[]' | while read -r item; do
  ID=$(echo $item | jq -r '.id.S')
  SK=$(echo $item | jq -r '.sk.S')
  
  echo "Eliminando elemento con ID: $ID, SK: $SK"
  
  aws dynamodb delete-item \
    --table-name $TABLE_NAME \
    --key "{\"id\":{\"S\":\"$ID\"},\"sk\":{\"S\":\"$SK\"}}" \
    --region $REGION
    
  # Breve pausa para evitar exceder los límites de velocidad de la API
  sleep 0.2
done

echo "Limpieza completada." 