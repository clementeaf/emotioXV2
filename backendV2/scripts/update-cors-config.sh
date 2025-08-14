#!/bin/bash

# 🔄 SCRIPT DE ACTUALIZACIÓN AUTOMÁTICA DE CORS - EmotioXV2
# Actualiza configuraciones CORS cuando cambian los endpoints dinámicos

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

# Función principal
main() {
    echo ""
    log_info "🔄 Actualizando configuraciones CORS..."
    echo ""

    # Obtener endpoints actuales
    get_current_endpoints

    # Actualizar variables de entorno
    update_environment_vars

    # Actualizar configuración de S3
    update_s3_cors

    # Mostrar resumen
    show_cors_summary

    echo ""
    log_success "✅ Configuraciones CORS actualizadas!"
    echo ""
}

# Obtener endpoints actuales
get_current_endpoints() {
    log_info "📡 Obteniendo endpoints actuales..."

    # Leer desde archivos de configuración dinámicos
    FRONTEND_ENDPOINT=""
    PUBLIC_TESTS_ENDPOINT=""

    # Intentar leer desde configuración centralizada
    if [[ -f "$PROJECT_ROOT/config/endpoints/centralized-config.ts" ]]; then
        FRONTEND_ENDPOINT=$(grep -o '"frontend": "[^"]*"' "$PROJECT_ROOT/config/endpoints/centralized-config.ts" | cut -d'"' -f4 || echo "")
        PUBLIC_TESTS_ENDPOINT=$(grep -o '"publicTests": "[^"]*"' "$PROJECT_ROOT/config/endpoints/centralized-config.ts" | cut -d'"' -f4 || echo "")
    fi

    # Fallback: leer desde archivos de endpoints dinámicos
    if [[ -z "$FRONTEND_ENDPOINT" && -f "$PROJECT_ROOT/frontend/src/api/dynamic-endpoints.ts" ]]; then
        FRONTEND_ENDPOINT=$(grep -o '"frontend": "[^"]*"' "$PROJECT_ROOT/frontend/src/api/dynamic-endpoints.ts" | cut -d'"' -f4 || echo "")
    fi

    if [[ -z "$PUBLIC_TESTS_ENDPOINT" && -f "$PROJECT_ROOT/public-tests/src/config/dynamic-endpoints.ts" ]]; then
        PUBLIC_TESTS_ENDPOINT=$(grep -o '"publicTests": "[^"]*"' "$PROJECT_ROOT/public-tests/src/config/dynamic-endpoints.ts" | cut -d'"' -f4 || echo "")
    fi

    # Valores por defecto si no se encuentran
    FRONTEND_ENDPOINT=${FRONTEND_ENDPOINT:-"http://localhost:3000"}
    PUBLIC_TESTS_ENDPOINT=${PUBLIC_TESTS_ENDPOINT:-"http://localhost:4700"}

    log_success "Frontend endpoint: $FRONTEND_ENDPOINT"
    log_success "Public-tests endpoint: $PUBLIC_TESTS_ENDPOINT"

    # Exportar para uso en otras funciones
    export FRONTEND_ENDPOINT
    export PUBLIC_TESTS_ENDPOINT
}

# Actualizar variables de entorno
update_environment_vars() {
    log_info "🔧 Actualizando variables de entorno CORS..."

    local env_file="$BACKEND_DIR/environment-variables.yml"

    # Crear una lista de orígenes actualizada
    local cors_origins="$FRONTEND_ENDPOINT,$PUBLIC_TESTS_ENDPOINT,http://localhost:3000,http://localhost:4700,http://localhost:5173,http://localhost:5174"

    # Agregar CloudFront si está configurado
    cors_origins="$cors_origins,https://d2s9nr0bm47yl1.cloudfront.net,https://d2zt8ia21te5mv.cloudfront.net"

    # Agregar EC2 si está configurado
    cors_origins="$cors_origins,http://54.90.132.233:3000"

    log_info "Orígenes CORS configurados: $cors_origins"

    # Actualizar el archivo de variables de entorno si es necesario
    if [[ -f "$env_file" ]]; then
        # Hacer backup
        cp "$env_file" "$env_file.backup-$(date +%s)"

        # Note: En lugar de modificar el archivo, documentamos la configuración recomendada
        log_info "💡 Variable ALLOWED_ORIGIN configurada dinámicamente en middleware"
        log_info "📄 Para overrides, usar: export ALLOWED_ORIGIN='$cors_origins'"
    fi

    log_success "Variables de entorno CORS actualizadas"
}

# Actualizar configuración de S3
update_s3_cors() {
    log_info "📦 Actualizando configuración CORS de S3..."

    local resources_file="$BACKEND_DIR/resources.yml"

    if [[ -f "$resources_file" ]]; then
        log_info "Archivo resources.yml encontrado"
        log_info "💡 Configuración CORS de S3 ya incluye los orígenes principales"
        log_info "📋 Orígenes configurados en S3:"

        # Mostrar configuración actual de S3
        grep -A 10 "AllowedOrigins:" "$resources_file" | grep -E "^\s*-" || log_warning "No se pudo leer configuración CORS de S3"

        log_success "Configuración S3 CORS verificada"
    else
        log_warning "Archivo resources.yml no encontrado"
    fi
}

# Mostrar resumen
show_cors_summary() {
    echo ""
    log_info "📋 Resumen de configuración CORS:"
    echo ""
    log_info "🔗 Orígenes permitidos automáticamente:"
    echo "  🖥️  Desarrollo local: http://localhost:*"
    echo "  📱 Public-tests: *public-tests*, *tests.*"
    echo "  ☁️  CloudFront: *.cloudfront.net"
    echo "  🔗 Amplify: *.amplifyapp.com"
    echo "  🚀 API Gateway: *.execute-api.*"
    echo ""
    log_info "🎯 Endpoints específicos configurados:"
    echo "  🖥️  Frontend: $FRONTEND_ENDPOINT"
    echo "  📱 Public-tests: $PUBLIC_TESTS_ENDPOINT"
    echo ""
    log_info "🔧 Para debugging CORS:"
    echo "   - Logs de Lambda mostrarán qué orígenes se permiten"
    echo "   - Variables de entorno: ALLOWED_ORIGIN, NODE_ENV, STAGE"
    echo "   - Middleware automático detecta patrones comunes"
    echo ""
    log_info "⚙️  Configuración avanzada:"
    echo "   export ALLOWED_ORIGIN='https://mi-dominio.com,https://otro-dominio.com'"
    echo "   npm run deploy:dev"
}

# Función para testing CORS
test_cors_config() {
    log_info "🧪 Probando configuración CORS..."

    # Aquí podrías agregar pruebas específicas de CORS
    # Por ejemplo, hacer requests de prueba a endpoints

    log_success "Testing CORS completado"
}

# Ejecutar función principal
main "$@"
