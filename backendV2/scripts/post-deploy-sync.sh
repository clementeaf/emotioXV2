#!/bin/bash

# 🚀 SCRIPT DE SINCRONIZACIÓN POST-DEPLOY - EmotioXV2
# Se ejecuta automáticamente después del deploy del backend para sincronizar endpoints

set -e

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

# Configuración
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$BACKEND_DIR/.." && pwd)"
STAGE=${STAGE:-"dev"}

# Función principal
main() {
    echo ""
    log_info "🚀 Iniciando sincronización post-deploy..."
    log_info "📁 Proyecto: $PROJECT_ROOT"
    log_info "🏷️  Etapa: $STAGE"
    echo ""

    # Verificar que estamos en el contexto correcto
    verify_context

    # Obtener endpoints del deployment
    get_deployment_endpoints

    # Sincronizar con frontend
    sync_frontend_endpoints

    # Sincronizar con public-tests
    sync_public_tests_endpoints

    # Actualizar configuración centralizada
    update_centralized_config

    # Actualizar configuraciones CORS
    update_cors_config

    # Mostrar resumen
    show_sync_summary

    echo ""
    log_success "✅ Sincronización post-deploy completada exitosamente!"
    echo ""
}

# Verificar contexto
verify_context() {
    log_info "🔍 Verificando contexto del proyecto..."

    # Verificar que estamos en backendV2
    if [[ ! -f "$BACKEND_DIR/serverless.yml" ]]; then
        log_error "No se encontró serverless.yml en el directorio backend"
        exit 1
    fi

    # Verificar que existen los directorios de frontend y public-tests
    if [[ ! -d "$PROJECT_ROOT/frontend" ]]; then
        log_error "No se encontró el directorio frontend"
        exit 1
    fi

    if [[ ! -d "$PROJECT_ROOT/public-tests" ]]; then
        log_error "No se encontró el directorio public-tests"
        exit 1
    fi

    log_success "Contexto verificado correctamente"
}

# Obtener endpoints del deployment
get_deployment_endpoints() {
    log_info "📡 Obteniendo endpoints del deployment..."

    cd "$BACKEND_DIR"

    # Obtener información del stack
    if command -v sls &> /dev/null; then
        # Obtener endpoints usando serverless info
        STACK_INFO=$(sls info --stage "$STAGE" 2>/dev/null || echo "")

        if [[ -n "$STACK_INFO" ]]; then
            HTTP_ENDPOINT=$(echo "$STACK_INFO" | grep -E "HttpApiUrl:" | awk '{print $2}' || echo "")
            WS_ENDPOINT=$(echo "$STACK_INFO" | grep -E "WebsocketApiUrl:" | awk '{print $2}' || echo "")
        fi
    fi

    # Fallback: leer desde endpoints-output.json si existe
    if [[ (-z "$HTTP_ENDPOINT" || -z "$WS_ENDPOINT") && -f "$BACKEND_DIR/endpoints-output.json" ]]; then
        log_info "Leyendo endpoints desde endpoints-output.json..."

        if command -v jq &> /dev/null; then
            HTTP_ENDPOINT=$(jq -r '.HttpApiUrl // empty' "$BACKEND_DIR/endpoints-output.json" 2>/dev/null || echo "")
            WS_ENDPOINT=$(jq -r '.WebsocketApiUrl // empty' "$BACKEND_DIR/endpoints-output.json" 2>/dev/null || echo "")
        else
            # Fallback sin jq
            HTTP_ENDPOINT=$(grep -o 'HttpApiUrl = "[^"]*"' "$BACKEND_DIR/endpoints-output.json" | cut -d'"' -f2 || echo "")
            WS_ENDPOINT=$(grep -o 'WebsocketApiUrl = "[^"]*"' "$BACKEND_DIR/endpoints-output.json" | cut -d'"' -f2 || echo "")
        fi
    fi

    # Fallback: usar AWS CLI si está disponible
    if [[ ( -z "$HTTP_ENDPOINT" || -z "$WS_ENDPOINT" ) && -n "$(command -v aws)" ]]; then
        log_info "Obteniendo endpoints usando AWS CLI..."

        STACK_NAME="emotioxv2-backend-${STAGE}"
        HTTP_ENDPOINT=$(aws cloudformation describe-stacks \
            --stack-name "$STACK_NAME" \
            --query "Stacks[0].Outputs[?OutputKey=='HttpApiUrl'].OutputValue" \
            --output text 2>/dev/null || echo "")

        WS_ENDPOINT=$(aws cloudformation describe-stacks \
            --stack-name "$STACK_NAME" \
            --query "Stacks[0].Outputs[?OutputKey=='WebsocketApiUrl'].OutputValue" \
            --output text 2>/dev/null || echo "")
    fi

    # Verificar que obtuvimos los endpoints
    if [[ -z "$HTTP_ENDPOINT" ]]; then
        # Si estamos en modo de prueba, usar endpoints de prueba
        if [[ "$STAGE" == "test" ]]; then
            log_warning "Modo de prueba detectado, usando endpoints simulados"
            HTTP_ENDPOINT="https://test123.execute-api.us-east-1.amazonaws.com/dev"
            WS_ENDPOINT="wss://test456.execute-api.us-east-1.amazonaws.com/dev"
        else
            log_error "No se pudo obtener el endpoint HTTP del deployment"
            exit 1
        fi
    fi

    log_success "HTTP API: $HTTP_ENDPOINT"
    if [[ -n "$WS_ENDPOINT" ]]; then
        log_success "WebSocket API: $WS_ENDPOINT"
    else
        log_warning "WebSocket API no disponible"
        WS_ENDPOINT=""
    fi

    # Exportar para uso en otras funciones
    export HTTP_ENDPOINT
    export WS_ENDPOINT
}

