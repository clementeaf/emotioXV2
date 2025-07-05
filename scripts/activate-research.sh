#!/bin/bash

# 🚀 Script para activar una investigación en DynamoDB
# Uso: bash scripts/activate-research.sh <research-id>

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de logging
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Verificar argumentos
if [ $# -eq 0 ]; then
    log_error "Uso: bash scripts/activate-research.sh <research-id>"
    log_info "Ejemplo: bash scripts/activate-research.sh 193b949e-9fac-f000-329b-e71bab5a9203"
    exit 1
fi

RESEARCH_ID="$1"
TABLE_NAME="emotioxv2-backend-table-dev"
REGION="us-east-1"

# Función principal
main() {
    echo ""
    log_info "🚀 Activando investigación: $RESEARCH_ID"
    echo ""

    # Verificar dependencias
    check_dependencies

    # Verificar que la investigación existe
    check_research_exists

    # Cambiar estado a 'active'
    activate_research

    # Verificar el cambio
    verify_status

    echo ""
    log_success "✅ Investigación activada exitosamente!"
    echo ""
}

# Verificar dependencias
check_dependencies() {
    log_info "Verificando dependencias..."

    # Verificar AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI no está instalado"
        exit 1
    fi

    # Verificar credenciales AWS
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS CLI no está configurado correctamente"
        exit 1
    fi

    log_success "Dependencias verificadas"
}

# Verificar que la investigación existe
check_research_exists() {
    log_info "Verificando que la investigación existe..."

    # Obtener la investigación actual
    local result=$(aws dynamodb get-item \
        --table-name "$TABLE_NAME" \
        --key "{\"id\":{\"S\":\"$RESEARCH_ID\"},\"sk\":{\"S\":\"RESEARCH#$RESEARCH_ID\"}}" \
        --region "$REGION" \
        --query 'Item' \
        2>/dev/null)

    if [ -z "$result" ] || [ "$result" = "null" ]; then
        log_error "La investigación $RESEARCH_ID no existe en la tabla $TABLE_NAME"
        exit 1
    fi

    # Extraer el estado actual
    local current_status=$(echo "$result" | jq -r '.status.S // "unknown"')
    log_info "Estado actual de la investigación: $current_status"

    if [ "$current_status" = "active" ]; then
        log_warning "La investigación ya está activa"
        exit 0
    fi

    log_success "Investigación encontrada"
}

# Cambiar estado a 'active'
activate_research() {
    log_info "Cambiando estado a 'active'..."

    # Actualizar el estado
    aws dynamodb update-item \
        --table-name "$TABLE_NAME" \
        --key "{\"id\":{\"S\":\"$RESEARCH_ID\"},\"sk\":{\"S\":\"RESEARCH#$RESEARCH_ID\"}}" \
        --update-expression "SET #status = :status, #updatedAt = :updatedAt" \
        --expression-attribute-names "{\"#status\":\"status\",\"#updatedAt\":\"updatedAt\"}" \
        --expression-attribute-values "{\":status\":{\"S\":\"active\"},\":updatedAt\":{\"S\":\"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\"}}" \
        --region "$REGION" \
        --return-values ALL_NEW > /dev/null

    log_success "Estado actualizado a 'active'"
}

# Verificar el cambio
verify_status() {
    log_info "Verificando el cambio..."

    # Obtener la investigación actualizada
    local result=$(aws dynamodb get-item \
        --table-name "$TABLE_NAME" \
        --key "{\"id\":{\"S\":\"$RESEARCH_ID\"},\"sk\":{\"S\":\"RESEARCH#$RESEARCH_ID\"}}" \
        --region "$REGION" \
        --query 'Item.status.S' \
        --output text)

    if [ "$result" = "active" ]; then
        log_success "Estado verificado: $result"
    else
        log_error "Error: El estado no se actualizó correctamente. Estado actual: $result"
        exit 1
    fi
}

# Ejecutar función principal
main
