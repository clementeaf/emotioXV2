#!/bin/bash

# 🔄 SCRIPT DE SINCRONIZACIÓN DE ENDPOINTS DINÁMICOS
# Este script sincroniza los endpoints generados por backendV2 con config/endpoints/
# para mantener una configuración centralizada y actualizada

set -e

# Configuración
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONFIG_ENDPOINTS_DIR="$PROJECT_ROOT/config/endpoints"
BACKEND_DIR="$PROJECT_ROOT/backendV2"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Función para mostrar ayuda
show_help() {
    echo "🔄 Script de Sincronización de Endpoints Dinámicos"
    echo ""
    echo "Uso: $0 [OPCIONES]"
    echo ""
    echo "Opciones:"
    echo "  -h, --help          Mostrar esta ayuda"
    echo "  -f, --force         Forzar sincronización sin caché"
    echo "  -v, --verbose       Mostrar información detallada"
    echo "  --stage STAGE       Especificar etapa (dev, prod, etc.)"
    echo "  --api-url URL       Especificar URL de API manualmente"
    echo "  --ws-url URL        Especificar URL de WebSocket manualmente"
    echo ""
    echo "Ejemplos:"
    echo "  $0                    # Sincronización normal"
    echo "  $0 --stage prod      # Sincronización para producción"
    echo "  $0 --force           # Forzar sincronización completa"
}

# Variables por defecto
FORCE_SYNC=false
VERBOSE=false
STAGE="dev"
API_URL=""
WS_URL=""

# Parsear argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -f|--force)
            FORCE_SYNC=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --stage)
            STAGE="$2"
            shift 2
            ;;
        --api-url)
            API_URL="$2"
            shift 2
            ;;
        --ws-url)
            WS_URL="$2"
            shift 2
            ;;
        *)
            log_error "Opción desconocida: $1"
            show_help
            exit 1
            ;;
    esac
done

# Verificar que estamos en el directorio correcto
if [[ ! -d "$BACKEND_DIR" ]]; then
    log_error "No se encontró el directorio backendV2 en: $BACKEND_DIR"
    exit 1
fi

if [[ ! -d "$CONFIG_ENDPOINTS_DIR" ]]; then
    log_error "No se encontró el directorio config/endpoints en: $CONFIG_ENDPOINTS_DIR"
    exit 1
fi

log_info "🔄 Iniciando sincronización de endpoints dinámicos..."
log_info "📁 Directorio de configuración: $CONFIG_ENDPOINTS_DIR"
log_info "🚀 Backend directory: $BACKEND_DIR"
log_info "🏷️  Etapa: $STAGE"

# Verificar si backendV2 tiene las dependencias necesarias
if [[ ! -f "$BACKEND_DIR/package.json" ]]; then
    log_error "No se encontró package.json en backendV2"
    exit 1
fi

# Verificar si el script de exportación existe
if [[ ! -f "$BACKEND_DIR/src/utils/endpoints-exporter.ts" ]]; then
    log_error "No se encontró el script de exportación en backendV2/src/utils/endpoints-exporter.ts"
    exit 1
fi

# Función para exportar endpoints
export_endpoints() {
    local output_file="$CONFIG_ENDPOINTS_DIR/dynamic-endpoints.js"

    log_info "📤 Exportando endpoints a: $output_file"

    # Variables de entorno para la exportación
    local env_vars=""
    if [[ -n "$API_URL" ]]; then
        env_vars="$env_vars API_ENDPOINT=$API_URL"
    fi
    if [[ -n "$WS_URL" ]]; then
        env_vars="$env_vars WEBSOCKET_ENDPOINT=$WS_URL"
    fi
    env_vars="$env_vars STAGE=$STAGE"

    # Ejecutar exportación
    if [[ "$VERBOSE" == "true" ]]; then
        log_info "Ejecutando: $env_vars npx ts-node $BACKEND_DIR/src/utils/endpoints-exporter.ts $output_file"
    fi

    cd "$BACKEND_DIR"
    eval "$env_vars npx ts-node src/utils/endpoints-exporter.ts $output_file"

    if [[ $? -eq 0 ]]; then
        log_success "✅ Endpoints exportados exitosamente"
    else
        log_error "❌ Error al exportar endpoints"
        exit 1
    fi
}

# Función para generar configuración centralizada
generate_centralized_config() {
    local config_file="$CONFIG_ENDPOINTS_DIR/centralized-config.ts"

    log_info "📝 Generando configuración centralizada: $config_file"

    # Leer endpoints exportados
    if [[ ! -f "$CONFIG_ENDPOINTS_DIR/dynamic-endpoints.js" ]]; then
        log_error "No se encontró el archivo de endpoints exportados"
        exit 1
    fi

    # Extraer URLs del archivo exportado
    local http_url=$(grep -o 'http: "[^"]*"' "$CONFIG_ENDPOINTS_DIR/dynamic-endpoints.js" | cut -d'"' -f2)
    local ws_url=$(grep -o 'ws: "[^"]*"' "$CONFIG_ENDPOINTS_DIR/dynamic-endpoints.js" | cut -d'"' -f2)
    local stage_val=$(grep -o 'stage: "[^"]*"' "$CONFIG_ENDPOINTS_DIR/dynamic-endpoints.js" | cut -d'"' -f2)

    if [[ -z "$http_url" ]]; then
        log_warning "No se pudo extraer HTTP URL, usando valor por defecto"
        http_url="https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev"
    fi

    if [[ -z "$ws_url" ]]; then
        log_warning "No se pudo extraer WebSocket URL, usando valor por defecto"
        ws_url="wss://w8dj7wxnl9.execute-api.us-east-1.amazonaws.com/dev"
    fi

    if [[ -z "$stage_val" ]]; then
        stage_val="$STAGE"
    fi

    # Generar archivo de configuración centralizada
    cat > "$config_file" << EOF
/**
 * 🔄 CONFIGURACIÓN CENTRALIZADA DE ENDPOINTS - EmotioXV2
 *
 * Este archivo es generado automáticamente por el script de sincronización.
 * NO MODIFICAR MANUALMENTE - Los cambios se sobrescribirán en la próxima sincronización.
 *
 * Generado: $(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
 * Etapa: $stage_val
 */

export const CENTRALIZED_API_CONFIG = {
  http: "$http_url",
  ws: "$ws_url",
  stage: "$stage_val",
  frontend: "http://localhost:3000",
  publicTests: "http://localhost:4700",
  generatedAt: "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")"
};

