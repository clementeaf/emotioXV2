#!/bin/bash

# Script para limpiar todas las tablas de DynamoDB, excepto el usuario clemente@gmail.com

echo "🔄 Iniciando limpieza de tablas DynamoDB..."

# Respaldo del usuario clemente@gmail.com
echo "📦 Respaldando usuario clemente@gmail.com..."
aws dynamodb scan --table-name emotioxv2-backend-users-dev --filter-expression "email = :email" --expression-attribute-values '{":email": {"S": "clemente@gmail.com"}}' --output json > clemente_user_backup.json

echo "⚠️ ADVERTENCIA: Este script eliminará todos los datos de las tablas de DynamoDB."
echo "⚠️ Solo se conservará el usuario 'clemente@gmail.com'."
read -p "❓ ¿Estás seguro de que deseas continuar? (s/n): " CONFIRM_ALL

if [ "$CONFIRM_ALL" != "s" ]; then
  echo "❌ Operación cancelada por el usuario."
  exit 1
fi

# Lista de todas las tablas
TABLES=(
  "emotio-x-backend-v3-connections-dev"
  "emotio-x-backend-v3-forms-dev"
  "emotio-x-backend-v3-research-dev"
  "emotio-x-backend-v3-thank-you-screens-dev"
  "emotio-x-backend-v3-users-dev"
  "emotiox-backend-dev-rate-limit"
  "emotiox-backend-dev-token-blacklist"
  "emotiox-backend-dev-websocket-connections"
  "emotioxv2-backend-eye-tracking-recruit-config-dev"
  "emotioxv2-backend-eye-tracking-recruit-participant-dev"
  "emotioxv2-backend-participants-dev"
  "emotioxv2-backend-recruitment-link-dev"
  "emotioxv2-backend-table-dev"
)

# Procesar cada tabla excepto la de usuarios
for TABLE in "${TABLES[@]}"; do
  echo "🗑️ Limpiando tabla: $TABLE"
  
  # Obtener la clave primaria de la tabla
  PRIMARY_KEYS=$(aws dynamodb describe-table --table-name "$TABLE" --query "Table.KeySchema[*].AttributeName" --output text 2>/dev/null)
  
  # Si obtenemos las claves primarias, procedemos a eliminar los elementos
  if [ ! -z "$PRIMARY_KEYS" ]; then
    echo "  🔑 Claves primarias identificadas: $PRIMARY_KEYS"
    
    # Obtener todos los elementos
    ITEMS=$(aws dynamodb scan --table-name "$TABLE" --attributes-to-get $PRIMARY_KEYS --output json 2>/dev/null)
    
    # Ver cuántos elementos hay
    COUNT=$(echo "$ITEMS" | jq '.Count')
    echo "  📊 Elementos encontrados: $COUNT"
    
    # Si hay elementos, mostrar algunos para verificación
    if [ "$COUNT" -gt 0 ]; then
      echo "  🔍 Primeros elementos (para verificación):"
      echo "$ITEMS" | jq '.Items[0:2]'
      
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
        aws dynamodb delete-item --table-name "$TABLE" --key "$KEY_JSON" > /dev/null 2>&1
        echo -n "."
      done
      echo " ✅"
    else
      echo "  ℹ️ La tabla está vacía, no es necesario limpiarla"
    fi
  else
    echo "  ⚠️ No se pudo acceder a la tabla o no se pudieron identificar las claves primarias, omitiendo"
  fi
done

# Manejo especial para la tabla de usuarios
echo "👤 Procesando tabla de usuarios (emotioxv2-backend-users-dev)..."

# Eliminar todos los usuarios excepto clemente@gmail.com
USERS=$(aws dynamodb scan --table-name emotioxv2-backend-users-dev --output json 2>/dev/null)

# Contar usuarios
USER_COUNT=$(echo "$USERS" | jq '.Count')
echo "  📊 Usuarios encontrados: $USER_COUNT"

# Mostrar usuario que se conservará
echo "  👤 Se conservará el usuario:"
aws dynamodb scan --table-name emotioxv2-backend-users-dev --filter-expression "email = :email" --expression-attribute-values '{":email": {"S": "clemente@gmail.com"}}' --output json | jq '.Items[0] | {id: .id.S, email: .email.S, name: .name.S, role: .role.S}'

# Eliminar los demás usuarios
echo "  🗑️ Eliminando otros usuarios..."
echo "$USERS" | jq -c '.Items[] | select(.email.S != "clemente@gmail.com")' | while read -r USER; do
  USER_ID=$(echo "$USER" | jq -r '.id.S')
  USER_EMAIL=$(echo "$USER" | jq -r '.email.S')
  
  if [ ! -z "$USER_ID" ]; then
    echo "    🗑️ Eliminando usuario: $USER_EMAIL ($USER_ID)"
    aws dynamodb delete-item --table-name emotioxv2-backend-users-dev --key "{\"id\": {\"S\": \"$USER_ID\"}}" > /dev/null 2>&1
  fi
done

echo "✅ Limpieza completada."
echo "⚠️ Usuario clemente@gmail.com preservado."
echo "📝 Backup guardado en: clemente_user_backup.json" 