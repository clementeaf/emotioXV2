#!/bin/bash

# Script para crear la tabla ModuleResponses en producción
# Este script crea la tabla con todos los índices necesarios para que funcione el backend

echo "🔧 CREANDO TABLA MODULE-RESPONSES EN PRODUCCIÓN"
echo "=============================================="

# Configuración
TABLE_NAME="emotioxv2-backend-module-responses-dev"
REGION="us-east-1"

echo "📋 Configuración:"
echo "  - Tabla: $TABLE_NAME"
echo "  - Región: $REGION"
echo ""

# Crear la tabla usando el archivo JSON
echo "📝 Creando tabla..."
aws dynamodb create-table \
    --cli-input-json file://create-module-responses-table.json \
    --region "$REGION"

echo "⏳ Esperando a que la tabla se cree..."
aws dynamodb wait table-exists --table-name "$TABLE_NAME" --region "$REGION"
echo "✅ Tabla $TABLE_NAME creada exitosamente"

echo ""
echo "🎯 VERIFICACIÓN FINAL"
echo "===================="

# Verificar que la tabla existe y tiene los índices correctos
echo "🔍 Verificando tabla y índices..."
TABLE_INFO=$(aws dynamodb describe-table --table-name "$TABLE_NAME" --region "$REGION")

echo "📊 Estado de la tabla:"
echo "$TABLE_INFO" | jq -r '.Table.TableStatus'

echo ""
echo "📋 Índices configurados:"
echo "$TABLE_INFO" | jq -r '.Table.GlobalSecondaryIndexes[]?.IndexName // "Ninguno"'

echo ""
echo "✅ PROCESO COMPLETADO"
echo "===================="
echo "La tabla $TABLE_NAME está lista para usar con el backend."
