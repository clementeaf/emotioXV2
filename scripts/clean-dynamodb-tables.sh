#!/bin/bash

# 🧹 SCRIPT PARA LIMPIAR TABLAS DYNAMODB
# Elimina todo el contenido de las tablas participants y module-responses

set -e  # Salir si hay algún error

# Configuración
REGION="us-east-1"
PARTICIPANTS_TABLE="emotioxv2-backend-participants-dev"
MODULE_RESPONSES_TABLE="emotioxv2-backend-module-responses-dev"

echo "🧹 LIMPIANDO TABLAS DYNAMODB"
echo "============================="
echo ""
echo "📋 Tablas a limpiar:"
echo "  - Participants: $PARTICIPANTS_TABLE"
echo "  - Module Responses: $MODULE_RESPONSES_TABLE"
echo "  - Región: $REGION"
echo ""

# Función para limpiar una tabla
clean_table() {
    local table_name=$1
    local table_display_name=$2

    echo "🧹 Limpiando tabla: $table_display_name"
    echo "----------------------------------------"

    # Verificar que la tabla existe
    if ! aws dynamodb describe-table --table-name "$table_name" --region "$REGION" >/dev/null 2>&1; then
        echo "❌ Error: La tabla $table_name no existe"
        return 1
    fi

    # Contar registros antes de eliminar
    echo "📊 Contando registros existentes..."
    local count_before=$(aws dynamodb scan --table-name "$table_name" --region "$REGION" --select COUNT --query 'Count' --output text)
    echo "   Registros encontrados: $count_before"

    if [ "$count_before" -eq 0 ]; then
        echo "✅ La tabla $table_display_name ya está vacía"
        return 0
    fi

    # Escanear y eliminar todos los registros
    echo "🗑️  Eliminando registros..."
    local deleted_count=0

    # Procesar en lotes para evitar límites de AWS CLI
    while true; do
        # Obtener un lote de registros
        local scan_result=$(aws dynamodb scan \
            --table-name "$table_name" \
            --region "$REGION" \
            --max-items 25 \
            --query 'Items[].id.S' \
            --output text)

        if [ -z "$scan_result" ] || [ "$scan_result" = "None" ]; then
            break
        fi

        # Eliminar cada registro del lote
        for id in $scan_result; do
            if [ "$id" != "None" ] && [ -n "$id" ]; then
                aws dynamodb delete-item \
                    --table-name "$table_name" \
                    --region "$REGION" \
                    --key "{\"id\":{\"S\":\"$id\"}}" \
                    --output text >/dev/null 2>&1

                deleted_count=$((deleted_count + 1))
                echo -n "."
            fi
        done
    done

    echo ""
    echo "✅ Eliminados $deleted_count registros de $table_display_name"

    # Verificar que la tabla está vacía
    local count_after=$(aws dynamodb scan --table-name "$table_name" --region "$REGION" --select COUNT --query 'Count' --output text)
    echo "📊 Registros restantes: $count_after"

    if [ "$count_after" -eq 0 ]; then
        echo "✅ Tabla $table_display_name limpiada completamente"
    else
        echo "⚠️  Aún quedan $count_after registros en $table_display_name"
    fi

    echo ""
}

# Confirmar antes de proceder
echo "⚠️  ADVERTENCIA: Esta operación eliminará TODOS los datos de las tablas."
echo "   Esta acción NO se puede deshacer."
echo ""
read -p "¿Estás seguro de que quieres continuar? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operación cancelada"
    exit 1
fi

echo "🚀 Iniciando limpieza..."
echo ""

# Limpiar tabla de participantes
clean_table "$PARTICIPANTS_TABLE" "Participants"

# Limpiar tabla de module-responses
clean_table "$MODULE_RESPONSES_TABLE" "Module Responses"

echo "🎉 LIMPIEZA COMPLETADA"
echo "====================="
echo ""
echo "✅ Ambas tablas han sido limpiadas completamente"
echo ""
echo "📋 Resumen:"
echo "  - Tabla Participants: $PARTICIPANTS_TABLE"
echo "  - Tabla Module Responses: $MODULE_RESPONSES_TABLE"
echo "  - Región: $REGION"
echo ""
echo "🔍 Para verificar, puedes ejecutar:"
echo "  aws dynamodb scan --table-name $PARTICIPANTS_TABLE --region $REGION --select COUNT"
echo "  aws dynamodb scan --table-name $MODULE_RESPONSES_TABLE --region $REGION --select COUNT"
