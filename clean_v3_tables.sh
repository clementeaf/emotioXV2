#!/bin/bash

# Lista de tablas v3 a limpiar (todas excepto users, que solo limpiaremos parcialmente)
TABLES=(
  "emotio-x-backend-v3-connections-dev"
  "emotio-x-backend-v3-forms-dev"
  "emotio-x-backend-v3-research-dev"
  "emotio-x-backend-v3-thank-you-screens-dev"
)

REGION="us-east-1"

for TABLE_NAME in "${TABLES[@]}"; do
  echo "Limpiando tabla $TABLE_NAME..."
  
  # Obtener todos los elementos (solo las claves)
  ITEMS=$(aws dynamodb scan --table-name $TABLE_NAME --select "ALL_ATTRIBUTES" --query "Items" --output json)
  
  # Contar elementos
  COUNT=$(echo $ITEMS | jq length)
  echo "Se encontraron $COUNT elementos para eliminar."
  
  # Iterar sobre cada elemento y extraer las claves para eliminarlo
  echo $ITEMS | jq -c '.[]' | while read -r item; do
    # Extraer atributos de las claves primarias 
    # Nota: Necesitamos examinar el primer elemento para determinar qué atributos son claves
    KEY_JSON="{}"
    
    # Extraer las propiedades para la clave
    if echo $item | jq -e '.id' > /dev/null; then
      ID=$(echo $item | jq -r '.id.S')
      KEY_JSON=$(echo $KEY_JSON | jq '. += {"id":{"S":"'"$ID"'"}}')
    fi
    
    if echo $item | jq -e '.pk' > /dev/null; then
      PK=$(echo $item | jq -r '.pk.S')
      KEY_JSON=$(echo $KEY_JSON | jq '. += {"pk":{"S":"'"$PK"'"}}')
    fi
    
    if echo $item | jq -e '.sk' > /dev/null; then
      SK=$(echo $item | jq -r '.sk.S')
      KEY_JSON=$(echo $KEY_JSON | jq '. += {"sk":{"S":"'"$SK"'"}}')
    fi
    
    echo "Eliminando elemento con clave: $KEY_JSON"
    
    # Eliminar elemento
    aws dynamodb delete-item \
      --table-name $TABLE_NAME \
      --key "$KEY_JSON" \
      --region $REGION
      
    # Breve pausa para evitar exceder los límites de velocidad de la API
    sleep 0.2
  done
  
  echo "Limpieza de $TABLE_NAME completada."
done

echo "Limpieza de todas las tablas v3 completada." 