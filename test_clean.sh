#!/bin/bash

# Script de prueba para limpiar solo la tabla de investigaciones

echo "🔄 Iniciando limpieza de prueba..."

# Tabla a limpiar
TABLE="emotio-x-backend-v3-research-dev"

echo "🗑️ Limpiando tabla: $TABLE"

# Obtener la clave primaria de la tabla
PRIMARY_KEYS=$(aws dynamodb describe-table --table-name "$TABLE" --query "Table.KeySchema[*].AttributeName" --output text)

# Si obtenemos las claves primarias, procedemos a eliminar los elementos
if [ ! -z "$PRIMARY_KEYS" ]; then
  echo "  🔑 Claves primarias identificadas: $PRIMARY_KEYS"
  
  # Obtener todos los elementos
  ITEMS=$(aws dynamodb scan --table-name "$TABLE" --attributes-to-get $PRIMARY_KEYS --output json)
  
  # Ver cuántos elementos hay
  COUNT=$(echo "$ITEMS" | jq '.Count')
  echo "  📊 Elementos encontrados: $COUNT"
  
  # Mostrar los primeros elementos para confirmar
  echo "  🔍 Primeros elementos (para verificación):"
  echo "$ITEMS" | jq '.Items[0:3]'
  
  # Preguntar al usuario si quiere continuar
  read -p "  ❓ ¿Deseas continuar con la eliminación? (s/n): " CONFIRM
  
  if [ "$CONFIRM" == "s" ]; then
    # Extraer los valores de las claves y eliminar cada elemento
    echo "  🗑️ Eliminando elementos..."
    echo "$ITEMS" | jq -c '.Items[]' | while read -r ITEM; do
      KEY_JSON="{}"
      
      for KEY in $PRIMARY_KEYS; do
        # Extraer el tipo y valor de la clave
        TYPE=$(echo "$ITEM" | jq -r ".$KEY | keys[0]")
        VALUE=$(echo "$ITEM" | jq -r ".$KEY.$TYPE")
        
        # Construir el JSON de la clave
        KEY_JSON=$(echo "$KEY_JSON" | jq --arg k "$KEY" --arg t "$TYPE" --arg v "$VALUE" '. + {($k): {($t): ($v)}}')
      done
      
      # Eliminar el elemento
      aws dynamodb delete-item --table-name "$TABLE" --key "$KEY_JSON" > /dev/null
      echo -n "."
    done
    echo " ✅"
    echo "✅ Prueba de limpieza completada."
  else
    echo "❌ Operación cancelada por el usuario."
  fi
else
  echo "  ⚠️ No se pudieron identificar las claves primarias, omitiendo tabla"
fi 