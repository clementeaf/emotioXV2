#!/bin/bash

# ✅ EmotioXV2 - Validar Deployment
# Script para verificar que los deployments están funcionando

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

# URLs a validar
FRONTEND_URL="https://d2s9nr0bm47yl1.cloudfront.net/"
PUBLIC_TESTS_URL="https://d2zt8ia21te5mv.cloudfront.net/"

# Función principal
main() {
    echo ""
    log_info "✅ Validando deployments de EmotioXV2..."
    echo ""

    # Verificar dependencias
    check_dependencies

    # Validar frontend
    validate_frontend

    # Validar public-tests
    validate_public_tests

    # Mostrar resumen
    show_summary

    echo ""
    log_success "✅ Validación completada"
    echo ""
}

# Verificar dependencias
check_dependencies() {
    log_info "Verificando dependencias..."

    # Verificar curl
    if ! command -v curl &> /dev/null; then
        log_error "curl no está instalado"
        exit 1
    fi

    log_success "Dependencias disponibles"
}

# Validar frontend
validate_frontend() {
    log_info "🖥️  Validando frontend..."

    # Test de conectividad
    if curl -s --max-time 10 --connect-timeout 10 "$FRONTEND_URL" > /dev/null 2>&1; then
        log_success "✅ Frontend responde correctamente"

        # Verificar que no es una página de error
        local response=$(curl -s --max-time 10 "$FRONTEND_URL")
        if echo "$response" | grep -q "index\.html\|EmotioX\|Next\.js"; then
            log_success "✅ Frontend muestra contenido válido"
        else
            log_warning "⚠️  Frontend responde pero contenido inesperado"
        fi
    else
        log_error "❌ Frontend no responde"
        return 1
    fi
}

# Validar public-tests
validate_public_tests() {
    log_info "📱 Validando public-tests..."

    # Test de conectividad
    if curl -s --max-time 10 --connect-timeout 10 "$PUBLIC_TESTS_URL" > /dev/null 2>&1; then
        log_success "✅ Public-tests responde correctamente"

        # Verificar que no es una página de error
        local response=$(curl -s --max-time 10 "$PUBLIC_TESTS_URL")
        if echo "$response" | grep -q "index\.html\|Vite\|React"; then
            log_success "✅ Public-tests muestra contenido válido"
        else
            log_warning "⚠️  Public-tests responde pero contenido inesperado"
        fi
    else
        log_error "❌ Public-tests no responde"
        return 1
    fi
}

# Mostrar resumen
show_summary() {
    echo ""
    log_info "📋 Resumen de validación:"
    echo ""
    log_info "🔗 URLs validadas:"
    echo "  🖥️  Frontend: $FRONTEND_URL"
    echo "  📱 Public-Tests: $PUBLIC_TESTS_URL"
    echo ""
    log_info "💡 Próximos pasos:"
    echo "  1. Visita las URLs para verificar funcionalidad"
    echo "  2. Ejecuta `bash scripts/deploy/show-urls.sh` para ver todas las URLs"
    echo "  3. Si hay problemas, ejecuta el deployment nuevamente"
}

# Ejecutar función principal
main