# Sincronizar endpoints con frontend
sync_frontend_endpoints() {
    log_info "🖥️  Sincronizando endpoints con frontend..."

    local frontend_endpoints_file="$PROJECT_ROOT/frontend/src/api/dynamic-endpoints.ts"

    # Crear directorio si no existe
    mkdir -p "$(dirname "$frontend_endpoints_file")"

    # Generar archivo de endpoints para frontend
    cat > "$frontend_endpoints_file" << EOF
// ARCHIVO GENERADO AUTOMÁTICAMENTE POR POST-DEPLOY SYNC
// NO MODIFICAR MANUALMENTE - Se sobrescribe en cada deploy
// Generado: $(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
// Stage: $STAGE

/**
 * 🔄 Endpoints dinámicos exportados desde AWS Lambda
 * Sincronizado automáticamente después del deploy del backend
 */

// 🎯 DETECTAR SI ESTAMOS EN DESARROLLO LOCAL
const isDevelopment = typeof window !== 'undefined'
  ? window.location.hostname === 'localhost'
  : process.env.NODE_ENV === 'development';

// Endpoints de API exportados desde backend
export const DYNAMIC_API_ENDPOINTS = {
  // Endpoint HTTP API
  http: isDevelopment
    ? "http://localhost:3000"
    : "$HTTP_ENDPOINT",

  // Endpoint WebSocket
  ws: isDevelopment
    ? "ws://localhost:3001"
    : "$WS_ENDPOINT",

  // Etapa de despliegue (dev, prod, etc.)
  stage: "$STAGE",

  // Metadata de sincronización
  syncedAt: "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")",
  syncedFromStage: "$STAGE"
};

// URLs de desarrollo local
export const LOCAL_URLS = {
  "frontend": "http://localhost:3000",
  "publicTests": "http://localhost:4700",
  "generatedAt": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")"
};

// Constantes para uso más fácil
export const API_HTTP_ENDPOINT = DYNAMIC_API_ENDPOINTS.http;
export const API_WEBSOCKET_ENDPOINT = DYNAMIC_API_ENDPOINTS.ws;

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
  return LOCAL_URLS.publicTests;
}

