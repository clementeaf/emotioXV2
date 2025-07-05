#!/bin/bash

# 🚀 EmotioXV2 - Deploy Ambos Frontends a S3/CloudFront
# Script optimizado para deployment completo

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

# Función principal
main() {
    echo ""
    log_info "🚀 Iniciando deployment completo de EmotioXV2..."
    echo ""

    # Verificar dependencias
    check_dependencies

    # Deploy de public-tests
    deploy_public_tests

    # Deploy del frontend
    deploy_frontend

    # Mostrar resumen final
    show_final_summary

    echo ""
    log_success "✅ Deployment completo finalizado exitosamente!"
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

    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js no está instalado"
        exit 1
    fi

    # Verificar npm
    if ! command -v npm &> /dev/null; then
        log_error "npm no está instalado"
        exit 1
    fi

    log_success "Todas las dependencias están disponibles"
}

# Deploy de public-tests
deploy_public_tests() {
    echo ""
    log_info "📱 [1/2] Deploy de public-tests..."
    echo ""

    # Configuración para public-tests
    PUBLIC_TESTS_DIR="public-tests"
    BUILD_DIR="dist"
    BUCKET_NAME="emotioxv2-public-tests-bucket"
    CLOUDFRONT_DIST_ID="E2X8HCFI5FM1EC"

    # Build de public-tests
    log_info "Construyendo public-tests..."
    cd "$PUBLIC_TESTS_DIR"

    # Limpiar builds anteriores
    if [ -d "$BUILD_DIR" ]; then
        rm -rf "$BUILD_DIR"
    fi

    # Instalar dependencias si es necesario
    if [ ! -d "node_modules" ] || [ package.json -nt node_modules ]; then
        npm ci --silent
    fi

    # Build del proyecto
    npm run build --silent

    # Verificar build
    if [ ! -d "$BUILD_DIR" ]; then
        log_error "Build de public-tests falló"
        exit 1
    fi

    cd ..

    # Deploy a S3
    log_info "Desplegando public-tests a S3..."
    aws s3 sync "$PUBLIC_TESTS_DIR/$BUILD_DIR" "s3://$BUCKET_NAME" --delete --quiet

    # Invalidar CloudFront
    log_info "Invalidando caché de CloudFront para public-tests..."
    aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DIST_ID" --paths "/*" --quiet

    log_success "✅ Public-tests desplegado correctamente"
}

# Deploy del frontend
deploy_frontend() {
    echo ""
    log_info "🖥️  [2/2] Deploy del frontend..."
    echo ""

    # Configuración para frontend
    FRONTEND_DIR="frontend"
    BUILD_DIR="out"
    BUCKET_NAME="emotioxv2-frontend-bucket"
    CLOUDFRONT_DIST_ID="E3MCIWNMF6ES2R"

    # Build del frontend
    log_info "Construyendo frontend..."
    cd "$FRONTEND_DIR"

    # Limpiar builds anteriores
    if [ -d "$BUILD_DIR" ]; then
        rm -rf "$BUILD_DIR"
    fi

    # Instalar dependencias si es necesario
    if [ ! -d "node_modules" ] || [ package.json -nt node_modules ]; then
        npm ci --silent
    fi

    # Build del proyecto
    npm run build --silent

    # Verificar build
    if [ ! -d "$BUILD_DIR" ]; then
        log_error "Build del frontend falló"
        exit 1
    fi

    cd ..

    # Deploy a S3
    log_info "Desplegando frontend a S3..."
    aws s3 sync "$FRONTEND_DIR/$BUILD_DIR" "s3://$BUCKET_NAME" --delete --quiet

    # Invalidar CloudFront
    log_info "Invalidando caché de CloudFront para frontend..."
    aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DIST_ID" --paths "/*" --quiet

    log_success "✅ Frontend desplegado correctamente"
}

# Mostrar resumen final
show_final_summary() {
    echo ""
    log_info "📋 Resumen del deployment completo:"
    echo ""
    log_info "🔗 URLs disponibles:"
    echo "  📱 Public-Tests: https://d2zt8ia21te5mv.cloudfront.net/"
    echo "  🖥️  Frontend: https://d2s9nr0bm47yl1.cloudfront.net/"
    echo ""
    log_info "💡 Configuración para el frontend:"
    echo "   NEXT_PUBLIC_PUBLIC_TESTS_URL=https://d2zt8ia21te5mv.cloudfront.net/"
    echo ""
    log_warning "⏱️  La propagación de CloudFront puede tomar hasta 15 minutos"
}

# Ejecutar función principal
main
