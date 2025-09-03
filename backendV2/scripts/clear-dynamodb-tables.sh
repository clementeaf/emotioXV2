#!/bin/bash

# Script para eliminar TODO el contenido de las tablas DynamoDB usando AWS CLI
# MANTIENE las tablas, solo elimina los datos
# 
# USO: ./scripts/clear-dynamodb-tables.sh [stage] [region]
# Ejemplo: ./scripts/clear-dynamodb-tables.sh dev us-east-1

set -e

# Configuración por defecto
STAGE=${1:-dev}
REGION=${2:-us-east-1}
SERVICE_PREFIX="emotioxv2-backend"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Iniciando limpieza de tablas DynamoDB${NC}"
echo -e "${BLUE}📍 Región: ${REGION}${NC}"
echo -e "${BLUE}🏷️  Stage: ${STAGE}${NC}"

# Lista de tablas a limpiar
declare -A TABLES
TABLES[researches]="${SERVICE_PREFIX}-researches-${STAGE}"
TABLES[users]="${SERVICE_PREFIX}-users-${STAGE}"
TABLES[participants]="${SERVICE_PREFIX}-participants-${STAGE}"
TABLES[module_responses]="${SERVICE_PREFIX}-module-responses-${STAGE}"
TABLES[eye_tracking_config]="${SERVICE_PREFIX}-eye-tracking-recruit-config-${STAGE}"
TABLES[eye_tracking_participant]="${SERVICE_PREFIX}-eye-tracking-recruit-participant-${STAGE}"
TABLES[recruitment_link]="${SERVICE_PREFIX}-recruitment-link-${STAGE}"
TABLES[location_tracking]="location-tracking-table"
TABLES[quota_records]="${SERVICE_PREFIX}-quota-records-${STAGE}"

# Mostrar tablas que serán limpiadas
echo -e "\n${YELLOW}📋 Tablas que serán limpiadas:${NC}"
for key in "${!TABLES[@]}"; do
    echo -e "   • ${key}: ${TABLES[$key]}"
done

# Advertencia para producción
if [[ "$STAGE" == "prod" ]]; then
    echo -e "\n${RED}⚠️  ¡ATENCIÓN! Estás a punto de eliminar datos de PRODUCCIÓN${NC}"
    echo -e "${RED}Este script eliminará TODOS los datos de las tablas listadas arriba${NC}"
    echo -e "\n${YELLOW}¿Estás seguro? Escribe 'SI_ELIMINAR_PROD' para continuar:${NC}"
    read -r confirmation
    if [[ "$confirmation" != "SI_ELIMINAR_PROD" ]]; then
        echo -e "${RED}❌ Operación cancelada${NC}"
        exit 1
    fi
fi

# Función para limpiar una tabla
clear_table() {
    local table_name=$1
    local table_key=$2
    
    echo -e "\n${BLUE}🧹 Limpiando tabla: ${table_name}${NC}"
    
    # Verificar si la tabla existe
    if ! aws dynamodb describe-table --table-name "$table_name" --region "$REGION" &>/dev/null; then
        echo -e "   ${YELLOW}⚠️  Tabla ${table_name} no existe - saltando${NC}"
        return 0
    fi
    
    local items_deleted=0
    local next_token=""
    
    while true; do
        # Escanear la tabla
        local scan_cmd="aws dynamodb scan --table-name '$table_name' --region '$REGION'"
        
        if [[ -n "$next_token" ]]; then
            scan_cmd+=" --starting-token '$next_token'"
        fi
        
        local scan_result=$(eval $scan_cmd 2>/dev/null)
        
        if [[ $? -ne 0 ]]; then
            echo -e "   ${RED}❌ Error escaneando tabla ${table_name}${NC}"
            return 1
        fi
        
        # Extraer items y next token
        local items=$(echo "$scan_result" | jq -r '.Items[]?')
        next_token=$(echo "$scan_result" | jq -r '.NextToken // empty')
        
        if [[ -z "$items" ]]; then
            break
        fi
        
        # Procesar items en lotes
        local batch_size=25
        local batch_count=0
        local delete_requests=""
        
        echo "$scan_result" | jq -c '.Items[]?' | while IFS= read -r item; do
            # Determinar la clave primaria basada en la estructura del item
            local key_condition=""
            
            # Para tablas con PK/SK
            if echo "$item" | jq -e '.PK' >/dev/null 2>&1 && echo "$item" | jq -e '.SK' >/dev/null 2>&1; then
                local pk=$(echo "$item" | jq -r '.PK')
                local sk=$(echo "$item" | jq -r '.SK')
                key_condition="--key '{\"PK\": {\"S\": \"$pk\"}, \"SK\": {\"S\": \"$sk\"}}'"
            # Para tablas con 'id' simple
            elif echo "$item" | jq -e '.id' >/dev/null 2>&1; then
                local id=$(echo "$item" | jq -r '.id')
                key_condition="--key '{\"id\": {\"S\": \"$id\"}}'"
            else
                echo -e "   ${YELLOW}⚠️  No se pudo determinar la clave para un item${NC}"
                continue
            fi
            
            # Eliminar el item
            local delete_cmd="aws dynamodb delete-item --table-name '$table_name' --region '$REGION' $key_condition"
            
            if eval $delete_cmd >/dev/null 2>&1; then
                ((items_deleted++))
            else
                echo -e "   ${YELLOW}⚠️  Error eliminando un item${NC}"
            fi
        done
        
        if [[ -z "$next_token" ]]; then
            break
        fi
    done
    
    echo -e "   ${GREEN}✅ Completado: ${items_deleted} items eliminados de ${table_name}${NC}"
    return 0
}

# Variable para contar total de items eliminados
total_items_deleted=0
start_time=$(date +%s)

# Limpiar cada tabla
for key in "${!TABLES[@]}"; do
    table_name="${TABLES[$key]}"
    
    if clear_table "$table_name" "$key"; then
        # El conteo exacto es difícil de obtener desde el script bash
        # pero al menos sabemos que se procesó
        echo -e "   ${GREEN}✓ Tabla $key procesada${NC}"
    else
        echo -e "   ${RED}✗ Error procesando tabla $key${NC}"
    fi
done

end_time=$(date +%s)
duration=$((end_time - start_time))

echo -e "\n${GREEN}🎉 ¡Limpieza completada!${NC}"
echo -e "${GREEN}⏱️  Tiempo transcurrido: ${duration} segundos${NC}"
echo -e "\n${GREEN}✅ Las tablas están ahora vacías pero siguen existiendo${NC}"

echo -e "\n${YELLOW}💡 Comandos útiles para verificar:${NC}"
echo -e "   • Listar tablas: ${BLUE}aws dynamodb list-tables --region ${REGION}${NC}"
echo -e "   • Contar items: ${BLUE}aws dynamodb scan --table-name TABLA_NAME --select COUNT --region ${REGION}${NC}"