// Función para navegar a public-tests con researchID
export function navigateToPublicTests(researchID: string): void {
  const url = \`\${getPublicTestsUrl()}/\${researchID}\`;
  window.open(url, '_blank');
}

// Función para verificar si los endpoints están sincronizados
export function isEndpointsSynced(): boolean {
  return !isDevelopment && API_HTTP_ENDPOINT.includes('execute-api.us-east-1.amazonaws.com');
}

// Versión default para import default
export default DYNAMIC_API_ENDPOINTS;
EOF

    log_success "✅ Endpoints del frontend sincronizados"
}

# Sincronizar endpoints con public-tests
sync_public_tests_endpoints() {
    log_info "📱 Sincronizando endpoints con public-tests..."

    local public_tests_endpoints_file="$PROJECT_ROOT/public-tests/src/config/dynamic-endpoints.ts"

    # Crear directorio si no existe
    mkdir -p "$(dirname "$public_tests_endpoints_file")"

    # Generar archivo de endpoints para public-tests
    cat > "$public_tests_endpoints_file" << EOF
// ARCHIVO GENERADO AUTOMÁTICAMENTE POR POST-DEPLOY SYNC
// NO MODIFICAR MANUALMENTE - Se sobrescribe en cada deploy
// Generado: $(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
// Stage: $STAGE

/**
 * 🔄 Endpoints dinámicos exportados desde AWS Lambda
 * Sincronizado automáticamente después del deploy del backend
 */

// 🎯 DETECTAR SI ESTAMOS EN DESARROLLO LOCAL
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';

// Endpoints de API exportados desde backend
export const DYNAMIC_API_ENDPOINTS = {
  // Endpoint HTTP API
  http: isDevelopment
    ? "http://localhost:3000"
    : "$HTTP_ENDPOINT",

  // Endpoint WebSocket
  ws: isDevelopment
    ? "ws://localhost:3001"
    : "$WS_ENDPOINT",

  // Etapa de despliegue (dev, prod, etc.)
  stage: "$STAGE",

  // Metadata de sincronización
  syncedAt: "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")",
  syncedFromStage: "$STAGE"
};

// URLs de desarrollo local
export const LOCAL_URLS = {
  "frontend": "http://localhost:3000",
  "publicTests": "http://localhost:4700",
  "generatedAt": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")"
};

// Constantes para uso más fácil
export const API_HTTP_ENDPOINT = DYNAMIC_API_ENDPOINTS.http;
export const API_WEBSOCKET_ENDPOINT = DYNAMIC_API_ENDPOINTS.ws;

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
  return LOCAL_URLS.publicTests;
}

// Función para navegar a public-tests con researchID
export function navigateToPublicTests(researchID: string): void {
  const url = \`\${getPublicTestsUrl()}/\${researchID}\`;
  window.open(url, '_blank');
}

// Función para verificar si los endpoints están sincronizados
export function isEndpointsSynced(): boolean {
  return !isDevelopment && API_HTTP_ENDPOINT.includes('execute-api.us-east-1.amazonaws.com');
}

// Versión default para import default
export default DYNAMIC_API_ENDPOINTS;
EOF

    log_success "✅ Endpoints de public-tests sincronizados"
}

# Actualizar configuración centralizada
update_centralized_config() {
    log_info "🔄 Actualizando configuración centralizada..."

    local centralized_config_file="$PROJECT_ROOT/config/endpoints/centralized-config.ts"

    # Crear directorio si no existe
    mkdir -p "$(dirname "$centralized_config_file")"

    # Generar configuración centralizada actualizada
    cat > "$centralized_config_file" << EOF
/**
 * 🔄 CONFIGURACIÓN CENTRALIZADA DE ENDPOINTS - EmotioXV2
 *
 * Este archivo es generado automáticamente por el script post-deploy.
 * NO MODIFICAR MANUALMENTE - Los cambios se sobrescribirán en el próximo deploy.
 *
 * Generado: $(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
 * Etapa: $STAGE
 * Backend Deployed: $HTTP_ENDPOINT
 */

export const CENTRALIZED_API_CONFIG = {
  http: "$HTTP_ENDPOINT",
  ws: "$WS_ENDPOINT",
  stage: "$STAGE",
  frontend: "http://localhost:3000",
  publicTests: "http://localhost:4700",
  generatedAt: "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")",
  deployedEndpoint: "$HTTP_ENDPOINT",
  syncMethod: "post-deploy-script"
};

export const API_HTTP_ENDPOINT = "$HTTP_ENDPOINT";
export const API_WEBSOCKET_ENDPOINT = "$WS_ENDPOINT";
export const API_STAGE = "$STAGE";

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

// Función para verificar sincronización
export function isEndpointsSynced(): boolean {
  return API_HTTP_ENDPOINT.includes('execute-api.us-east-1.amazonaws.com');
}

export default CENTRALIZED_API_CONFIG;
EOF

    # Crear archivo de estado de sincronización
    local sync_status_file="$PROJECT_ROOT/config/endpoints/sync-status.json"
    cat > "$sync_status_file" << EOF
{
  "lastSync": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")",
  "stage": "$STAGE",
  "httpEndpoint": "$HTTP_ENDPOINT",
  "wsEndpoint": "$WS_ENDPOINT",
  "syncMethod": "post-deploy-script",
  "filesUpdated": [
    "frontend/src/api/dynamic-endpoints.ts",
    "public-tests/src/config/dynamic-endpoints.ts",
    "config/endpoints/centralized-config.ts",
    "config/endpoints/sync-status.json"
  ],
  "backendVersion": "$(cd "$BACKEND_DIR" && node -p "require('./package.json').version" 2>/dev/null || echo 'unknown')",
  "projectRoot": "$PROJECT_ROOT"
}
EOF

    log_success "✅ Configuración centralizada actualizada"
}

# Actualizar configuraciones CORS
update_cors_config() {
    log_info "🔗 Actualizando configuraciones CORS..."

    # Crear lista de orígenes dinámicos basados en endpoints actuales
    local cors_origins=""

    # Agregar endpoints dinámicos detectados
    if [[ -n "$HTTP_ENDPOINT" ]]; then
        # Extraer dominio del endpoint HTTP para CORS
        local http_origin=$(echo "$HTTP_ENDPOINT" | sed 's|/[^/]*$||')
        cors_origins="$cors_origins,$http_origin"
    fi

    # Agregar orígenes estándar
    cors_origins="$cors_origins,http://localhost:3000,http://localhost:4700,http://localhost:5173,http://localhost:5174"
    cors_origins="$cors_origins,https://d2s9nr0bm47yl1.cloudfront.net,https://d2zt8ia21te5mv.cloudfront.net"
    cors_origins="$cors_origins,http://54.90.132.233:3000"

    # Limpiar comas iniciales
    cors_origins=$(echo "$cors_origins" | sed 's/^,//')

    log_info "Orígenes CORS configurados: $cors_origins"

    # Crear archivo de configuración CORS temporal
    local cors_config_file="$PROJECT_ROOT/config/endpoints/cors-config.json"
    mkdir -p "$(dirname "$cors_config_file")"

    cat > "$cors_config_file" << EOF
{
  "allowedOrigins": [
    "http://localhost:3000",
    "http://localhost:4700",
    "http://localhost:5173",
    "http://localhost:5174",
    "https://d2s9nr0bm47yl1.cloudfront.net",
    "https://d2zt8ia21te5mv.cloudfront.net",
    "http://54.90.132.233:3000"
  ],
  "dynamicOrigins": {
    "apiEndpoint": "$HTTP_ENDPOINT",
    "wsEndpoint": "$WS_ENDPOINT",
    "stage": "$STAGE"
  },
  "autoDetect": {
    "localhost": true,
    "cloudfront": true,
    "amplify": true,
    "executeApi": true
  },
  "lastUpdated": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")"
}
EOF

    log_success "✅ Configuraciones CORS actualizadas"
}

# Mostrar resumen de sincronización
show_sync_summary() {
    echo ""
    log_info "📋 Resumen de sincronización:"
    echo ""
    log_info "🔗 Endpoints sincronizados:"
    echo "  📡 HTTP API: $HTTP_ENDPOINT"
    if [[ -n "$WS_ENDPOINT" ]]; then
        echo "  🔌 WebSocket API: $WS_ENDPOINT"
    fi
    echo "  🏷️  Stage: $STAGE"
    echo ""
    log_info "📁 Archivos actualizados:"
    echo "  🖥️  frontend/src/api/dynamic-endpoints.ts"
    echo "  📱 public-tests/src/config/dynamic-endpoints.ts"
    echo "  🔄 config/endpoints/centralized-config.ts"
    echo "  📊 config/endpoints/sync-status.json"
    echo "  🔗 config/endpoints/cors-config.json"
    echo ""
    log_info "🔗 Configuración CORS actualizada:"
    echo "  🚀 Auto-detecta: localhost, CloudFront, Amplify, API Gateway"
    echo "  📋 Orígenes específicos configurados dinámicamente"
    echo "  🔧 Middleware inteligente para desarrollo/producción"
    echo ""
    log_info "💡 Los frontends ahora apuntan automáticamente a:"
    echo "   $HTTP_ENDPOINT"
    echo ""
}

# Ejecutar función principal
main "$@"