export const API_HTTP_ENDPOINT = "$http_url";
export const API_WEBSOCKET_ENDPOINT = "$ws_url";
export const API_STAGE = "$stage_val";

// Función para obtener URL completa de una ruta
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return \`\${API_HTTP_ENDPOINT}/\${cleanPath}\`;
}

// Función para obtener URL de WebSocket
export function getWebsocketUrl(): string {
  return API_WEBSOCKET_ENDPOINT;
}

// Función para obtener URL de public-tests
export function getPublicTestsUrl(): string {
  return CENTRALIZED_API_CONFIG.publicTests;
}

// Función para navegar a public-tests
export function navigateToPublicTests(researchID: string): void {
  const url = \`\${getPublicTestsUrl()}/\${researchID}\`;
  window.open(url, '_blank');
}

export default CENTRALIZED_API_CONFIG;
EOF

    log_success "✅ Configuración centralizada generada"
}

# Función para generar archivo de estado
generate_status_file() {
    local status_file="$CONFIG_ENDPOINTS_DIR/sync-status.json"

    log_info "📊 Generando archivo de estado: $status_file"

    cat > "$status_file" << EOF
{
  "lastSync": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")",
  "stage": "$STAGE",
  "forceSync": $FORCE_SYNC,
  "verbose": $VERBOSE,
  "filesGenerated": [
    "dynamic-endpoints.js",
    "centralized-config.ts",
    "sync-status.json"
  ],
  "backendVersion": "$(cd "$BACKEND_DIR" && node -p "require('./package.json').version" 2>/dev/null || echo 'unknown')",
  "projectRoot": "$PROJECT_ROOT",
  "configDir": "$CONFIG_ENDPOINTS_DIR"
}
EOF

    log_success "✅ Archivo de estado generado"
}

# Función para verificar archivos generados
verify_generated_files() {
    log_info "🔍 Verificando archivos generados..."

    local files=(
        "$CONFIG_ENDPOINTS_DIR/dynamic-endpoints.js"
        "$CONFIG_ENDPOINTS_DIR/centralized-config.ts"
        "$CONFIG_ENDPOINTS_DIR/sync-status.json"
    )

    local all_exist=true

    for file in "${files[@]}"; do
        if [[ -f "$file" ]]; then
            log_success "✅ $file"
        else
            log_error "❌ $file - NO ENCONTRADO"
            all_exist=false
        fi
    done

    if [[ "$all_exist" == "true" ]]; then
        log_success "✅ Todos los archivos generados correctamente"
    else
        log_error "❌ Algunos archivos no se generaron correctamente"
        exit 1
    fi
}

# Función para mostrar información de los endpoints
show_endpoints_info() {
    if [[ "$VERBOSE" == "true" ]]; then
        log_info "📋 Información de endpoints generados:"

        if [[ -f "$CONFIG_ENDPOINTS_DIR/dynamic-endpoints.js" ]]; then
            echo "   HTTP URL: $(grep -o 'http: "[^"]*"' "$CONFIG_ENDPOINTS_DIR/dynamic-endpoints.js" | cut -d'"' -f2)"
            echo "   WS URL: $(grep -o 'ws: "[^"]*"' "$CONFIG_ENDPOINTS_DIR/dynamic-endpoints.js" | cut -d'"' -f2)"
            echo "   Stage: $(grep -o 'stage: "[^"]*"' "$CONFIG_ENDPOINTS_DIR/dynamic-endpoints.js" | cut -d'"' -f2)"
        fi

        if [[ -f "$CONFIG_ENDPOINTS_DIR/sync-status.json" ]]; then
            echo "   Last Sync: $(jq -r '.lastSync' "$CONFIG_ENDPOINTS_DIR/sync-status.json" 2>/dev/null || echo 'N/A')"
        fi
    fi
}

# Función principal
main() {
    log_info "🚀 Iniciando sincronización de endpoints dinámicos..."

    # Exportar endpoints
    export_endpoints

    # Generar configuración centralizada
    generate_centralized_config

    # Generar archivo de estado
    generate_status_file

    # Verificar archivos generados
    verify_generated_files

    # Mostrar información si es verbose
    show_endpoints_info

    log_success "🎉 Sincronización completada exitosamente!"
    log_info "📁 Archivos generados en: $CONFIG_ENDPOINTS_DIR"
    log_info "🔄 Para sincronizar automáticamente, ejecuta este script periódicamente"
}

# Ejecutar función principal
main "$@"
